
import "./PaymentPage.css";

export function PaymentPage() {
  return (
    <div className="payment-page">
      <div className="payment-card">
        <header className="payment-header">
          <h1>Secure payment</h1>
          <p>Choose your preferred payment method to complete your order.</p>
        </header>

        <section className="payment-methods">
          <div className="method-group">
            <h2>Pay with card</h2>
            <div className="field-row">
              <label>
                Card number
                <input type="text" placeholder="1234 5678 9012 3456" />
              </label>
            </div>
            <div className="field-row two-cols">
              <label>
                Expiry
                <input type="text" placeholder="MM/YY" />
              </label>
              <label>
                CVV
                <input type="password" placeholder="***" />
              </label>
            </div>
          </div>

          <div className="method-group">
            <h2>Or UPI / Wallet</h2>
            <div className="pill-row">
              <button type="button">UPI</button>
              <button type="button">Google Pay</button>
              <button type="button">PhonePe</button>
              <button type="button">Paytm</button>
            </div>
          </div>
        </section>

        <footer className="payment-footer">
          <div className="summary">
            <span>Total</span>
            <strong>₹ —</strong>
          </div>
          <button className="pay-btn" type="button">
            Pay &amp; place order
          </button>
        </footer>
      </div>
    </div>
  );
}