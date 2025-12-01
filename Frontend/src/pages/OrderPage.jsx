import { useState } from "react";iimport { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { clearcart } from "../store/CartSlice";
import { CheckoutSteps } from "../components/CheckoutSteps";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import { addToFavourites } from "../util/favourites";
import styles from "./OrderPage.module.css";

export function OrderPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.dishes || []);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [savedToFavorites, setSavedToFavorites] = useState(false);
  const [savingFavorites, setSavingFavorites] = useState(false);
  const [favoritesMessage, setFavoritesMessage] = useState(null);

  // Generate a consistent order number based on cart items
  const generateOrderNumber = (cartItems) => {
    let hash = 0;
    const cartString = JSON.stringify(cartItems);
    for (let i = 0; i < cartString.length; i++) {
      const char = cartString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Convert to positive 3-digit number (100-999)
    return (Math.abs(hash) % 900 + 100).toString();
  };
  const orderNumber = generateOrderNumber(cartItems);
  const restaurantName = "The Corner Bistro"; // You can get this from context or props
  const estimatedTime = "30-40 minutes";

  const handleDone = () => {
    dispatch(clearcart());
    navigate("/customer/");
  };

  const [processing, setProcessing] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservation, setReservation] = useState({ date: '', time: '', guests: 2 });
  const location = useLocation();
  const navState = location.state || {};
  const restIdFromState = navState.restId || null;
  const restNameFromState = navState.restName || restaurantName;

  const handleProceedOrder = async () => {
    if (cartItems.length === 0) return;
    setProcessing(true);
    try {
      const payload = {
        restaurantName: restNameFromState,
        rest_id: restIdFromState,
        items: cartItems,
        totalAmount: Number((cartItems.reduce((s, it) => s + (it.amount || it.price || 0) * (it.quantity || 1), 0)).toFixed(2)),
        reservation: null
      };

      // Do NOT create the order yet; navigate to payment with payload.
      navigate('/customer/payment', { state: { payload } });
    } catch (err) {
      console.error('Error preparing order for payment:', err);
      navigate('/customer/payment', { state: { payload: { rest_id: restIdFromState, items: cartItems, totalAmount: null, reservation: null } } });
    } finally {
      setProcessing(false);
    }
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    const { date, time, guests } = reservation;
    if (!date || !time || !guests) return;
    setProcessing(true);
    try {
      const payload = {
        restaurantName: restNameFromState,
        rest_id: restIdFromState,
        items: cartItems,
        totalAmount: Number((cartItems.reduce((s, it) => s + (it.amount || it.price || 0) * (it.quantity || 1), 0)).toFixed(2)),
        reservation: { date, time, guests }
      };

      // Do NOT create reservation yet; navigate to payment and create+pay after successful payment
      navigate('/customer/payment', { state: { payload } });
    } catch (err) {
      console.error('Error creating reservation:', err);
      navigate('/customer/payment', { state: { payload: { rest_id: restIdFromState, items: cartItems, totalAmount: null, reservation: { date, time, guests } } } });
    } finally {
      setProcessing(false);
      setShowReservationForm(false);
    }
  };

  const handleSaveToFavorites = async () => {
    if (savedToFavorites) return; // Already saved

    if (cartItems.length === 0) {
      setFavoritesMessage({ type: 'error', text: 'No items in cart to save.' });
      return;
    }

    setSavingFavorites(true);
    setFavoritesMessage(null);

    try {
      // Get unique dish IDs from cart items
      const dishIds = [...new Set(cartItems.map(item => item.id).filter(Boolean))];

      if (dishIds.length === 0) {
        setFavoritesMessage({ type: 'error', text: 'No valid dishes found in cart.' });
        return;
      }

      let addedCount = 0;
      for (const dishId of dishIds) {
        try {
          await addToFavourites(dishId);
          addedCount++;
        } catch (error) {
          console.error(`Failed to add dish ${dishId} to favorites:`, error);
        }
      }

      if (addedCount > 0) {
        setSavedToFavorites(true);
        setFavoritesMessage({
          type: 'success',
          text: `Added ${addedCount} dish(es) to favorites!`
        });
      } else {
        setFavoritesMessage({ type: 'error', text: 'Failed to add dishes to favorites.' });
      }
    } catch (error) {
      console.error('Error saving to favorites:', error);
      setFavoritesMessage({ type: 'error', text: 'Failed to save to favorites.' });
    } finally {
      setSavingFavorites(false);
    }
  };

  return (
    <div className={styles.orderPage}>
      <CheckoutSteps current="order" />
      <div className={styles.orderConfirmationCard}>
        {/* Order Confirmation Section */}
        <div className={styles.confirmationSection}>
          <div className={styles.checkmarkCircle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 className={styles.confirmationTitle}>Order Placed!</h1>
          <p className={styles.confirmationText}>
            Thank you! Your order from <strong>'{restaurantName}'</strong> is confirmed.
            <br />
            Order #{orderNumber}. Estimated delivery in {estimatedTime}.
          </p>
        </div>

        {/* Meal Experience Feedback */}
        <div className={styles.feedbackSection}>
          <div className={styles.divider}></div>
          <p className={styles.feedbackQuestion}>How was your meal experience?</p>
          <div className={styles.starRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={styles.starButton}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill={star <= (hoveredRating || rating) ? "#ffc107" : "none"}
                  stroke={star <= (hoveredRating || rating) ? "#ffc107" : "#ddd"}
                  strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Save to Favorites */}
        <div className={styles.favoritesSection}>
          <button
            className={`${styles.favoritesButton} ${savedToFavorites ? styles.favoritesButtonActive : ""}`}
            onClick={handleSaveToFavorites}
            disabled={savingFavorites}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={savedToFavorites ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span>{savingFavorites ? 'Saving...' : savedToFavorites ? 'Saved to Favorites' : 'Save to Favorites'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          {favoritesMessage && (
            <div className={`${styles.favoritesMessage} ${styles[favoritesMessage.type]}`}>
              {favoritesMessage.type === 'success' ? '✅' : '❌'} {favoritesMessage.text}
            </div>
          )}
        </div>

        {/* Actions: Proceed as Order or Make Reservation */}
        <div className={styles.actionsRow}>
          <button
            className={styles.primaryButton}
            onClick={handleProceedOrder}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Proceed to Payment (Order)'}
          </button>

          <button
            className={styles.secondaryButton}
            onClick={() => setShowReservationForm((s) => !s)}
            disabled={processing}
          >
            {showReservationForm ? 'Cancel Reservation' : 'Make a Reservation'}
          </button>
        </div>

        {showReservationForm && (

          <div>

            <div className={styles.orderSummaryPanel}>

                    <h3 className={styles.panelTitle}>Order Summary</h3>

                    {cartItems.length === 0 ? (

                      <p className={styles.emptyCartText}>Your cart is empty.</p>

                    ) : (

                      <>

                        <ul className={styles.summaryList}>

                          {cartItems.map((item) => (

                            <li key={item.id} className={styles.summaryItem}>

                              <div className={styles.summaryName}>{item.name} x {item.quantity}</div>

                              <div className={styles.summaryPrice}>₹{((item.amount || item.price || 0) * (item.quantity || 1)).toFixed(2)}</div>

                            </li>

                          ))}

                        </ul>

                        <div className={styles.summaryTotals}>

                          {(() => {

                            const subtotalVal = cartItems.reduce((s, it) => s + (it.amount || it.price || 0) * (it.quantity || 1), 0);

                            const deliveryFee = 3.0;

                            const taxesVal = +(subtotalVal * 0.08).toFixed(2);

                            const finalVal = (subtotalVal + deliveryFee + taxesVal).toFixed(2);

                            return (

                              <>

                                <div className={styles.totRow}><span>Subtotal</span><span>₹{subtotalVal.toFixed(2)}</span></div>

                                <div className={styles.totRow}><span>Delivery</span><span>₹{deliveryFee.toFixed(2)}</span></div>

                                <div className={styles.totRow}><span>Taxes & Charges</span><span>₹{taxesVal.toFixed(2)}</span></div>

                                <div className={styles.totTotal}><strong>Total</strong><strong>₹{finalVal}</strong></div>

                              </>

                            );

                          })()}

                        </div>

                        <div className={styles.editCartRow}>

                          <button type="button" className={styles.editCartButton} onClick={() => navigate(restIdFromState ? `/customer/restaurant/${restIdFromState}` : '/customer/restaurants')}>

                            Edit Cart

                          </button>

                        </div>

                      </>

                    )}

                  </div>

                  <form className={styles.reservationForm} onSubmit={handleReservationSubmit}>

            <label>

              Date

              <input type="date" value={reservation.date} onChange={(e) => setReservation({...reservation, date: e.target.value})} required />

            </label>

            <label>

              Time

              <input type="time" value={reservation.time} onChange={(e) => setReservation({...reservation, time: e.target.value})} required />

            </label>

            <label>

              Guests

              <input type="number" min="1" value={reservation.guests} onChange={(e) => setReservation({...reservation, guests: Number(e.target.value)})} required />

            </label>

            <div className={styles.reservationActions}>

              <button type="submit" className={styles.primaryButton} disabled={processing}>

                {processing ? 'Processing...' : 'Reserve & Pay'}

              </button>

            </div>

          </form>

        </div>

        )}

      </div>
    </div>

  );
}

export async function loader() {
  let role = await isLogin();
  if (role != 'customer') {
    return redirect('/login');
  }
  return null;
}
g}>

                {processing ? 'Processing...' : 'Reserve & Pay'}

              </button>

            </div>

          </form>

        </div>

        )}

      </div>
    </div>

  );
}

export async function loader() {
  let role = await isLogin();
  if (role != 'customer') {
    return redirect('/login');
  }
  return null;
}
