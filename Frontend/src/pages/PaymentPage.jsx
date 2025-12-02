
import "./PaymentPage.css";
import { CheckoutSteps } from "../components/CheckoutSteps";
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearcart } from '../store/CartSlice';

export function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { restId, orderId, amount, payload } = location.state || {};
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const [method, setMethod] = useState('');

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
  const grandTotal = +(subtotal + deliveryFee + taxes).toFixed(2);
  const restIdEffective = restId || srcPayload.rest_id || storeRestId || null;

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
          restaurantName: srcPayload.restaurantName || ''
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

        <section className="charge-summary">
          <div className="row"><span>Subtotal</span><span>₹ {subtotal.toFixed(2)}</span></div>
          <div className="row"><span>Delivery Fee</span><span>₹ {deliveryFee.toFixed(2)}</span></div>
          <div className="row"><span>Taxes (8%)</span><span>₹ {taxes.toFixed(2)}</span></div>
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