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
  
  // Format time from 24h to 12h format
  const formatTimeTo12h = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  // Get current time in HH:MM format for validation
  const getCurrentTime = () => {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };
  
  // Get minimum time based on current time and selected date
  const getMinTime = (selectedDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    // If selected date is today, use current time + 1 hour (rounded to next 15 min)
    if (selected.getTime() === today.getTime()) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      // Round up to next 15-minute interval, then add 1 hour
      const roundedMinute = Math.ceil(currentMinute / 15) * 15;
      let nextHour = currentHour;
      let nextMinute = roundedMinute + 60; // Add 1 hour
      
      if (nextMinute >= 60) {
        nextHour += Math.floor(nextMinute / 60);
        nextMinute = nextMinute % 60;
      }
      
      // Ensure it's within restaurant hours
      if (nextHour >= 23) {
        return closeTime;
      }
      
      return `${pad(nextHour)}:${pad(nextMinute)}`;
    }
    
    // For future dates, use opening time
    return openTime;
  };

  // Generate preset times based on restaurant hours - ONLY 15 min intervals
  const getPresetTimes = (selectedDate) => {
    const times = [];
    const startHour = selectedDate === minDate ? getMinTime(selectedDate) : openTime;
    const [startH, startM] = startHour.split(':').map(Number);
    const [endH] = closeTime.split(':').map(Number);
    
    // Round start time up to next valid 15-min interval
    let currentHour = startH;
    let currentMin = Math.ceil(startM / 15) * 15;
    
    if (currentMin === 60) {
      currentHour++;
      currentMin = 0;
    }
    
    // Generate times: only 0, 15, 30, 45 minutes
    while (currentHour < endH) {
      times.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
      
      currentMin += 15;
      if (currentMin >= 60) {
        currentHour++;
        currentMin = 0;
      }
    }
    
    return times;
  };

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

    // Required fields
    if (!date || !time || !guests || !name || !phone) {
      setReservationError('Please fill all required fields.');
      return;
    }

    // Date within today..+3
    if (date < minDate || date > maxDate) {
      setReservationError('Please select a date within the next 3 days.');
      return;
    }

    // Guest limits 1..12
    if (guests < 1 || guests > 12) {
      setReservationError('Guests must be between 1 and 12.');
      return;
    }

    // Time validity and window 08:00..23:00
    const selectedDateTime = new Date(`${date}T${time}`);
    if (Number.isNaN(selectedDateTime.getTime())) {
      setReservationError('Please select a valid time.');
      return;
    }
    if (time < openTime || time > closeTime) {
      setReservationError('Time must be between 08:00 and 23:00.');
      return;
    }
    
    // Check if selected time is in the future (at least 1 hour from now)
    const now = new Date();
    const todayStr = minDate;
    const selectedDateOnly = new Date(date);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const todayOnly = new Date();
    todayOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly.getTime() === todayOnly.getTime()) {
      // Same day - check if time is at least 1 hour from now
      const [selectedHour, selectedMinute] = time.split(':').map(Number);
      const selectedTimeMinutes = selectedHour * 60 + selectedMinute;
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
      const oneHourFromNow = currentTimeMinutes + 60;
      
      if (selectedTimeMinutes < oneHourFromNow) {
        setReservationError('Please select a time at least 1 hour from now.');
        return;
      }
    } else if (selectedDateOnly < todayOnly) {
      setReservationError('Cannot select a date in the past.');
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
      console.error("Error preparing reservation for payment:", err);
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
              <div className={styles.timeInputWrapper}>
                <input
                  type="time"
                  step="900"
                  min={reservation.date ? getMinTime(reservation.date) : openTime}
                  max={closeTime}
                  value={reservation.time}
                  onChange={(e) => setReservation({ ...reservation, time: e.target.value })}
                  required
                />
                {reservation.time && (
                  <div className={styles.timeDisplay}>
                    <span className={styles.timeValue}>{formatTimeTo12h(reservation.time)}</span>
                  </div>
                )}
              </div>
              {reservation.date && (
                <div className={styles.presetTimes}>
                  <div className={styles.presetTimesLabel}>Quick select</div>
                  <div className={styles.presetTimesGrid}>
                    {getPresetTimes(reservation.date).map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`${styles.presetTimeBtn} ${reservation.time === time ? styles.presetTimeBtnActive : ''}`}
                        onClick={() => setReservation({ ...reservation, time })}
                      >
                        <span className={styles.timeHour}>{time.split(':')[0]}</span>
                        <span className={styles.timeSeparator}>:</span>
                        <span className={styles.timeMin}>{time.split(':')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <small className={styles.helpText}>
                {reservation.date === minDate 
                  ? `Select between ${formatTimeTo12h(getMinTime(reservation.date))} and ${formatTimeTo12h(closeTime)} (at least 1 hour from now).`
                  : `Select between ${formatTimeTo12h(openTime)} and ${formatTimeTo12h(closeTime)} (15-minute slots).`}
              </small>
            </label>

            <label className={styles.formField}>
              <span>Guests</span>
              <input
                type="number"
                min="1"
                max="12"
                value={reservation.guests}
                onChange={(e) =>
                  setReservation({ ...reservation, guests: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })
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
