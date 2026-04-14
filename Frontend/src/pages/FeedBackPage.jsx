import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { addToFavourites } from "../util/favourites";
import "../styles/owner_dashboard.css";
import styles from "./FeedBackPage.module.css";
import { CheckoutSteps } from "../components/CheckoutSteps";
import { useToast } from "../components/common/Toast";

/* Interactive star rating component */
function StarRating({ value, onChange, label, disabled }) {
  const [hover, setHover] = useState(0);
  return (
    <div className={styles.starRatingGroup}>
      <span className={styles.starLabel}>{label}</span>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${styles.star} ${star <= (hover || value) ? styles.starFilled : ""}`}
            onMouseEnter={() => !disabled && setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => !disabled && onChange(star)}
            disabled={disabled}
            aria-label={`${star} star`}
          >
            ★
          </button>
        ))}
      </div>
      {value > 0 && <span className={styles.starText}>{value}/5</span>}
    </div>
  );
}

export function FeedBackPage({ mode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const isOwnerView =
    mode === "owner" || location.pathname.includes("/owner/feedback");
  const isCustomerView =
    mode === "customer" || location.pathname.includes("/customer/feedback");

  // Customer state
  const [customerData, setCustomerData] = useState(null);
  const [hasFeedback, setHasFeedback] = useState(false);
  const [formData, setFormData] = useState({
    rest_id: "",
    orderId: "",
    diningRating: "",
    orderRating: "",
    additionalFeedback: "",
    lovedItems: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [favMessage, setFavMessage] = useState(null);
  const [addingDishId, setAddingDishId] = useState(null);
  const [selectedFavoriteDishes, setSelectedFavoriteDishes] = useState([]);

  // Owner state
  const [feedbackData, setFeedbackData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch customer data
  useEffect(() => {
    if (isCustomerView) {
      fetchCustomerData();
    }
  }, [isCustomerView]);

  // Fetch owner feedback data
  useEffect(() => {
    if (isOwnerView) {
      fetchOwnerFeedback();
    }
  }, [isOwnerView]);

  const fetchCustomerData = async () => {
    try {
      const response = await fetch(
        "/api/customer/feedback",
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Feedback API Response:", data); // Debug log
      setCustomerData(data);

      // Note: Don't set hasFeedback here - check per order when orderId is selected
    } catch (err) {
      console.error("Error fetching customer data:", err);
      setError("Failed to load data.");
    }
  };

  useEffect(() => {
    if (isCustomerView && customerData) {
      const restIdFromState = location.state && location.state.restId;
      const orderIdFromState = location.state && location.state.orderId;
      if (restIdFromState) {
        setFormData((prev) => ({
          ...prev,
          rest_id: restIdFromState,
          orderId: orderIdFromState || "",
        }));
      }

      if (orderIdFromState && customerData?.feedbacks) {
        const feedbackExists = customerData.feedbacks.some(
          (fb) => fb.orderId === orderIdFromState
        );
        setHasFeedback(feedbackExists);
      }
    }
  }, [isCustomerView, customerData, location.state]);

  // Extract dishes from customer's orders (many backend shapes supported)
  const extractOrderDishes = () => {
    if (!customerData) return [];

    const dishes = [];
    const orderIdFromState = location.state?.orderId;

    // Try multiple possible order structures
    let orders =
      customerData?.orders ||
      customerData?.recentOrders ||
      customerData?.pastOrders ||
      customerData?.orderHistory ||
      customerData?.allOrders ||
      [];

    console.log("Orders found:", orders);
    console.log("Filtering by orderId:", orderIdFromState);

    if (!Array.isArray(orders) || orders.length === 0) {
      console.log("No orders found in customerData");
      return [];
    }

    if (orderIdFromState) {
      orders = orders.filter(
        (order) =>
          order.id === orderIdFromState ||
          order._id === orderIdFromState ||
          order.recordId === orderIdFromState
      );
      console.log("Filtered to specific order:", orders);
    }

    // Extract items from each order
    orders.forEach((order) => {
      if (!order) return;

      // Try multiple possible item structures
      const items =
        order.items ||
        order.dishes ||
        order.orderItems ||
        order.products ||
        order.cartItems ||
        order.meal ||
        [];

      if (!Array.isArray(items)) {
        console.log("Items not array for order:", order);
        return;
      }

      console.log("Processing order with items:", items);

      items.forEach((it) => {
        if (!it) return;

        // Extract the actual dish object from various possible structures
        let dishObj = null;

        if (it.dish) {
          dishObj = it.dish;
        } else if (it.menuItem) {
          dishObj = it.menuItem;
        } else if (it.product) {
          dishObj = it.product;
        } else if (it.name) {
          // If it's the dish itself
          dishObj = it;
        }

        if (dishObj) {
          dishes.push(dishObj);
        }
      });
    });

    const map = new Map();
    dishes.forEach((d) => {
      if (!d) return;

      const did = d?.id || d?._id || d?.dishId || null;
      const dishName = d?.name || d?.title || "Dish";

      if (did) {
        if (!map.has(did)) {
          map.set(did, { ...d, id: did, name: dishName });
        }
      } else if (dishName) {
        // fallback by name
        const key = dishName.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { ...d, name: dishName });
        }
      }
    });

    return Array.from(map.values());
  };

  const fetchOwnerFeedback = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/owner/feedback", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFeedbackData(data);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError("Failed to load feedback data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const lovedItemsText =
        selectedFavoriteDishes.length > 0
          ? selectedFavoriteDishes.join(", ")
          : "";

      const submitData = {
        ...formData,
        lovedItems: lovedItemsText,
      };

      const response = await fetch(
        "/api/customer/submit-feedback",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(submitData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit feedback");
      }

      setSubmitSuccess(true);
      setFormData({
        rest_id: "",
        orderId: "",
        diningRating: "",
        orderRating: "",
        lovedItems: "",
        additionalFeedback: "",
      });
      setSelectedFavoriteDishes([]);

      // Redirect to home page after successful submission
      setTimeout(() => {
        navigate("/customer/");
      }, 1200);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setSubmitError(
        err.message || "Could not submit feedback. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await fetch(
        `/api/owner/feedback/${id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Refresh feedback list
      fetchOwnerFeedback();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Could not update the feedback status.");
    }
  };

  // Customer View - Feedback Form
  if (isCustomerView) {
    const restaurantName = location.state?.restaurant;
    const orderDishes = extractOrderDishes();

    return (
      <div className={styles.page}>
        <CheckoutSteps current="feedback" />
        <div className={styles.container}>
          {/* Hero */}
          <div className={styles.hero}>
            <div className={styles.heroIcon}>⭐</div>
            <h2 className={styles.heroTitle}>Share Your Experience</h2>
            <p className={styles.heroSubtitle}>
              Your feedback helps us serve you better
            </p>
          </div>

          {restaurantName && (
            <div className={styles.restaurantBadge}>
              <span className={styles.restaurantIcon}>🍽️</span>
              <span>{restaurantName}</span>
            </div>
          )}

          {hasFeedback && (
            <div className={styles.alreadySubmittedMessage}>
              <span className={styles.msgIcon}>✅</span>
              You have already submitted feedback for this order. Thank you!
            </div>
          )}

          {submitSuccess && (
            <div className={styles.successMessage}>
              <span className={styles.msgIcon}>🎉</span>
              Feedback submitted successfully! Redirecting...
            </div>
          )}

          {submitError && (
            <div className={styles.errorMessage}>
              <span className={styles.msgIcon}>❌</span>
              {submitError}
            </div>
          )}

          {/* Feedback Form Card */}
          <div
            className={styles.card}
            style={{
              opacity: hasFeedback ? 0.5 : 1,
              pointerEvents: hasFeedback ? "none" : "auto",
            }}
          >
            <form onSubmit={handleSubmit} className={styles.feedbackForm}>
              <input type="hidden" name="rest_id" value={formData.rest_id} />
              <input type="hidden" name="orderId" value={formData.orderId} />

              {/* Ratings */}
              <div className={styles.ratingsCard}>
                <h3 className={styles.sectionTitle}>Rate Your Experience</h3>
                <div className={styles.ratingGroup}>
                  <StarRating
                    label="Dining Experience"
                    value={Number(formData.diningRating) || 0}
                    onChange={(val) =>
                      setFormData({ ...formData, diningRating: String(val) })
                    }
                    disabled={hasFeedback}
                  />
                  <StarRating
                    label="Order Quality"
                    value={Number(formData.orderRating) || 0}
                    onChange={(val) =>
                      setFormData({ ...formData, orderRating: String(val) })
                    }
                    disabled={hasFeedback}
                  />
                </div>
              </div>

              {/* Favourite dishes */}
              <div className={styles.dishesSection}>
                <h3 className={styles.sectionTitle}>
                  Loved something? Tap to favourite it!
                </h3>
                {orderDishes.length === 0 ? (
                  <div className={styles.noDishes}>
                    <span>🍜</span>
                    <p>No order items found to favourite.</p>
                  </div>
                ) : (
                  <div className={styles.dishesGrid}>
                    {orderDishes.map((dish) => {
                      const id = dish?.id || dish?._id || dish?.dishId;
                      const dishName = dish?.name || dish?.title || "Dish";
                      const isSelected =
                        selectedFavoriteDishes.includes(dishName);

                      return (
                        <button
                          key={id || dishName}
                          type="button"
                          className={`${styles.dishChip} ${isSelected ? styles.dishChipSelected : ""}`}
                          onClick={async () => {
                            if (!formData.rest_id) {
                              setFavMessage({
                                type: "error",
                                text: "Restaurant not set.",
                              });
                              return;
                            }
                            if (!id) {
                              setFavMessage({
                                type: "error",
                                text: "Invalid dish.",
                              });
                              return;
                            }
                            try {
                              setAddingDishId(id);
                              await addToFavourites(id);
                              if (isSelected) {
                                setSelectedFavoriteDishes(
                                  selectedFavoriteDishes.filter(
                                    (d) => d !== dishName
                                  )
                                );
                                setFavMessage({
                                  type: "info",
                                  text: `Removed "${dishName}".`,
                                });
                              } else {
                                setSelectedFavoriteDishes([
                                  ...selectedFavoriteDishes,
                                  dishName,
                                ]);
                                setFavMessage({
                                  type: "success",
                                  text: `Added "${dishName}" to favourites!`,
                                });
                              }
                              setTimeout(() => setFavMessage(null), 3000);
                            } catch (err) {
                              console.error(
                                "Failed to add to favourites:",
                                err
                              );
                              setFavMessage({
                                type: "error",
                                text: `${dishName}: ${err.message || "Failed"}`,
                              });
                            } finally {
                              setAddingDishId(null);
                            }
                          }}
                          disabled={addingDishId === id || !formData.rest_id}
                        >
                          <span className={styles.dishChipHeart}>
                            {addingDishId === id
                              ? "⏳"
                              : isSelected
                              ? "❤️"
                              : "🤍"}
                          </span>
                          <span className={styles.dishChipName}>{dishName}</span>
                          {dish?.price && (
                            <span className={styles.dishChipPrice}>
                              ₹{dish.price}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {favMessage && (
                  <div
                    className={`${styles.favMessage} ${styles[favMessage.type]}`}
                  >
                    {favMessage.text}
                  </div>
                )}

                {selectedFavoriteDishes.length > 0 && (
                  <div className={styles.selectedItems}>
                    <strong>❤️ Items you loved:</strong>{" "}
                    {selectedFavoriteDishes.join(", ")}
                  </div>
                )}
              </div>

              {/* Additional Feedback */}
              <div className={styles.textareaGroup}>
                <label htmlFor="additionalFeedback">
                  Additional Feedback (optional)
                </label>
                <textarea
                  id="additionalFeedback"
                  value={formData.additionalFeedback}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additionalFeedback: e.target.value,
                    })
                  }
                  placeholder="Tell us what you think — suggestions, compliments, anything..."
                  rows="4"
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={submitting || !formData.rest_id}
              >
                {submitting ? (
                  <>
                    <span className={styles.btnSpinner}></span> Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </button>
            </form>
          </div>

          {/* Past Feedback */}
          {customerData?.feedbacks?.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Your Past Feedback</h3>
              <div className={styles.feedbackList}>
                {customerData.feedbacks.map((fb) => (
                  <div key={fb.id} className={styles.feedbackItem}>
                    <div className={styles.feedbackHeader}>
                      <span className={styles.feedbackDate}>
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                      <span
                        className={`${styles.statusBadge} ${
                          styles[`status${fb.status}`]
                        }`}
                      >
                        {fb.status}
                      </span>
                    </div>
                    {(fb.diningRating || fb.orderRating) && (
                      <div className={styles.ratings}>
                        {fb.diningRating && (
                          <span>🍽️ Dining: {"⭐".repeat(fb.diningRating)}</span>
                        )}
                        {fb.orderRating && (
                          <span>📦 Order: {"⭐".repeat(fb.orderRating)}</span>
                        )}
                      </div>
                    )}
                    {fb.lovedItems && (
                      <p className={styles.lovedItems}>
                        ❤️ Loved: {fb.lovedItems}
                      </p>
                    )}
                    {fb.additionalFeedback && (
                      <p className={styles.comment}>
                        💬 {fb.additionalFeedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className={styles.homeBtn}
            onClick={() => navigate("/customer/")}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Owner View - Feedback Table
  if (isOwnerView) {
    const renderContent = () => {
      if (isLoading)
        return <p className={styles.loading}>Loading feedback...</p>;
      if (error) return <p className={styles.error}>{error}</p>;
      if (feedbackData.length === 0)
        return <p className={styles.noData}>No feedback found.</p>;

      return (
        <div className={styles.tableContainer}>
          <table className={styles.feedbackTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Dining Rating</th>
                <th>Order Rating</th>
                <th>Loved Items</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {feedbackData.map((item) => {
                // Handle both old format (rating as number) and new format (rating as object)
                const diningRating =
                  typeof item.rating === "object"
                    ? item.rating?.dining
                    : item.rating && typeof item.rating === "number"
                    ? null
                    : item.rating;
                const orderRating =
                  typeof item.rating === "object" ? item.rating?.order : null;

                return (
                  <tr key={item.id}>
                    <td>{item.id.substring(0, 8)}...</td>
                    <td>{item.customer}</td>
                    <td>{diningRating ? `${diningRating}⭐` : "N/A"}</td>
                    <td>{orderRating ? `${orderRating}⭐` : "N/A"}</td>
                    <td>{item.lovedItems || "-"}</td>
                    <td className={styles.commentCell}>
                      {item.comment || "No comment"}
                    </td>
                    <td>
                      <span
                        className={`${styles.status} ${
                          styles[item.status?.toLowerCase()]
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.date
                        ? new Date(item.date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {item.status === "Pending" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(item.id, "Resolved")
                          }
                          className={styles.resolveButton}
                        >
                          Resolve
                        </button>
                      )}
                      {item.status === "Resolved" && (
                        <button
                          onClick={() => handleStatusUpdate(item.id, "Pending")}
                          className={styles.pendingButton}
                        >
                          Mark Pending
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    };

    return (
      <div className={styles.feedbackContainer}>
        <h2 className={styles.title}>Customer Feedback</h2>
        {renderContent()}
      </div>
    );
  }

  return null;
}
