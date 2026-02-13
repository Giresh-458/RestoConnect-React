import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckoutSteps } from "../components/CheckoutSteps";
import styles from "./OrderPlacedPage.module.css";

// Format time from 24h to 12h format
const formatTimeTo12h = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Format date to readable format
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export function OrderPlacedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, restId } = location.state || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) throw new Error("Missing orderId");
        const resp = await fetch(
          `http://localhost:3000/api/customer/orders/${orderId}`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );
        const data = await resp.json();
        if (!resp.ok)
          throw new Error(
            data.error || data.message || "Failed to fetch order"
          );
        const ord = data.data?.order || data.order;
        const resv = data.data?.reservation || data.reservation || null;
        setOrder(ord);
        setReservation(resv);
      } catch (err) {
        console.error("Order fetch error:", err);
        setError(err.message || "Failed to fetch order");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();

    // Confetti auto-dismiss
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, [orderId]);

  const goToFeedback = () => {
    navigate("/customer/feedback", {
      state: {
        restId,
        orderId,
        restaurant: order?.restaurant,
      },
    });
  };

  const goToHome = () => {
    navigate("/customer/");
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <CheckoutSteps current="placed" />
        <div className={styles.loadingContent}>
          <div className={styles.spinner} />
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <CheckoutSteps current="placed" />
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>✕</div>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={goToHome} className={styles.secondaryBtn}>Go to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <CheckoutSteps current="placed" />

      {/* Confetti animation overlay */}
      {showConfetti && <div className={styles.confetti} aria-hidden="true" />}

      <div className={styles.container}>
        {/* Success Hero */}
        <div className={styles.successHero}>
          <div className={styles.successIconWrapper}>
            <div className={styles.successIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <h1 className={styles.successTitle}>Order Placed Successfully!</h1>
          <p className={styles.successSubtitle}>
            Thank you for your order. Your payment has been confirmed and your food is being prepared.
          </p>
        </div>

        {/* Order Summary Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>🧾 Order Summary</h2>
            <span className={styles.orderId}>#{order?._id}</span>
          </div>
          
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Restaurant</span>
              <span className={styles.detailValue}>{order?.restaurant || "-"}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Payment</span>
              <span className={`${styles.statusBadge} ${styles.statusPaid}`}>
                {order?.paymentStatus || order?.status || "Paid"}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Order Status</span>
              <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                {order?.status || "Pending"}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Total Amount</span>
              <span className={styles.totalAmount}>₹ {order?.totalAmount ?? "-"}</span>
            </div>
          </div>

          {/* Items */}
          <div className={styles.itemsSection}>
            <h3 className={styles.itemsTitle}>Items Ordered</h3>
            <div className={styles.itemsList}>
              {(order?.dishes || []).map((d, idx) => (
                <div key={idx} className={styles.itemChip}>
                  <span className={styles.itemNumber}>{idx + 1}</span>
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* Estimated time */}
          <div className={styles.estimatedTime}>
            <div className={styles.etaIcon}>⏱️</div>
            <div>
              <strong>Estimated preparation time</strong>
              <span>{order?.estimatedTime || 15} minutes</span>
            </div>
          </div>
        </div>

        {/* Reservation Card */}
        {reservation && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>🕒 Reservation Details</h2>
              <span className={styles.orderId}>#{reservation._id}</span>
            </div>
            <div className={styles.reservationGrid}>
              <div className={styles.reservationItem}>
                <div className={styles.resvIcon}>📅</div>
                <div>
                  <span className={styles.resvLabel}>Date</span>
                  <span className={styles.resvValue}>{formatDate(reservation.date)}</span>
                </div>
              </div>
              <div className={styles.reservationItem}>
                <div className={styles.resvIcon}>⏰</div>
                <div>
                  <span className={styles.resvLabel}>Time</span>
                  <span className={styles.resvValueHighlight}>{formatTimeTo12h(reservation.time)}</span>
                </div>
              </div>
              <div className={styles.reservationItem}>
                <div className={styles.resvIcon}>👥</div>
                <div>
                  <span className={styles.resvLabel}>Guests</span>
                  <span className={styles.resvValue}>{reservation.guests}</span>
                </div>
              </div>
              <div className={styles.reservationItem}>
                <div className={styles.resvIcon}>📋</div>
                <div>
                  <span className={styles.resvLabel}>Status</span>
                  <span className={`${styles.statusBadge} ${
                    reservation.status?.toLowerCase() === 'confirmed' ? styles.statusPaid :
                    reservation.status?.toLowerCase() === 'cancelled' ? styles.statusCancelled :
                    styles.statusPending
                  }`}>
                    {reservation.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button onClick={goToFeedback} className={styles.primaryBtn}>
            ⭐ Share Your Feedback
          </button>
          <button onClick={goToHome} className={styles.secondaryBtn}>
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderPlacedPage;
