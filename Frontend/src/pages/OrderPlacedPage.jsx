import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckoutSteps } from "../components/CheckoutSteps";
import styles from "./OrderPlacedPage.module.css";

export function OrderPlacedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, restId } = location.state || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [reservation, setReservation] = useState(null);

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
  }, [orderId]);

  const goToFeedback = () => {
    navigate("/customer/feedback", { 
      state: { 
        restId, 
        orderId, 
        restaurant: order?.restaurant 
      } 
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading order details…</div>;
  }
  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <CheckoutSteps current="placed" />

      <div className={styles.successHeader}>
        <div className={styles.checkIcon}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div>
          <h1 className={styles.title}>Order Placed Successfully</h1>
          <p className={styles.subtitle}>
            Thank you! Your order has been placed and payment confirmed.
          </p>
        </div>
      </div>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Order Summary</h2>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Order ID</span>
          <span className={styles.detailValue}>{order?._id}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Restaurant</span>
          <span className={styles.detailValue}>{order?.restaurant || "-"}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Payment Status</span>
          <span className={styles.detailValue}>
            {order?.paymentStatus || order?.status}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Total Amount</span>
          <span className={styles.detailValue}>
            ₹ {order?.totalAmount ?? "-"}
          </span>
        </div>

        <div className={styles.itemsSection}>
          <div className={styles.itemsHeader}>Items</div>
          <ul className={styles.itemsList}>
            {(order?.dishes || []).map((d, idx) => (
              <li key={idx} className={styles.item}>
                {d}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {reservation && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Reservation Details</h2>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Reservation ID</span>
            <span className={styles.detailValue}>{reservation._id}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Date</span>
            <span className={styles.detailValue}>
              {new Date(reservation.date).toLocaleDateString()}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Time</span>
            <span className={styles.detailValue}>{reservation.time}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Guests</span>
            <span className={styles.detailValue}>{reservation.guests}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Status</span>
            <span className={styles.detailValue}>{reservation.status}</span>
          </div>
        </section>
      )}

      <div className={styles.actions}>
        <button onClick={goToFeedback} className={styles.primaryButton}>
          Continue to Feedback
        </button>
      </div>
    </div>
  );
}

export default OrderPlacedPage;
