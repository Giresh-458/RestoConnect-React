import styles from "./PaymentPage.module.css";
import { CheckoutSteps } from "../components/CheckoutSteps";
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useDispatch, useSelector } from 'react-redux';
import { clearcart, setPromoCode, clearPromoCode } from '../store/CartSlice';

const stripePublishableKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "").trim();
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;



export function StripeCheckout({ grandTotal, onSuccess, onError, disabled }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleStripePay = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    try {
      if (!stripe || !elements) {
        throw new Error('Stripe is not ready yet. Please try again.');
      }
      const cardEl = elements.getElement(CardElement);
      if (!cardEl) {
        throw new Error('Card element not found. Please refresh and try again.');
      }
      // Create PaymentIntent on backend
      const resp = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(grandTotal * 100), currency: 'inr' }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.clientSecret) throw new Error(data.error || 'Failed to create payment intent');

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardEl,
        },
      });
      if (result.error) {
        setError(result.error.message);
        onError && onError(result.error.message);
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        onSuccess && onSuccess(result.paymentIntent);
      }
    } catch (err) {
      setError(err.message);
      onError && onError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleStripePay} style={{ marginTop: 16 }}>
      <CardElement options={{ hidePostalCode: true }} />
      {error && <div style={{ color: '#d32f2f', marginTop: 8 }}>{error}</div>}
      <button type="submit" disabled={!stripe || processing || disabled} style={{ marginTop: 16 }}>
        {processing ? 'Processing...' : 'Pay with Card (Stripe)'}
      </button>
    </form>
  );
}

