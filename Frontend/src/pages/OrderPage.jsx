import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearcart } from "../store/CartSlice";
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
