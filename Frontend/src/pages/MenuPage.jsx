import { redirect, useLoaderData, useNavigate } from "react-router-dom";
import { isLogin } from "../util/auth";
import { useSelector, useDispatch } from "react-redux";
import {
  addItem,
  removeItem,
  deleteItem,
  clearcart,
  setRestaurant,
} from "../store/CartSlice";
import { useState, useEffect } from "react";
import {
  addToFavourites,
  removeFromFavourites,
  getFavourites,
} from "../util/favourites";
import styles from "./MenuPage.module.css";
import { CheckoutSteps } from "../components/CheckoutSteps";

export function MenuPage() {
  const data = useLoaderData();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.dishes || []);
  const cartTotal = useSelector((state) => state.cart.amount || 0);
  const currentRestId = useSelector((state) => state.cart.restId);
  const currentRestName = useSelector((state) => state.cart.restName);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showOrderSummary, setShowOrderSummary] = useState(true);
  const [favourites, setFavourites] = useState([]);
  const [loadingFavourites, setLoadingFavourites] = useState(true);
  const [showSwitchWarning, setShowSwitchWarning] = useState(false);
  const [pendingDish, setPendingDish] = useState(null);

  if (!data || !data.restaurant || !data.dishes) {
    return (
      <div className={styles.errorContainer}>
        <h2>Restaurant not found</h2>
        <button onClick={() => navigate("/customer/")}>Go Back</button>
      </div>
    );
  }

  const { restaurant, dishes } = data;
  const restIdForCart = restaurant._id || restaurant.id;

  // Filter dishes based on search and category
  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dish.description &&
        dish.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "All" ||
      (dish.category &&
        dish.category.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // Get recommended dishes (top 4 by default, or you can implement recommendation logic)
  const recommendedDishes = filteredDishes.slice(0, 4);

  const getQuantity = (dishId) => {
    // Only show quantity if the cart items are from the current restaurant
    if (currentRestId && currentRestId !== restIdForCart) {
      return 0;
    }
    const item = cartItems.find((item) => item.id === dishId);
    return item ? item.quantity : 0;
  };

  const handleAddItem = (dish) => {
    // If cart is empty: set restaurant and add without any prompt
    if (cartItems.length === 0) {
      dispatch(
        setRestaurant({ restId: restIdForCart, restName: restaurant.name }),
      );
      dispatch(addItem({ ...dish, amount: dish.price }));
      return;
    }

    if (currentRestId === restIdForCart) {
      dispatch(addItem({ ...dish, amount: dish.price }));
      return;
    }

    setPendingDish(dish);
    setShowSwitchWarning(true);
  };

  const handleConfirmSwitch = () => {
    if (pendingDish) {
      dispatch(clearcart());
      dispatch(
        setRestaurant({ restId: restIdForCart, restName: restaurant.name }),
      );
      dispatch(addItem({ ...pendingDish, amount: pendingDish.price }));
      setPendingDish(null);
      setShowSwitchWarning(false);
    }
  };

  const handleCancelSwitch = () => {
    setPendingDish(null);
    setShowSwitchWarning(false);
  };

  const handleRemoveItem = (dish) => {
    dispatch(removeItem({ ...dish, amount: dish.price }));
  };

  const handleDeleteItem = (dish) => {
    // Remove all instances of this dish from cart
    dispatch(deleteItem({ ...dish, amount: dish.price }));
  };

  const handleOrder = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty. Add some items first!");
      return;
    }
    navigate("/customer/order", {
      state: { restId: restIdForCart, restName: restaurant.name },
    });
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee = 3.0;
  const taxes = (cartTotal * 0.08).toFixed(2); // 8% tax
  const finalTotal = (
    parseFloat(cartTotal) +
    deliveryFee +
    parseFloat(taxes)
  ).toFixed(2);

  const categories = ["All", "Appetizers", "Mains", "Desserts"];

  // Load favourites on component mount
  useEffect(() => {
    const loadFavourites = async () => {
      try {
        const favs = await getFavourites();
        // Backend now returns array of dish objects, extract IDs
        const favoriteIds = Array.isArray(favs)
          ? favs.map((dish) => dish._id || dish.id || dish)
          : [];
        setFavourites(favoriteIds);
      } catch (error) {
        console.error("Error loading favourites:", error);
      } finally {
        setLoadingFavourites(false);
      }
    };
    loadFavourites();
  }, []);

  // Helper function to check if dish is favourite
  const isFavourite = (dishId) => {
    return favourites.includes(dishId);
  };

  // Handle adding to favourites
  const handleAddToFavourites = async (dishId) => {
    try {
      await addToFavourites(dishId);
      setFavourites((prev) => [...prev, dishId]);
    } catch (error) {
      console.error("Error adding to favourites:", error);
      alert("Failed to add to favourites");
    }
  };

  // Handle removing from favourites
  const handleRemoveFromFavourites = async (dishId) => {
    try {
      await removeFromFavourites(dishId);
      setFavourites((prev) => prev.filter((id) => id !== dishId));
    } catch (error) {
      console.error("Error removing from favourites:", error);
      alert("Failed to remove from favourites");
    }
  };

  return (
    <div className={styles.menuPage}>
      <CheckoutSteps current="menu" />
      {/* Restaurant Banner */}
      <div
        className={styles.restaurantBanner}
        style={{
          backgroundImage: restaurant.image
            ? `linear-gradient(135deg, rgba(79, 172, 254, 0.6), rgba(0, 242, 254, 0.6), rgba(0, 212, 170, 0.6)), url("${restaurant.image}")`
            : `linear-gradient(135deg, rgba(79, 172, 254, 0.6), rgba(0, 242, 254, 0.6), rgba(0, 212, 170, 0.6))`,
        }}
      >
        <div className={styles.bannerOverlay}>
          <h1 className={styles.bannerTitle}>{restaurant.name}</h1>
          <div className={styles.bannerMeta}>
            <span>{restaurant.cuisine?.[0] || "Restaurant"}</span>
            {restaurant.rating && (
              <span>⭐ {restaurant.rating.toFixed(1)} Stars</span>
            )}
            <span>📍 {restaurant.location}</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className={styles.searchFilterSection}>
        <div className={styles.searchBar}>
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search for a dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.categoryFilters}>
          {categories.map((category) => (
            <button
              key={category}
              className={`${styles.categoryButton} ${
                selectedCategory === category ? styles.categoryButtonActive : ""
              }`}
              onClick={() => {
                setSelectedCategory(category);
                setSearchQuery(""); // Clear search when switching tabs
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Menu Section */}
        <div className={styles.menuContent}>
          {/* Recommended Section */}
          {recommendedDishes.length > 0 && (
            <section className={styles.menuSection}>
              <h2 className={styles.sectionTitle}>Recommended for You</h2>
              <div className={styles.dishesGrid}>
                {recommendedDishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    quantity={getQuantity(dish.id)}
                    onAdd={() => handleAddItem(dish)}
                    onRemove={() => handleRemoveItem(dish)}
                    isFavourite={isFavourite(dish.id)}
                    onAddToFavourites={() => handleAddToFavourites(dish.id)}
                    onRemoveFromFavourites={() =>
                      handleRemoveFromFavourites(dish.id)
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* Full Menu Section */}
          <section className={styles.menuSection}>
            <h2 className={styles.sectionTitle}>Full Menu</h2>
            {filteredDishes.length === 0 ? (
              <div className={styles.noDishes}>
                {selectedCategory !== "All" && searchQuery === "" ? (
                  <p>{selectedCategory} - Not Available</p>
                ) : (
                  <p>No dishes found matching your search.</p>
                )}
              </div>
            ) : (
              <div className={styles.dishesGrid}>
                {filteredDishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    quantity={getQuantity(dish.id)}
                    onAdd={() => handleAddItem(dish)}
                    onRemove={() => handleRemoveItem(dish)}
                    isFavourite={isFavourite(dish.id)}
                    onAddToFavourites={() => handleAddToFavourites(dish.id)}
                    onRemoveFromFavourites={() =>
                      handleRemoveFromFavourites(dish.id)
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Order Summary Sidebar */}
        {showOrderSummary && (
          <div className={styles.orderSummary}>
            <div className={styles.orderSummaryHeader}>
              <h3>Your Order</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowOrderSummary(false)}
              >
                ×
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className={styles.emptyCart}>
                <p>Your cart is empty</p>
                <p className={styles.emptyCartSubtext}>
                  Add items to get started
                </p>
              </div>
            ) : (
              <>
                <div className={styles.orderItems}>
                  {cartItems.map((item) => (
                    <div key={item.id} className={styles.orderItem}>
                      <img
                        src={item.image || "/images/default-dish.jpg"}
                        alt={item.name}
                        className={styles.orderItemImage}
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/60x60?text=Dish";
                        }}
                      />
                      <div className={styles.orderItemInfo}>
                        <h4 className={styles.orderItemName}>{item.name}</h4>
                        <div className={styles.orderItemControls}>
                          <span className={styles.orderItemPrice}>
                            ₹{item.price.toFixed(2)}
                          </span>
                          <div className={styles.orderQuantityControls}>
                            <button
                              className={styles.orderQuantityButton}
                              onClick={() => handleRemoveItem(item)}
                              title="Decrease quantity"
                            >
                              −
                            </button>
                            <span className={styles.orderQuantity}>
                              {item.quantity}
                            </span>
                            <button
                              className={styles.orderQuantityButton}
                              onClick={() => handleAddItem(item)}
                              title="Increase quantity"
                            >
                              +
                            </button>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDeleteItem(item)}
                              title="Remove item from cart"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.orderSummaryFooter}>
                  <div className={styles.orderSummaryRow}>
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className={styles.orderSummaryRow}>
                    <span>Delivery Fee</span>
                    <span>₹{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className={styles.orderSummaryRow}>
                    <span>Taxes & Charges</span>
                    <span>₹{taxes}</span>
                  </div>
                  <div className={styles.orderSummaryTotal}>
                    <span>Total</span>
                    <span>₹{finalTotal}</span>
                  </div>

                  <div className={styles.paymentButtons}>
                    <button
                      className={styles.payCardButton}
                      onClick={handleOrder}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="1"
                          y="4"
                          width="22"
                          height="16"
                          rx="2"
                          ry="2"
                        ></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      Proceed to Order
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Show Order Summary Button (when hidden) */}
        {!showOrderSummary && cartItemCount > 0 && (
          <button
            className={styles.showOrderButton}
            onClick={() => setShowOrderSummary(true)}
          >
            🛒 {cartItemCount} items - ₹{cartTotal.toFixed(2)}
          </button>
        )}
      </div>

      {/* Restaurant Switch Warning Modal */}
      {showSwitchWarning && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Switch Restaurant?</h3>
            <p>
              Your cart currently has items from "
              <strong>{currentRestName || "another restaurant"}</strong>".
            </p>
            <p>
              Switching to "<strong>{restaurant.name}</strong>" will clear your
              cart. Do you want to continue?
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalCancelButton}
                onClick={handleCancelSwitch}
              >
                Cancel
              </button>
              <button
                className={styles.modalConfirmButton}
                onClick={handleConfirmSwitch}
              >
                Yes, Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dish Card Component
function DishCard({
  dish,
  quantity,
  onAdd,
  onRemove,
  isFavourite,
  onAddToFavourites,
  onRemoveFromFavourites,
}) {
  return (
    <div className={styles.dishCard}>
      <div className={styles.dishImageContainer}>
        <img
          src={dish.image || "/images/default-dish.jpg"}
          alt={dish.name}
          className={styles.dishImage}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/300x200?text=Dish";
          }}
        />
        <button
          className={`${styles.favouriteButton} ${
            isFavourite ? styles.favouriteButtonActive : ""
          }`}
          onClick={() =>
            isFavourite ? onRemoveFromFavourites() : onAddToFavourites()
          }
          title={isFavourite ? "Remove from favourites" : "Add to favourites"}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={isFavourite ? "currentColor" : "none"}
            stroke={isFavourite ? "none" : "currentColor"}
            strokeWidth={isFavourite ? "0" : "2"}
            style={{ color: isFavourite ? "#ff4757" : "#666" }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      <div className={styles.dishInfo}>
        <h3 className={styles.dishName}>{dish.name}</h3>
        {dish.description && (
          <p className={styles.dishDescription}>{dish.description}</p>
        )}
        <div className={styles.dishFooter}>
          <span className={styles.dishPrice}>₹{dish.price}</span>
          <div className={styles.quantityControls}>
            {quantity === 0 ? (
              <button className={styles.addButton} onClick={onAdd}>
                Add
              </button>
            ) : (
              <div className={styles.quantityButtons}>
                <button className={styles.quantityButton} onClick={onRemove}>
                  −
                </button>
                <span className={styles.quantity}>{quantity}</span>
                <button className={styles.quantityButton} onClick={onAdd}>
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function loader({ request, params }) {
  let role = await isLogin();
  if (role != "customer") {
    return redirect("/login");
  }

  try {
    const response = await fetch(
      `http://localhost:3000/api/customer/menu/${params.id || params.restid}`,
      {
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch menu");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error loading menu:", error);
    return { restaurant: null, dishes: [] };
  }
}
