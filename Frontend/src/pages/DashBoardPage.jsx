import { useState, useEffect, useRef } from "react";
import { isLogin } from "../util/auth";
import { getFavourites } from "../util/favourites";
import { redirect, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../util/auth";
import { useDispatch } from "react-redux";
import { replaceCart, setRestaurant } from "../store/CartSlice";
import styles from "./DashBoardPage.module.css";

export async function loader() {
  const role = await isLogin();
  if (role !== "customer") {
    throw redirect("/login");
  }
  return null;
}

export const DashBoardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([]);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [pastReservations, setPastReservations] = useState([]);
  const [weeklySpending, setWeeklySpending] = useState(Array(7).fill(0));
  const [orderFrequency, setOrderFrequency] = useState([0, 0, 0, 0]);
  const [feedbackStats, setFeedbackStats] = useState({
    satisfactionRate: 0,
    totalReviews: 0,
    recentReviews: [],
  });
  const [notifications, setNotifications] = useState([]);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState(true);
  const [switchFocused, setSwitchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeOrderTab, setActiveOrderTab] = useState("recent");
  const [pastOrders, setPastOrders] = useState([]);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [selectedProfileFile, setSelectedProfileFile] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    img_url: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [reorderingOrderId, setReorderingOrderId] = useState(null);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [favoriteDishes, setFavoriteDishes] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const renderStars = (rating) => {
    if (typeof rating !== "number" || Number.isNaN(rating)) {
      return "☆☆☆☆☆";
    }
    const clamped = Math.max(0, Math.min(5, Math.round(rating)));
    return "★".repeat(clamped) + "☆".repeat(5 - clamped);
  };

  const formatCurrency = (amount) => {
    const numeric = typeof amount === "number" ? amount : Number(amount);
    if (Number.isNaN(numeric)) {
      return "₹0.00";
    }
    return `₹${numeric.toFixed(2)}`;
  };

  const formatReviewTimestamp = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString();
  };

  const formatReservationDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString();
  };

  const formatGuestCount = (value) => {
    const guests = Number(value);
    if (!Number.isFinite(guests) || guests <= 0) {
      return "0 guests";
    }
    return `${guests} ${guests === 1 ? "guest" : "guests"}`;
  };

  useEffect(() => {
    fetchDashboardData();
    fetchFavoriteDishes();
  }, []);

  // Refetch favorites when navigating to dashboard (e.g., returning from MenuPage)
  useEffect(() => {
    // Check if we're on the dashboard route
    if (location.pathname === "/customer/dashboard") {
      console.log("Navigated to dashboard, refetching favorites...");
      // Small delay to ensure navigation is complete
      const timer = setTimeout(() => {
        fetchFavoriteDishes();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Refetch favorites when page becomes visible (e.g., switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Page became visible, refetching favorites...");
        fetchFavoriteDishes();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Refetch favorites when window regains focus (e.g., returning from another tab/window)
  useEffect(() => {
    const handleFocus = () => {
      console.log("Window focused, refetching favorites...");
      fetchFavoriteDishes();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setFetchError("");
      const response = await fetch(
        "http://localhost:3000/api/customer/customerDashboard",
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (response.status === 401) {
        setLoading(false);
        navigate("/login?message=Please login again");
        return;
      }

      if (response.status === 403) {
        setLoading(false);
        navigate("/login?message=Access denied");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data (${response.status})`);
      }

      const data = await response.json();

      const dashboardUser = data.user || null;
      setUserData(dashboardUser);

      // Separate recent and past orders based on status
      const allOrders = Array.isArray(data.recentOrders)
        ? data.recentOrders
        : [];

      const recent = allOrders.filter((order) => {
        const status = (order.status || "").toLowerCase();
        return status === "pending" || status === "preparing";
      });

      const past = allOrders.filter((order) => {
        const status = (order.status || "").toLowerCase();
        return status === "completed" || status === "delivered";
      });

      setRecentOrders(recent);
      setPastOrders(past);
      setFavoriteRestaurants(
        Array.isArray(data.favoriteRestaurants) ? data.favoriteRestaurants : [],
      );
      setUpcomingReservations(
        Array.isArray(data.upcomingReservations)
          ? data.upcomingReservations
          : [],
      );
      setPastReservations(
        Array.isArray(data.pastReservations) ? data.pastReservations : [],
      );
      setWeeklySpending(
        Array.isArray(data.weeklySpending) && data.weeklySpending.length === 7
          ? data.weeklySpending.map((value) =>
              Number.isFinite(Number(value)) ? Number(value) : 0,
            )
          : Array(7).fill(0),
      );
      setOrderFrequency(
        Array.isArray(data.orderFrequency) && data.orderFrequency.length === 4
          ? data.orderFrequency.map((value) =>
              Number.isFinite(Number(value)) ? Number(value) : 0,
            )
          : [0, 0, 0, 0],
      );
      setFeedbackStats({
        satisfactionRate: data.feedbackStats?.satisfactionRate ?? 0,
        totalReviews: data.feedbackStats?.totalReviews ?? 0,
        recentReviews: Array.isArray(data.feedbackStats?.recentReviews)
          ? data.feedbackStats.recentReviews
          : [],
      });
      setNotifications(
        Array.isArray(data.notifications) ? data.notifications : [],
      );
      setEmailNotificationsEnabled(
        typeof data.emailNotificationsEnabled === "boolean"
          ? data.emailNotificationsEnabled
          : true,
      );
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setFetchError(
        "We had trouble loading your dashboard. Please refresh to try again.",
      );
      setLoading(false);
    }
  };

  const fetchFavoriteDishes = async () => {
    try {
      console.log("Starting to fetch favorite dishes...");
      setLoadingFavorites(true);

      // Backend now returns full dish details with restaurant info
      const favoriteDishes = await getFavourites();
      console.log("Received favorite dishes:", favoriteDishes);

      if (!Array.isArray(favoriteDishes)) {
        console.warn("Invalid favorites response format:", favoriteDishes);
        setFavoriteDishes([]);
        return;
      }

      // Backend already returns full dish details, so use them directly
      const dishes = favoriteDishes.filter(
        (dish) => dish !== null && dish !== undefined,
      );
      console.log("Processed favorite dishes:", dishes);
      setFavoriteDishes(dishes);
    } catch (error) {
      console.error("Error fetching favorite dishes:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
      setFavoriteDishes([]);
    } finally {
      console.log("Finished loading favorite dishes");
      setLoadingFavorites(false);
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "completed":
        return "#4ade80";
      case "pending":
      case "preparing":
        return "#fbbf24";
      default:
        return "#94a3b8";
    }
  };

  const formatOrderStatus = (status) => {
    const statusMap = {
      pending: "preparing",
      delivered: "completed",
      completed: "completed",
      preparing: "preparing",
    };
    return (
      statusMap[status?.toLowerCase()] || status?.toLowerCase() || "pending"
    );
  };

  const getDayName = (index) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days[index];
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const weeklyAmounts = weeklySpending.map((value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  });
  const maxWeeklySpending = weeklyAmounts.length
    ? Math.max(...weeklyAmounts, 0)
    : 0;
  const monthlyOrders = orderFrequency.reduce((sum, count) => sum + count, 0);
  const orderGoal = 12;
  const donutCircumference = 314;
  const orderProgress = Math.min(
    orderGoal === 0 ? 0 : monthlyOrders / orderGoal,
    1,
  );
  const orderDashOffset = donutCircumference * (1 - orderProgress);
  const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const visitLegendColors = ["#10b981", "#fbbf24", "#f59e0b", "#e5e7eb"];

  const satisfactionRate = feedbackStats?.satisfactionRate ?? 0;
  const totalReviews = feedbackStats?.totalReviews ?? 0;
  const recentReviewsList = Array.isArray(feedbackStats?.recentReviews)
    ? feedbackStats.recentReviews
    : [];
  const satisfactionCircumference = 251;
  const satisfactionOffset =
    satisfactionCircumference * (1 - Math.min(satisfactionRate / 100, 1));
  const reviewLabel = totalReviews === 1 ? "review" : "reviews";
  const hasFavorites = favoriteRestaurants.length > 0;
  const totalVisits = userData?.totalVisits ?? 0;
  const averageSpend = formatCurrency(Number(userData?.avgSpend ?? 0));
  const totalSpentDisplay = formatCurrency(Number(userData?.totalSpent ?? 0));
  const topRestaurant =
    userData?.topRestaurant && userData.topRestaurant !== "N/A"
      ? userData.topRestaurant
      : "Keep exploring";

  const getNotificationIconStyle = (type) => {
    if (type === "order") return styles.notificationIcon;
    if (type === "reservation") return styles.notificationIconBlue;
    return styles.notificationIconNeutral;
  };

  const handleNotificationToggle = async () => {
    const nextValue = !emailNotificationsEnabled;
    setEmailNotificationsEnabled(nextValue);
    setNotificationSaving(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/customer/preferences/email-notifications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ enabled: nextValue }),
        },
      );
      if (response.status === 401) {
        navigate("/login?message=Please login again");
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to update preference (${response.status})`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update preference");
      }
    } catch (error) {
      console.error("Error updating email notifications:", error);
      alert(
        "Could not update email notification preference. Please try again.",
      );
      setEmailNotificationsEnabled((prev) => !prev);
    } finally {
      setNotificationSaving(false);
    }
  };

  const handleRateOrder = (order) => {
    console.log("Rating order:", order);
    if (!order.recordId && !order.orderId) {
      console.error("Order ID missing");
      return;
    }
    navigate("/customer/feedback", {
      state: {
        restId: order?.restId,
        orderId: order?.recordId || order?.orderId,
        restaurant: order?.restaurant,
        dishName: order?.dishName,
      },
    });
  };

  const handleReorder = async (entity) => {
    if (!entity) {
      navigate("/customer/order");
      return;
    }

    // Use recordId (which is the MongoDB _id) for the reorder request
    const recordId = entity.recordId || entity._id || entity.id;

    if (!recordId) {
      console.error("No valid order ID found:", entity);
      alert("Could not identify order. Please try again.");
      return;
    }

    try {
      setReorderingOrderId(recordId);
      const response = await fetch(
        `http://localhost:3000/api/customer/orders/${recordId}/reorder`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
        },
      );

      if (response.status === 401) {
        navigate("/login?message=Please login again");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to reorder (${response.status})`,
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to reorder");
      }

      let items = Array.isArray(data.items) ? data.items : [];

      let needsMenu = items.some((item) => !item.name || !item.price);
      if (needsMenu && data.restaurant?.id) {
        try {
          const menuResp = await fetch(
            `http://localhost:3000/api/customer/menu/${data.restaurant.id}`,
            { credentials: "include" },
          );
          if (menuResp.ok) {
            const menuData = await menuResp.json();
            const menuDishes = Array.isArray(menuData.dishes)
              ? menuData.dishes
              : [];

            const grouped = {};
            for (const item of items) {
              let dish = menuDishes.find(
                (d) =>
                  d.id === item.id ||
                  d._id === item.id ||
                  d.id === item._id ||
                  d._id === item._id ||
                  String(d.id) === String(item.id) ||
                  String(d._id) === String(item.id) ||
                  String(d.id) === String(item._id) ||
                  String(d._id) === String(item._id),
              );
              if (!dish) {
                console.warn("Could not find menu dish for cart item", item);
                dish = {};
              }

              const dishId =
                dish.id || dish._id || item.id || item._id || "unknown";
              const key = `${dishId}-${dish.price || item.price || 0}`;
              if (!grouped[key]) {
                grouped[key] = {
                  ...dish,
                  ...item,
                  id: dish.id || item.id,
                  _id: dish._id || item._id,
                  name: dish.name || item.name || "Unknown",
                  price: item.price || dish.price || 0,
                  image: item.image || dish.image || "",
                  quantity: item.quantity ?? 1,
                };
              } else {
                grouped[key].quantity += item.quantity ?? 1;
              }
            }
            items = Object.values(grouped);
          }
        } catch (e) {
          // fallback: use items as-is
        }
      }
      dispatch(replaceCart(items));

      if (data.restaurant?.id) {
        dispatch(
          setRestaurant({
            restId: data.restaurant.id,
            restName: data.restaurant.name || "Restaurant",
          }),
        );
        navigate(`/customer/restaurant/${data.restaurant.id}?reorder=true`);
      } else {
        navigate("/customer/order");
      }
    } catch (error) {
      console.error("Error during reorder:", error);
      alert(`Could not reorder this order: ${error.message}`);
    } finally {
      setReorderingOrderId(null);
    }
  };

  const handleViewMenu = async (restId, fallbackRestaurantName) => {
    try {
      if (restId) {
        navigate(`/customer/restaurant/${restId}`);
        return;
      }
      if (fallbackRestaurantName) {
        const resp = await fetch("http://localhost:3000/api/restaurants", {
          credentials: "include",
        });
        if (resp.ok) {
          const list = await resp.json();
          const match = Array.isArray(list)
            ? list.find(
                (r) =>
                  (r.name || "").toLowerCase() ===
                  fallbackRestaurantName.toLowerCase(),
              )
            : null;
          if (match && match._id) {
            navigate(`/customer/restaurant/${match._id}`);
            return;
          }
        }
      }
      alert("Unable to open menu for this restaurant.");
    } catch (e) {
      console.error("View menu failed:", e);
      alert("Unable to open menu right now.");
    }
  };
  const handleEditProfileClick = () => {
    // Populate form with current user data
    if (userData) {
      setEditFormData((prev) => ({
        ...prev,
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        img_url: userData.img_url || "",
      }));
      setProfilePicPreview(userData.img_url);
    }
    setSelectedProfileFile(null);
    setShowEditModal(true);
    setUpdateError("");
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setUpdateError("");
    setUpdateSuccess("");
    // Reset password fields
    setEditFormData((prev) => ({
      ...prev,
      newPassword: "",
      confirmPassword: "",
    }));
  };

  const handleProfilePicClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }

      setSelectedProfileFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setUpdateError("");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateError("");
    setUpdateSuccess("");
    setIsUpdating(true);

    // Validate passwords if provided
    if (editFormData.newPassword || editFormData.confirmPassword) {
      if (!editFormData.newPassword || !editFormData.confirmPassword) {
        setUpdateError("Both password fields are required");
        setIsUpdating(false);
        return;
      }
      if (editFormData.newPassword !== editFormData.confirmPassword) {
        setUpdateError("Passwords do not match");
        setIsUpdating(false);
        return;
      }
      if (editFormData.newPassword.length < 6) {
        setUpdateError("Password must be at least 6 characters");
        setIsUpdating(false);
        return;
      }
    }

    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append("name", editFormData.name);
      formData.append("email", editFormData.email);
      formData.append("phone", editFormData.phone);

      // Add profile picture if selected
      if (selectedProfileFile) {
        formData.append("profilePicture", selectedProfileFile);
      }

      // Add passwords if provided
      if (editFormData.newPassword) {
        formData.append("newPassword", editFormData.newPassword);
        formData.append("confirmPassword", editFormData.confirmPassword);
      }

      const response = await fetch("http://localhost:3000/api/customer/edit", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.status === 401) {
        navigate("/login?message=Please login again");
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Update userData with new profile info without full refresh
        setUserData((prev) => ({
          ...prev,
          name: data.data.name || prev.name,
          email: data.data.email || prev.email,
          phone: data.data.phone || prev.phone,
          img_url: data.data.img_url || prev.img_url,
        }));
        setUpdateSuccess("✓ Profile updated successfully!");
        setTimeout(() => {
          handleCloseModal();
          setUpdateSuccess("");
        }, 2000);
      } else {
        setUpdateError(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setUpdateError("An error occurred while updating profile");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Hero Header */}
      <div className={styles.heroHeader}>
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <img
              src={userData?.img_url || "/default-avatar.png"}
              alt="User"
              className={styles.avatar}
            />
            <div className={styles.userInfo}>
              <h1 className={styles.welcomeText}>
                Welcome back, {userData?.name} 👋
              </h1>
              <p className={styles.subtitle}>Your meal moments await!</p>
              <p className={styles.orderCount}>
                {userData?.totalOrders || 0} Total Orders
              </p>
            </div>
          </div>
          <div className={styles.heroRight}>
            <button
              className={styles.editButton}
              onClick={handleEditProfileClick}
            >
              Edit Profile
            </button>
            <button
              className={styles.logoutButton}
              onClick={async () => {
                try {
                  await logout();
                } catch (e) {
                  console.error("Logout failed", e);
                }
                navigate("/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {fetchError && <div className={styles.dashboardError}>{fetchError}</div>}

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Section */}
        <div className={styles.leftSection}>
          {/* Dine-In Insights */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Dine-In Insights</h2>

            <div className={styles.insightsRow}>
              {/* Weekly Spending */}
              <div className={styles.spendingSection}>
                <h3 className={styles.sectionTitle}>Weekly Spending</h3>
                <div className={styles.chartContainer}>
                  {weeklyAmounts.map((amount, index) => (
                    <div key={index} className={styles.barContainer}>
                      <div
                        className={styles.bar}
                        style={{
                          height: maxWeeklySpending
                            ? `${(amount / maxWeeklySpending) * 100}%`
                            : "0%",
                          backgroundColor:
                            index === 2
                              ? "#667eea"
                              : index % 2 === 0
                                ? "#764ba2"
                                : "#8b5cf6",
                        }}
                        title={formatCurrency(amount)}
                      ></div>
                      <span className={styles.barLabel}>{getDayName(index)}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.statsRow}>
                  <div className={styles.statItem}>
                    <p className={styles.statLabel}>Total Orders</p>
                    <p className={styles.statValue}>{totalVisits}</p>
                  </div>
                  <div className={styles.statItem}>
                    <p className={styles.statLabel}>Avg Spend</p>
                    <p className={styles.statValue}>{averageSpend}</p>
                  </div>
                  <div className={styles.statItem}>
                    <p className={styles.statLabel}>Top Restaurant</p>
                    <p className={styles.statValue}>{topRestaurant}</p>
                  </div>
                  <div className={styles.statItem}>
                    <p className={styles.statLabel}>Total Spent</p>
                    <p className={styles.statValue}>{totalSpentDisplay}</p>
                  </div>
                </div>
              </div>

              {/* Order Frequency */}
              <div className={styles.frequencySection}>
                <h3 className={styles.sectionTitle}>Order Frequency</h3>
                <div className={styles.donutContainer}>
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="20"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#667eea"
                      strokeWidth="20"
                      strokeDasharray={donutCircumference}
                      strokeDashoffset={orderDashOffset}
                      transform="rotate(-90 60 60)"
                      strokeLinecap="round"
                    />
                    <text
                      x="60"
                      y="65"
                      textAnchor="middle"
                      className={styles.donutText}
                    >
                      {monthlyOrders}
                    </text>
                    <text
                      x="60"
                      y="80"
                      textAnchor="middle"
                      className={styles.donutSubtext}
                    >
                      Orders this month
                    </text>
                  </svg>
                </div>
                <div className={styles.legend}>
                  {orderFrequency.map((count, idx) => (
                    <div key={weekLabels[idx]} className={styles.legendItem}>
                      <div className={styles.legendLabel}>
                        <div
                          className={styles.legendDot}
                          style={{
                            backgroundColor: visitLegendColors[idx],
                          }}
                        ></div>
                        <span className={styles.legendText}>{weekLabels[idx]}</span>
                      </div>
                      <span className={styles.legendCount}>
                        {count} {count === 1 ? "order" : "orders"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Order Overview */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Order Overview</h2>
              <div className={styles.tabs}>
                <button
                  className={
                    activeOrderTab === "recent" ? styles.tabActive : styles.tab
                  }
                  onClick={() => setActiveOrderTab("recent")}
                >
                  Ongoing Orders
                </button>
                <button
                  className={
                    activeOrderTab === "past" ? styles.tabActive : styles.tab
                  }
                  onClick={() => setActiveOrderTab("past")}
                >
                  Past Orders
                </button>
              </div>
            </div>

            <div className={styles.ordersList}>
              {(activeOrderTab === "recent" ? recentOrders : pastOrders).map(
                (order, index) => {
                  const formattedStatus = formatOrderStatus(order.status);
                  return (
                    <div key={order.recordId || index} className={styles.orderItem}>
                      <img
                        src={order.image || "/dish-placeholder.png"}
                        alt={order.dishName}
                        className={styles.orderImage}
                      />
                      <div className={styles.orderInfo}>
                        <h4 className={styles.orderName}>
                          {order.restaurant || "Restaurant"}
                        </h4>
                        <p className={styles.orderPrice}>
                          {formatCurrency(order.price)}
                        </p>
                        <p className={styles.orderMeta}>
                          {order.dishName || "Unknown Dish"}
                        </p>
                        <p
                          className={styles.orderStatus}
                          style={{
                            color: getOrderStatusColor(formattedStatus),
                          }}
                        >
                          {formattedStatus === "completed"
                            ? "Completed order"
                            : `Order is ${formattedStatus}`}
                        </p>
                      </div>
                      <div className={styles.orderActions}>
                        <button
                          className={styles.rateButton}
                          onClick={() => handleRateOrder(order)}
                        >
                          Rate
                        </button>
                        <button
                          className={styles.reorderButton}
                          style={{
                            opacity:
                              reorderingOrderId === order.recordId ? 0.7 : 1,
                            cursor:
                              reorderingOrderId === order.recordId
                                ? "not-allowed"
                                : "pointer",
                          }}
                          onClick={() => handleReorder(order)}
                          disabled={reorderingOrderId === order.recordId}
                        >
                          {reorderingOrderId === order.recordId
                            ? "Reordering..."
                            : "Reorder"}
                        </button>
                      </div>
                    </div>
                  );
                },
              )}
              {(activeOrderTab === "recent" ? recentOrders : pastOrders)
                .length === 0 && (
                <div className={styles.noOrdersMessage}>
                  <p>
                    No {activeOrderTab === "recent" ? "recent" : "past"} orders
                    found
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Favorite Dishes */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Favorite Dishes</h2>
            {loadingFavorites ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : favoriteDishes.length > 0 ? (
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                <div className={styles.favoriteDishesGrid}>
                  {favoriteDishes.map((dish, index) => {
                    console.log("Rendering favorite dish:", dish);
                    return (
                      <div
                        key={dish._id || index}
                        className={styles.dishCard}
                        onClick={() =>
                          (dish.restaurantId || dish.rest_id) &&
                          navigate(
                            `/customer/restaurant/${dish.restaurantId || dish.rest_id}`,
                          )
                        }
                      >
                        <div className={styles.dishImageContainer}>
                          <img
                            src={
                              dish.image ||
                              dish.imageUrl ||
                              "https://via.placeholder.com/80"
                            }
                            alt={dish.name}
                            className={styles.dishImage}
                          />
                        </div>
                        <div className={styles.dishInfo}>
                          <h4 className={styles.dishName}>{dish.name}</h4>
                          {(dish.restaurantName || dish.restaurant) && (
                            <p className={styles.restaurantName}>
                              <i className="bi bi-shop"></i>{" "}
                              {dish.restaurantName || dish.restaurant}
                            </p>
                          )}
                          {dish.price && (
                            <p className={styles.dishPrice}>
                              ₹{Number(dish.price).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>❤️</div>
                <p className={styles.emptyText}>No favorite dishes yet</p>
                <p className={styles.emptySubtext}>
                  Save your favorite dishes to see them here
                </p>
              </div>
            )}
          </div>

          {/* Table Reservations */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Table Reservations</h2>
            </div>

            <div className={styles.reservationsContainer}>
              <div className={styles.reservationColumn}>
                <h3 className={styles.reservationTitle}>Upcoming</h3>
                {upcomingReservations.length > 0 ? (
                  upcomingReservations.map((res, index) => (
                    <div
                      key={res.id || res._id || index}
                      className={styles.reservationItem}
                    >
                      <span className={styles.restaurantIcon}>🍽️</span>
                      <div>
                        <p className={styles.reservationName}>{res.restaurant}</p>
                        <p className={styles.reservationDetails}>
                          {formatReservationDate(res.date)}
                          {res.time ? ` at ${res.time}` : ""} ·{" "}
                          {formatGuestCount(res.guests)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    No upcoming reservations. Book your next table to see it
                    here.
                  </div>
                )}
              </div>

              <div className={styles.reservationColumn}>
                <h3 className={styles.reservationTitle}>Past</h3>
                {pastReservations.length > 0 ? (
                  pastReservations.map((res, index) => (
                    <div
                      key={res.id || res._id || `past-${index}`}
                      className={styles.reservationItem}
                    >
                      <span className={styles.restaurantIcon}>🍽️</span>
                      <div>
                        <p className={styles.reservationName}>{res.restaurant}</p>
                        <p className={styles.reservationDetails}>
                          {formatReservationDate(res.date)}
                          {res.time ? ` at ${res.time}` : ""} ·{" "}
                          {formatGuestCount(res.guests)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    Past reservations will appear once you complete a booking.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.rightSection}>
          {/* Feedback & Reviews */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Feedback & Reviews</h2>
            <div className={styles.satisfactionContainer}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#ff6b35"
                  strokeWidth="8"
                  strokeDasharray={satisfactionCircumference}
                  strokeDashoffset={Math.max(satisfactionOffset, 0)}
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                />
                <text
                  x="50"
                  y="55"
                  textAnchor="middle"
                  className={styles.satisfactionText}
                >
                  {`${Math.round(Math.max(0, satisfactionRate))}%`}
                </text>
              </svg>
              <p className={styles.satisfactionLabel}>
                {totalReviews > 0
                  ? `Based on your ${totalReviews} ${reviewLabel}`
                  : "Share feedback to see your satisfaction score"}
              </p>
            </div>

            <div className={styles.reviewsSection}>
              <h3 className={styles.sectionTitle}>Recent Feedback</h3>
              {recentReviewsList.length > 0 ? (
                recentReviewsList.map((review, index) => (
                  <div
                    key={review.createdAt || index}
                    className={styles.reviewItem}
                  >
                    <div className={styles.reviewHeader}>
                      <p className={styles.reviewRestaurant}>{review.restaurant}</p>
                      {typeof review.rating === "number" &&
                      !Number.isNaN(review.rating) ? (
                        <div className={styles.reviewRating}>
                          <span className={styles.reviewStars}>
                            {renderStars(review.rating)}
                          </span>
                          <span className={styles.reviewRatingValue}>
                            {review.rating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className={styles.reviewRatingValue}>
                          No rating yet
                        </span>
                      )}
                    </div>
                    <p className={styles.reviewText}>
                      {review.comment
                        ? `"${review.comment}"`
                        : "No written feedback provided."}
                    </p>
                    {review.lovedItems ? (
                      <p className={styles.reviewLovedItems}>
                        Loved: {review.lovedItems}
                      </p>
                    ) : null}
                    {review.createdAt ? (
                      <p className={styles.reviewTimestamp}>
                        {formatReviewTimestamp(review.createdAt)}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  Share your first review to see it highlighted here.
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Notifications</h2>

            {notifications.map((notification) => (
              <div key={notification.id} className={styles.notificationItem}>
                <div className={getNotificationIconStyle(notification.type)}>
                  {notification.icon || "ℹ️"}
                </div>
                <div>
                  <p className={styles.notificationText}>{notification.message}</p>
                  {notification.timeAgo ? (
                    <p className={styles.notificationTime}>
                      {notification.timeAgo}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className={styles.emptyState}>
                You're all caught up. Order or book to see updates here.
              </div>
            )}

            <div className={styles.notificationToggle}>
              <span>Email Notifications</span>
              <label
                className={styles.switch}
                style={{
                  opacity: notificationSaving ? 0.6 : 1,
                  cursor: notificationSaving ? "not-allowed" : "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={emailNotificationsEnabled}
                  onChange={handleNotificationToggle}
                  disabled={notificationSaving}
                  className={styles.switchInput}
                  role="switch"
                  aria-checked={emailNotificationsEnabled}
                  aria-label="Email notifications"
                  onFocus={() => setSwitchFocused(true)}
                  onBlur={() => setSwitchFocused(false)}
                />

                <span
                  className={styles.slider}
                  style={{
                    backgroundColor: emailNotificationsEnabled
                      ? "#22c55e"
                      : "#e5e7eb",
                    boxShadow: switchFocused
                      ? emailNotificationsEnabled
                        ? "0 0 0 4px rgba(34,197,94,0.12)"
                        : "0 0 0 4px rgba(0,0,0,0.08)"
                      : undefined,
                  }}
                >
                  <span
                    className={styles.sliderKnob}
                    style={{
                      left: emailNotificationsEnabled ? "31px" : "3px",
                      boxShadow: emailNotificationsEnabled
                        ? "0 2px 6px rgba(34,197,94,0.4)"
                        : "0 1px 3px rgba(0,0,0,0.15)",
                    }}
                  />
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit Profile</h2>
              <button
                className={styles.modalCloseButton}
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className={styles.modalForm}>
              {updateError && (
                <div className={styles.errorMessage}>{updateError}</div>
              )}
              {updateSuccess && (
                <div className={styles.successMessage}>{updateSuccess}</div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleInputChange}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Profile Picture</label>
                <div className={styles.profilePicContainer}>
                  <div
                    className={styles.profilePicPreview}
                    style={{
                      backgroundImage: profilePicPreview
                        ? `url('${profilePicPreview}')`
                        : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: profilePicPreview ? "transparent" : "#999",
                    }}
                    onClick={handleProfilePicClick}
                  >
                    {!profilePicPreview && "📷"}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleProfilePicChange}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={handleProfilePicClick}
                    className={styles.changePicButton}
                  >
                    {selectedProfileFile
                      ? "✓ Image Selected"
                      : "Change Picture"}
                  </button>
                </div>
              </div>

              <div className={styles.formDivider}>
                <p className={styles.formDividerText}>Change Password (optional)</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={editFormData.newPassword}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Leave empty to keep current password"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={editFormData.confirmPassword}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Leave empty to keep current password"
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={styles.cancelButton}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
