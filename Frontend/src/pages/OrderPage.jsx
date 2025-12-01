import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearcart } from "../store/CartSlice";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import styles from "./OrderPage.module.css";

export function OrderPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.dishes || []);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [savedToFavorites, setSavedToFavorites] = useState(false);

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

  const handleSaveToFavorites = () => {
    setSavedToFavorites(!savedToFavorites);
    // Here you can add logic to save to favorites
  };

  return (
    <div className={styles.orderPage}>
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
        <button
          className={`${styles.favoritesButton} ${savedToFavorites ? styles.favoritesButtonActive : ""}`}
          onClick={handleSaveToFavorites}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={savedToFavorites ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>Save to Favorites</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        {/* Done Button */}
        <button className={styles.doneButton} onClick={handleDone}>
          Done
        </button>
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
