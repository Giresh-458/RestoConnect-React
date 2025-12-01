import { redirect, useLoaderData, useNavigate } from "react-router-dom";
import { isLogin } from "../util/auth";
import { useSelector, useDispatch } from "react-redux";
import { addItem, removeItem } from "../store/CartSlice";
import { useState, useEffect } from "react";
import { addToFavourites, removeFromFavourites, getFavourites } from "../util/favourites";
import styles from "./MenuPage.module.css";

export function MenuPage() {
  const data = useLoaderData();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.dishes || []);
  const cartTotal = useSelector((state) => state.cart.amount || 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showOrderSummary, setShowOrderSummary] = useState(true);
  const [favourites, setFavourites] = useState([]);
  const [loadingFavourites, setLoadingFavourites] = useState(true);

  if (!data || !data.restaurant || !data.dishes) {
    return (
      <div className={styles.errorContainer}>
        <h2>Restaurant not found</h2>
        <button onClick={() => navigate("/customer/")}>Go Back</button>
      </div>
    );
  }

  const { restaurant, dishes } = data;

  // Filter dishes based on search and category
  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dish.description && dish.description.toLowerCase().includes(searchQuery.toLowerCase()));
    // For now, all dishes are shown. You can add category filtering later
    return matchesSearch;
  });

  // Get recommended dishes (top 4 by default, or you can implement recommendation logic)
  const recommendedDishes = filteredDishes.slice(0, 4);

  const getQuantity = (dishId) => {
    const item = cartItems.find((item) => item.id === dishId);
    return item ? item.quantity : 0;
  };

  const handleAddItem = (dish) => {
    dispatch(addItem({ ...dish, amount: dish.price }));
  };

  const handleRemoveItem = (dish) => {
    dispatch(removeItem({ ...dish, amount: dish.price }));
  };

  const handleOrder = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty. Add some items first!");
      return;
    }
    navigate("/customer/order");
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee = 3.00;
  const taxes = (cartTotal * 0.08).toFixed(2); // 8% tax
  const finalTotal = (parseFloat(cartTotal) + deliveryFee + parseFloat(taxes)).toFixed(2);

  const categories = ["All", "Appetizers", "Mains", "Desserts"];

  // Load favourites on component mount
  useEffect(() => {
    const loadFavourites = async () => {
      try {
        const favs = await getFavourites();
        setFavourites(favs);
      } catch (error) {
        console.error('Error loading favourites:', error);
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
      setFavourites(prev => [...prev, dishId]);
    } catch (error) {
      console.error('Error adding to favourites:', error);
      alert('Failed to add to favourites');
    }
  };

  // Handle removing from favourites
  const handleRemoveFromFavourites = async (dishId) => {
    try {
      await removeFromFavourites(dishId);
      setFavourites(prev => prev.filter(id => id !== dishId));
    } catch (error) {
      console.error('Error removing from favourites:', error);
      alert('Failed to remove from favourites');
    }
  };

  return (
    <div className={styles.menuPage}>
      {/* Restaurant Banner */}
      <div className={styles.restaurantBanner}>
        <div className={styles.bannerOverlay}>
          <h1 className={styles.bannerTitle}>{restaurant.name}</h1>
          <div className={styles.bannerMeta}>
            <span>{restaurant.cuisine?.[0] || "Restaurant"}</span>
            {restaurant.rating && <span>⭐ {restaurant.rating.toFixed(1)} Stars</span>}
            <span>📍 {restaurant.location}</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className={styles.searchFilterSection}>
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              onClick={() => setSelectedCategory(category)}
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
                    onRemoveFromFavourites={() => handleRemoveFromFavourites(dish.id)}
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
                <p>No dishes found matching your search.</p>
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
                    onRemoveFromFavourites={() => handleRemoveFromFavourites(dish.id)}
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
                <p className={styles.emptyCartSubtext}>Add items to get started</p>
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
                          e.target.src = "https://via.placeholder.com/60x60?text=Dish";
                        }}
                      />
                      <div className={styles.orderItemInfo}>
                        <h4 className={styles.orderItemName}>{item.name}</h4>
                        <div className={styles.orderItemControls}>
                          <span className={styles.orderItemPrice}>₹{item.price.toFixed(2)}</span>
                          <div className={styles.orderQuantityControls}>
                            <button
                              className={styles.orderQuantityButton}
                              onClick={() => handleRemoveItem(item)}
                            >
                              −
                            </button>
                            <span className={styles.orderQuantity}>{item.quantity}</span>
                            <button
                              className={styles.orderQuantityButton}
                              onClick={() => handleAddItem(item)}
                            >
                              +
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
                    <button className={styles.payCardButton} onClick={handleOrder}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                      </svg>
                      Pay with Card
                    </button>
                    <button className={styles.payUPIButton} onClick={handleOrder}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <path d="M9 9h6v6H9z"></path>
                        <path d="M9 1v6M15 1v6M9 23v-6M15 23v-6M1 9h6M1 15h6M23 9h-6M23 15h-6"></path>
                      </svg>
                      Pay with UPI
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
    </div>
  );
}

// Dish Card Component
function DishCard({ dish, quantity, onAdd, onRemove, isFavourite, onAddToFavourites, onRemoveFromFavourites }) {
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
          className={`${styles.favouriteButton} ${isFavourite ? styles.favouriteButtonActive : ''}`}
          onClick={() => isFavourite ? onRemoveFromFavourites() : onAddToFavourites()}
          title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavourite ? "red" : "none"} stroke="currentColor" strokeWidth="2">
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
  if (role != 'customer') {
    return redirect('/login');
  }

  try {
    const response = await fetch(
      `http://localhost:3000/api/customer/menu/${params.id || params.restid}`,
      {
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch menu');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading menu:', error);
    return { restaurant: null, dishes: [] };
  }
}