export function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { restId, orderId, payload } = location.state || {};
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const [method, setMethod] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoCodeError, setPromoCodeError] = useState(null);
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
  const [availablePromos, setAvailablePromos] = useState([]);
  const promoCode = useSelector((state) => state.cart?.promoCode || null);
  const promoDiscount = useSelector((state) => state.cart?.promoDiscount || 0);

  // Derive totals and effective rest id
  const srcPayload = payload || {};
  const storeCartItems = useSelector((state) => state.cart?.dishes || []);
  const storeRestId = useSelector((state) => state.cart?.restId || null);
  const items = Array.isArray(srcPayload.items) && srcPayload.items.length > 0 ? srcPayload.items : storeCartItems;
  const subtotal = (typeof srcPayload.totalAmount === 'number' && !Number.isNaN(srcPayload.totalAmount))
    ? srcPayload.totalAmount
    : items.reduce((s, it) => s + ((it.amount ?? it.price ?? 0) * (it.quantity ?? 1)), 0);
  const deliveryFee = Number(srcPayload.deliveryFee ?? 3.0) || 0;
  const taxRate = Number(srcPayload.taxRate ?? 0) || 0;
  const serviceChargeRate = Number(srcPayload.serviceCharge ?? 0) || 0;
  const taxes = +(subtotal * (taxRate / 100)).toFixed(2);
  const serviceCharge = +(subtotal * (serviceChargeRate / 100)).toFixed(2);
  const subtotalWithTaxes = +(subtotal + deliveryFee + taxes + serviceCharge).toFixed(2);
  const finalDiscount = promoDiscount > subtotalWithTaxes ? subtotalWithTaxes : promoDiscount;
  const grandTotal = +(subtotalWithTaxes - finalDiscount).toFixed(2);
  const restIdEffective = restId || srcPayload.rest_id || storeRestId || null;

  useEffect(() => {
    const loadPromos = async () => {
      if (!restIdEffective) return;
      try {
        const response = await fetch(`/api/customer/promo/available?rest_id=${encodeURIComponent(restIdEffective)}`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setAvailablePromos(Array.isArray(data.data) ? data.data : []);
        }
      } catch {
        setAvailablePromos([]);
      }
    };
    loadPromos();
  }, [restIdEffective]);

  const handlePromoCodeApply = async () => {
    if (!promoCodeInput.trim()) {
      setPromoCodeError('Please enter a promo code');
      return;
    }

    setPromoCodeError(null);
    setPromoCodeLoading(true);

    try {
      const response = await fetch('/api/customer/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: promoCodeInput.trim().toUpperCase(),
          orderAmount: subtotalWithTaxes,
          rest_id: restIdEffective,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid promo code');
      }

      if (data.success && data.data) {
        dispatch(setPromoCode({
          code: data.data.code,
          discount: data.data.discount,
        }));
        setPromoCodeInput('');
        setPromoCodeError(null);
      } else {
        throw new Error('Failed to apply promo code');
      }
    } catch (err) {
      setPromoCodeError(err.message || 'Failed to apply promo code');
      dispatch(clearPromoCode());
    } finally {
      setPromoCodeLoading(false);
    }
  };

  const handlePromoCodeRemove = () => {
    dispatch(clearPromoCode());
    setPromoCodeInput('');
    setPromoCodeError(null);
  };

  return (
    <div className={styles.paymentPage}>
      <CheckoutSteps current="payment" />

      <div className={styles.paymentContainer}>
        <div className={styles.paymentCard}>
          <header className={styles.paymentHeader}>
            <div className={styles.headerRow}>
              <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
              <h1>Secure Payment</h1>
            </div>
            <p className={styles.headerDescription}>Choose your preferred payment method to complete your order.</p>
            <div className={styles.dueTotal}>
              <span>Total due</span>
              <strong>₹ {grandTotal.toFixed(2)}</strong>
            </div>
          </header>

          {error && <div className={styles.paymentError}>{error}</div>}

          <section className={styles.paymentMethods}>
            <div className={styles.methodGroup}>
              <h2>💳 Pay with Card (Stripe)</h2>
              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <StripeCheckout
                    grandTotal={grandTotal}
                    onSuccess={async (paymentIntent) => {
                      try {
                        setProcessing(true);
                        setError(null);

                        const resp = await fetch('/api/customer/checkout/pay', {
                          method: 'POST',
                          credentials: 'include',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            rest_id: restIdEffective,
                            payload: {
                              rest_id: restIdEffective,
                              restaurant: srcPayload.restaurantName || srcPayload.restaurant || null,
                              items,
                              totalAmount: subtotalWithTaxes,
                              reservation: srcPayload.reservation || null,
                              promoCode: promoCode || null,
                              // helpful for debugging/auditing if you later store it server-side
                              stripePaymentIntentId: paymentIntent?.id || null,
                            },
                          }),
                        });
                        const data = await resp.json();
                        if (!resp.ok) throw new Error(data.error || data.message || 'Failed to create order');

                        const createdOrderId = data?.data?.orderId || data?.orderId || null;
                        if (!createdOrderId) throw new Error('Order created but orderId missing from response');

                        dispatch(clearcart());
                        navigate('/customer/order-placed', { state: { restId: restIdEffective, orderId: createdOrderId } });
                      } catch (e) {
                        setError(e.message || 'Failed to finalize order after payment');
                      } finally {
                        setProcessing(false);
                      }
                    }}
                    onError={setError}
                    disabled={processing}
                  />
                </Elements>
              ) : (
                <div className={styles.paymentError}>
                  Stripe is not configured. Set <strong>VITE_STRIPE_PUBLISHABLE_KEY</strong> in your Frontend <code>.env</code>.
                </div>
              )}
            </div>

            <div className={styles.methodGroup}>
              <h2>📱 UPI / Wallet</h2>
              <div className={styles.pillRow}>
                <button type="button" className={`${styles.pillBtn} ${method === 'upi' ? styles.pillBtnSelected : ''}`} onClick={() => setMethod('upi')}>UPI</button>
                <button type="button" className={`${styles.pillBtn} ${method === 'gpay' ? styles.pillBtnSelected : ''}`} onClick={() => setMethod('gpay')}>Google Pay</button>
                <button type="button" className={`${styles.pillBtn} ${method === 'phonepe' ? styles.pillBtnSelected : ''}`} onClick={() => setMethod('phonepe')}>PhonePe</button>
                <button type="button" className={`${styles.pillBtn} ${method === 'paytm' ? styles.pillBtnSelected : ''}`} onClick={() => setMethod('paytm')}>Paytm</button>
              </div>
            </div>
          </section>

          <section className={styles.promoSection}>
            <h3>Promo Code</h3>
            {!promoCode && availablePromos.length > 0 && (
              <div className={styles.promoInputRow}>
                <select
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  className={styles.promoInput}
                >
                  <option value="">Select available promo</option>
                  {availablePromos.map((promo) => (
                    <option key={promo._id || promo.code} value={promo.code}>
                      {promo.code} - {promo.discountType === 'fixed' ? `₹${promo.discountValue}` : `${promo.discountValue}%`} OFF
                    </option>
                  ))}
                </select>
              </div>
            )}
            {promoCode ? (
              <div className={styles.promoApplied}>
                <div>
                  <span className={styles.promoAppliedCode}>{promoCode}</span>
                  <span className={styles.promoAppliedBadge}>Applied ✓</span>
                </div>
                <button type="button" onClick={handlePromoCodeRemove} className={styles.promoRemoveBtn}>Remove</button>
              </div>
            ) : (
              <div className={styles.promoInputRow}>
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCodeInput}
                  onChange={(e) => { setPromoCodeInput(e.target.value.toUpperCase()); setPromoCodeError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePromoCodeApply(); } }}
                  className={`${styles.promoInput} ${promoCodeError ? styles.promoInputError : ''}`}
                />
                <button
                  type="button"
                  onClick={handlePromoCodeApply}
                  disabled={promoCodeLoading || !promoCodeInput.trim()}
                  className={styles.promoApplyBtn}
                >
                  {promoCodeLoading ? 'Applying...' : 'Apply'}
                </button>
              </div>
            )}
            {promoCodeError && <div className={styles.promoError}>{promoCodeError}</div>}
          </section>

          <section className={styles.chargeSummary}>
            <div className={styles.chargeRow}><span>Subtotal</span><span>₹ {subtotal.toFixed(2)}</span></div>
            <div className={styles.chargeRow}><span>Delivery Fee</span><span>₹ {deliveryFee.toFixed(2)}</span></div>
            <div className={styles.chargeRow}><span>Taxes ({taxRate}%)</span><span>₹ {taxes.toFixed(2)}</span></div>
            {serviceChargeRate > 0 && <div className={styles.chargeRow}><span>Service Charge ({serviceChargeRate}%)</span><span>₹ {serviceCharge.toFixed(2)}</span></div>}
            {promoCode && finalDiscount > 0 && (
              <div className={`${styles.chargeRow} ${styles.chargeRowDiscount}`}>
                <span>Promo Discount ({promoCode})</span>
                <span>-₹ {finalDiscount.toFixed(2)}</span>
              </div>
            )}
          </section>

          <footer className={styles.paymentFooter}>
            <div className={styles.footerSummary}>
              <span>Total</span>
              <strong>₹ {grandTotal.toFixed(2)}</strong>
            </div>
            {/* Stripe handles payment button above. Remove legacy pay button. */}
          </footer>
        </div>
      </div>
    </div>
  );
}
