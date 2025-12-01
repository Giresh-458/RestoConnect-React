import { useState } from "react";
import { useNavigate, useLocation, redirect } from "react-router-dom";
import { useSelector } from "react-redux";
import { CheckoutSteps } from "../components/CheckoutSteps";
import { isLogin } from "../util/auth";
import styles from "./OrderPage.module.css";

export function OrderPage() {
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.dishes || []);

  const [processing, setProcessing] = useState(false);
  const [reservation, setReservation] = useState({ date: "", time: "", guests: 2, name: "", phone: "", notes: "" });
  const [reservationError, setReservationError] = useState(null);

  const location = useLocation();
  const navState = location.state || {};
  const restIdFromState = navState.restId || null;
  const restNameFromState = navState.restName || "Restaurant";
  const pad = (n) => String(n).padStart(2, '0');
  const todayDate = new Date();
  const minDate = `${todayDate.getFullYear()}-${pad(todayDate.getMonth() + 1)}-${pad(todayDate.getDate())}`;
  const maxDateObj = new Date(todayDate);
  maxDateObj.setDate(maxDateObj.getDate() + 3);
  const maxDate = `${maxDateObj.getFullYear()}-${pad(maxDateObj.getMonth() + 1)}-${pad(maxDateObj.getDate())}`;
  const openTime = "08:00";
  const closeTime = "23:00";

  const subtotal = cartItems.reduce(
    (s, it) => s + (it.amount || it.price || 0) * (it.quantity || 1),
    0
  );
  const deliveryFee = 3.0;
  const taxes = +(subtotal * 0.08).toFixed(2);
  const finalTotal = (subtotal + deliveryFee + taxes).toFixed(2);

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    const { date, time, guests, name, phone, notes } = reservation;
    setReservationError(null);

    // Basic required check
    if (!date || !time || !guests || !name || !phone) {
      setReservationError('Please fill all required fields.');
      return;
    }

    // Date must be within today..+3 days
    if (date < minDate || date > maxDate) {
      setReservationError('Please select a date within the next 3 days.');
      return;
    }

    // Guests limit 1..12
    if (guests < 1 || guests > 12) {
      setReservationError('Guests must be between 1 and 12.');
      return;
    }

    // Time must be a valid future time for same-day reservations
    const selectedDateTime = new Date(`${date}T${time}`);
    if (Number.isNaN(selectedDateTime.getTime())) {
      setReservationError('Please select a valid time.');
      return;
    }
    // Time must be between 08:00 and 23:00
    if (time < openTime || time > closeTime) {
      setReservationError('Time must be between 08:00 and 23:00.');
      return;
    }
    const todayStr = minDate;
    if (date === todayStr && selectedDateTime <= new Date()) {
      setReservationError('Please choose a time later than now for today.');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        restaurantName: restNameFromState,
        rest_id: restIdFromState,
        items: cartItems,
        totalAmount: Number(subtotal.toFixed(2)),
        reservation: { date, time, guests, name, phone, notes },
      };
      navigate("/customer/payment", { state: { payload } });
    } catch (err) {
      console.error("Error creating reservation:", err);
      navigate("/customer/payment", {
        state: {
          payload: {
            rest_id: restIdFromState,
            items: cartItems,
            totalAmount: null,
            reservation: { date, time, guests, name, phone, notes },
          },
        },
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.orderPage}>
      <CheckoutSteps current="order" />

      <div className={styles.layout}>
        {/* Left: Order Summary */}
        <div className={styles.orderSummaryPanel}>
          <div className={styles.panelHeader}>
            <h2>Review your order</h2>
            {restNameFromState && <span className={styles.restaurantName}>{restNameFromState}</span>}
          </div>

          {cartItems.length === 0 ? (
            <div className={styles.emptyCart}>
              <p>Your cart is empty.</p>
              <button
                className={styles.secondaryButton}
                onClick={() =>
                  navigate(
                    restIdFromState ? `/customer/restaurant/${restIdFromState}` : "/customer/"
                  )
                }
              >
                Go to Menu
              </button>
            </div>
          ) : (
            <>
              <ul className={styles.summaryList}>
                {cartItems.map((item) => (
                  <li key={item.id} className={styles.summaryItem}>
                    <div className={styles.summaryMain}>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemMeta}>Qty: {item.quantity}</div>
                      </div>
                      <div className={styles.summaryPrice}>
                        ₹{((item.amount || item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className={styles.summaryTotals}>
                <div className={styles.totRow}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.totRow}>
                  <span>Delivery</span>
                  <span>₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className={styles.totRow}>
                  <span>Taxes & Charges</span>
                  <span>₹{taxes.toFixed(2)}</span>
                </div>
                <div className={styles.totTotal}>
                  <strong>Total</strong>
                  <strong>₹{finalTotal}</strong>
                </div>
              </div>

              <div className={styles.editCartRow}>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() =>
                    navigate(
                      restIdFromState ? `/customer/restaurant/${restIdFromState}` : "/customer/"
                    )
                  }
                >
                  Edit Cart
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: Mandatory Reservation */}
        <div className={styles.actionPanel}>
          <form className={styles.reservationForm} onSubmit={handleReservationSubmit}>
            <h3 className={styles.formTitle}>Reservation details (required)</h3>

            <label className={styles.formField}>
              <span>Date</span>
              <input
                type="date"
                min={minDate}
                max={maxDate}
                value={reservation.date}
                onChange={(e) => setReservation({ ...reservation, date: e.target.value })}
                required
              />
            </label>

            <label className={styles.formField}>
              <span>Time</span>
              <input
                type="time"
                step="900"
                min={openTime}
                max={closeTime}
                value={reservation.time}
                onChange={(e) => setReservation({ ...reservation, time: e.target.value })}
                required
              />
              <small className={styles.helpText}>Select between 08:00 and 23:00 (15-minute slots).</small>
            </label>

            <label className={styles.formField}>
              <span>Guests</span>
              <input
                type="number"
                min="1"
                max="20"
                value={reservation.guests}
                onChange={(e) =>
                  setReservation({ ...reservation, guests: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })
                }
                required
              />
            </label>

            <label className={styles.formField}>
              <span>Contact name</span>
              <input
                type="text"
                placeholder="Full name"
                value={reservation.name}
                onChange={(e) => setReservation({ ...reservation, name: e.target.value })}
                required
              />
            </label>

            <label className={styles.formField}>
              <span>Contact phone</span>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                pattern="[0-9]{10}"
                value={reservation.phone}
                onChange={(e) => setReservation({ ...reservation, phone: e.target.value.replace(/\D/g, '').slice(0,10) })}
                required
              />
              <small className={styles.helpText}>10-digit phone number</small>
            </label>

            <label className={styles.formField}>
              <span>Special requests (optional)</span>
              <textarea
                rows={3}
                placeholder="Seating preference, occasion, allergies, etc."
                value={reservation.notes}
                onChange={(e) => setReservation({ ...reservation, notes: e.target.value })}
              />
            </label>

            {reservationError && (
              <div style={{ color: '#d32f2f', background: '#fff5f5', border: '1px solid #ffcdd2', borderRadius: '8px', padding: '8px 10px', marginTop: '6px' }}>
                {reservationError}
              </div>
            )}

            <div className={styles.reservationActions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={processing || cartItems.length === 0}
              >
                {processing ? "Processing..." : "Reserve & Pay"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export async function loader() {
  let role = await isLogin();
  if (role != "customer") {
    return redirect("/login");
  }
  return null;
}
