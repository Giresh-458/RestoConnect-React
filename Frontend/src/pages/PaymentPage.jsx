
import "./PaymentPage.css";
import { CheckoutSteps } from "../components/CheckoutSteps";
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearcart, setPromoCode, clearPromoCode } from '../store/CartSlice';

export function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { restId, orderId, amount, payload } = location.state || {};
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const [method, setMethod] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoCodeError, setPromoCodeError] = useState(null);
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
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
  const deliveryFee = 3.0;
  const taxes = +(subtotal * 0.08).toFixed(2);
  const subtotalWithTaxes = +(subtotal + deliveryFee + taxes).toFixed(2);
  const finalDiscount = promoDiscount > subtotalWithTaxes ? subtotalWithTaxes : promoDiscount;
  const grandTotal = +(subtotalWithTaxes - finalDiscount).toFixed(2);
  const restIdEffective = restId || srcPayload.rest_id || storeRestId || null;

  const handlePromoCodeApply = async () => {
    if (!promoCodeInput.trim()) {
      setPromoCodeError('Please enter a promo code');
      return;
    }

    setPromoCodeError(null);
    setPromoCodeLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/customer/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: promoCodeInput.trim().toUpperCase(),
          orderAmount: subtotalWithTaxes,
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

  const handlePay = async () => {
    setProcessing(true);
    setError(null);
    if (!method) {
      setProcessing(false);
      setError('Please select a payment method.');
      return;
    }

    // Validate required data
    if (!restIdEffective) {
      setProcessing(false);
      setError('Restaurant information is missing. Please go back and try again.');
      return;
    }

    if (!items || items.length === 0) {
      setProcessing(false);
      setError('No items in cart. Please add items before payment.');
      return;
    }

    try {
      let resp, data;
      // If orderId exists, confirm it. Otherwise create then pay.
      if (orderId) {
        resp = await fetch('http://localhost:3000/api/customer/checkout/pay', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          credentials: 'include',
          body: JSON.stringify({ orderId, rest_id: restIdEffective })
        });
        data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.error || data.message || 'Payment failed');
        }
      } else {
        // Ensure items have the correct structure
        const formattedItems = items.map(item => ({
          name: item.name || item.dish || item.id || '',
          quantity: item.quantity || 1,
          price: item.price || item.amount || 0,
          dish: item.dish || item.name || item.id || '',
          id: item.id || item._id || ''
        })).filter(item => item.name || item.dish);

        if (formattedItems.length === 0) {
          throw new Error('No valid items found. Please check your cart.');
        }

        const bodyPayload = {
          ...srcPayload,
          items: formattedItems,
          rest_id: srcPayload.rest_id || restIdEffective,
          totalAmount: grandTotal,
          restaurantName: srcPayload.restaurantName || '',
          promoCode: promoCode || null,
          promoDiscount: finalDiscount || 0,
        };

        // Only include reservation if it has required fields (date and time - table_id is optional)
        if (bodyPayload.reservation && (!bodyPayload.reservation.date || !bodyPayload.reservation.time)) {
          // Remove incomplete reservation data
          delete bodyPayload.reservation;
        }

        // First try a two-step: create then pay
        let createdOrderId = null;
        try {
          const createResp = await fetch('http://localhost:3000/api/customer/checkout', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            credentials: 'include',
            body: JSON.stringify(bodyPayload)
          });
          const createData = await createResp.json();
          if (!createResp.ok) {
            throw new Error(createData.error || createData.message || 'Failed to create order');
          }
          createdOrderId = (createData && createData.data && createData.data.orderId) || createData.orderId;
          if (!createdOrderId) {
            throw new Error('Missing orderId from checkout');
          }
          
          resp = await fetch('http://localhost:3000/api/customer/checkout/pay', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            credentials: 'include',
            body: JSON.stringify({ orderId: createdOrderId, rest_id: bodyPayload.rest_id || restIdEffective })
          });
          data = await resp.json();
          if (!resp.ok) {
            throw new Error(data.error || data.message || 'Payment failed');
          }
        } catch (stepErr) {
          // Fallback to one-step: let backend create+pay from payload
          const payResp = await fetch('http://localhost:3000/api/customer/checkout/pay', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            credentials: 'include',
            body: JSON.stringify({ payload: bodyPayload })
          });
          const payData = await payResp.json();
          if (!payResp.ok) {
            throw new Error(payData.error || payData.message || 'Payment failed');
          }
          data = payData;
        }
      }

      // Extract orderId in a tolerant way
      const newOrderId = (data && data.data && data.data.orderId) || data.orderId || (data && data.data && data.data.order?._id) || (data && data.data && data.data.order?.id);
      if (!newOrderId) {
        throw new Error('Missing orderId in response');
      }

      // Apply promo code usage if promo code was used
      if (promoCode) {
        try {
          await fetch('http://localhost:3000/api/customer/promo/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ code: promoCode }),
          });
        } catch (e) {
          console.warn('Failed to apply promo code usage:', e);
        }
      }

      try { 
        dispatch(clearcart()); 
      } catch (e) {
        console.warn('Failed to clear cart:', e);
      }
      
      const destRest = restIdEffective;
      navigate('/customer/order-placed', { state: { restId: destRest, orderId: newOrderId } });
    } catch (err) {
      console.error('Payment error:', err);
      setError(`Payment failed. ${err?.message || 'Server error. Please try again.'}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="steps-row">
          <CheckoutSteps current="payment" />
        </div>
        <div className="payment-card">
          <header className="payment-header">
            <div className="header-row">
              <button type="button" className="back-btn" onClick={() => navigate(-1)}>← Back</button>
              <h1>Secure payment</h1>
            </div>
            <p>Choose your preferred payment method to complete your order.</p>
            <div className="due-total">Total due: <strong>₹ {grandTotal.toFixed(2)}</strong></div>
          </header>

        {error && <div className="payment-error">{error}</div>}

        <section className="payment-methods">
          <div className="method-group">
            <h2>Pay with card</h2>
            <div className="field-row">
              <label>
                Card number
                <input type="text" placeholder="1234 5678 9012 3456" onFocus={() => setMethod('card')} />
              </label>
            </div>
            <div className="field-row two-cols">
              <label>
                Expiry
                <input type="text" placeholder="MM/YY" onFocus={() => setMethod('card')} />
              </label>
              <label>
                CVV
                <input type="password" placeholder="***" onFocus={() => setMethod('card')} />
              </label>
            </div>
          </div>

          <div className="method-group">
            <h2>Or UPI / Wallet</h2>
            <div className="pill-row">
              <button type="button" className={method === 'upi' ? 'selected' : ''} onClick={() => setMethod('upi')}>UPI</button>
              <button type="button" className={method === 'gpay' ? 'selected' : ''} onClick={() => setMethod('gpay')}>Google Pay</button>
              <button type="button" className={method === 'phonepe' ? 'selected' : ''} onClick={() => setMethod('phonepe')}>PhonePe</button>
              <button type="button" className={method === 'paytm' ? 'selected' : ''} onClick={() => setMethod('paytm')}>Paytm</button>
            </div>
          </div>
        </section>

        <section className="promo-section" style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>Promo Code</h3>
          {promoCode ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#e8f5e9', borderRadius: '6px', marginBottom: '8px' }}>
              <div>
                <strong style={{ color: '#2e7d32' }}>{promoCode}</strong>
                <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>Applied</span>
              </div>
              <button
                type="button"
                onClick={handlePromoCodeRemove}
                style={{
                  background: 'transparent',
                  border: '1px solid #c62828',
                  color: '#c62828',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCodeInput}
                onChange={(e) => {
                  setPromoCodeInput(e.target.value.toUpperCase());
                  setPromoCodeError(null);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePromoCodeApply();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: promoCodeError ? '2px solid #d32f2f' : '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
              <button
                type="button"
                onClick={handlePromoCodeApply}
                disabled={promoCodeLoading || !promoCodeInput.trim()}
                style={{
                  padding: '10px 20px',
                  background: promoCodeLoading || !promoCodeInput.trim() ? '#ccc' : '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: promoCodeLoading || !promoCodeInput.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                {promoCodeLoading ? 'Applying...' : 'Apply'}
              </button>
            </div>
          )}
          {promoCodeError && (
            <div style={{ marginTop: '8px', color: '#d32f2f', fontSize: '13px' }}>
              {promoCodeError}
            </div>
          )}
        </section>

        <section className="charge-summary">
          <div className="row"><span>Subtotal</span><span>₹ {subtotal.toFixed(2)}</span></div>
          <div className="row"><span>Delivery Fee</span><span>₹ {deliveryFee.toFixed(2)}</span></div>
          <div className="row"><span>Taxes (8%)</span><span>₹ {taxes.toFixed(2)}</span></div>
          {promoCode && finalDiscount > 0 && (
            <div className="row" style={{ color: '#2e7d32', fontWeight: '600' }}>
              <span>Promo Code Discount ({promoCode})</span>
              <span>-₹ {finalDiscount.toFixed(2)}</span>
            </div>
          )}
        </section>

        <footer className="payment-footer">
          <div className="summary">
            <span>Total</span>
            <strong>₹ {grandTotal.toFixed(2)}</strong>
          </div>
          <button className="pay-btn" type="button" onClick={handlePay} disabled={processing || !method}>
            {processing ? 'Processing...' : 'Pay & place order'}
          </button>
        </footer>
        </div>
      </div>
    </div>
  );
}