import { useState, useEffect, useCallback } from "react";
import { useLoaderData, redirect, useNavigate } from "react-router-dom";
import { isLogin } from "../util/auth";
import { getFavourites } from "../util/favourites";
import styles from "./CustomerHomepage.module.css";

export async function loader() {
  let role = await isLogin();
  if (role != 'customer') {
    return redirect('/login');
  }
  
  // Fetch restaurants on load
  try {
    const response = await fetch("http://localhost:3000/api/customer/restaurants/search", {
      credentials: "include"
    });
    const data = await response.json();
    return { restaurants: data.restaurants || [] };
  } catch (error) {
    console.error("Error loading restaurants:", error);
    return { restaurants: [] };
  }
}

export function CustomerHomepage() {
  const { restaurants: initialRestaurants } = useLoaderData();
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [searchQuery, setSearchQuery] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [maxDistance, setMaxDistance] = useState(5);
  const [sortBy, setSortBy] = useState("rating");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [location, setLocation] = useState("All");
  const [locations, setLocations] = useState([]);
  const [cuisines, setCuisines] = useState(["All"]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const navigate = useNavigate();

  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3000/api/restaurants", {
        credentials: "include"
      });
      const data = await response.json();
      const uniqueLocations = [...new Set(data.map(r => r.location).filter(Boolean))];
      setLocations(["All", ...uniqueLocations]);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }, []);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (openNow) params.append("openNow", "true");
      if (maxDistance) params.append("maxDistance", maxDistance.toString());
      if (sortBy) params.append("sortBy", sortBy);
      if (selectedCuisine && selectedCuisine !== "All") params.append("cuisine", selectedCuisine);
      if (location && location !== "All") params.append("location", location);

      const response = await fetch(
        `http://localhost:3000/api/customer/restaurants/search?${params.toString()}`,
        {
          credentials: "include"
        }
      );
      const data = await response.json();
      setRestaurants(data.restaurants || []);
      
      // Update available cuisines
      if (data.availableCuisines && data.availableCuisines.length > 0) {
        setCuisines(["All", ...data.availableCuisines]);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, openNow, maxDistance, sortBy, selectedCuisine, location]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Fetch favorites when the component mounts and when activeTab changes to 'favorites'
  useEffect(() => {
    if (activeTab === 'favorites') {
      const fetchFavorites = async () => {
        try {
          console.log('Fetching favorites...');
          setLoadingFavorites(true);
          const favoritesData = await getFavourites();
          console.log('Received favorites data:', favoritesData);
          setFavorites(Array.isArray(favoritesData) ? favoritesData : []);
        } catch (error) {
          console.error('Error fetching favorites:', error);
          setFavorites([]);
        } finally {
          setLoadingFavorites(false);
        }
      };
      fetchFavorites();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  // Debounced search: auto-run fetchRestaurants shortly after typing stops
  useEffect(() => {
    const handle = setTimeout(() => {
      // only trigger if there's an actual query to avoid noisy requests
      if (searchQuery && searchQuery.trim().length > 0) fetchRestaurants();
    }, 350);
    return () => clearTimeout(handle);
  }, [searchQuery, fetchRestaurants]);

  const handleCuisineClick = (cuisine) => {
    setSelectedCuisine(cuisine === selectedCuisine ? "All" : cuisine);
  };

  const clearCuisineFilter = () => {
    setSelectedCuisine("All");
  };

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/customer/restaurant/${restaurantId}`);
  };

  // Get popular restaurants (top rated)
  const popularRestaurants = [...restaurants]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 6);

  // Get nearby restaurants (sorted by distance)
  const nearbyRestaurants = [...restaurants]
    .filter(r => r.distance !== undefined)
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
    .slice(0, 6);

  // Tab navigation
  const renderTabs = () => (
    <div className={styles.tabs}>
      <button
        className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
        onClick={() => setActiveTab('all')}
      >
        All Restaurants
      </button>
      <button
        className={`${styles.tab} ${activeTab === 'favorites' ? styles.activeTab : ''}`}
        onClick={() => setActiveTab('favorites')}
      >
        My Favorites
      </button>
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    console.log('Rendering content, activeTab:', activeTab, 'favorites:', favorites);
    if (activeTab === 'favorites') {
      if (loadingFavorites) {
        return (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading your favorite dishes...</p>
          </div>
        );
      }

      if (favorites.length === 0) {
        return (
          <div className={styles.noResults}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <h3>No favorite dishes yet</h3>
            <p>Save your favorite dishes to see them here!</p>
          </div>
        );
      }

      console.log('Rendering favorites:', favorites);
      return (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>❤️</span>
              My Favorite Dishes
            </h2>
            <p className={styles.sectionSubtitle}>Your saved favorite dishes from all restaurants</p>
          </div>
          {favorites.length > 0 ? (
            <div className={styles.restaurantsGrid}>
              {favorites.map((dish) => (
                <div key={dish._id || dish.id} className={styles.restaurantCard}>
                  <div className={styles.restaurantImageContainer}>
                    <img 
                      src={dish.image || '/placeholder-dish.jpg'} 
                      alt={dish.name} 
                      className={styles.restaurantImage}
                    />
                  </div>
                  <div className={styles.restaurantInfo}>
                    <div className={styles.restaurantHeader}>
                      <h3 className={styles.restaurantName}>{dish.name}</h3>
                      {dish.price && (
                        <div className={styles.ratingBadge}>
                          <span className={styles.ratingValue}>${dish.price.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    {dish.restaurantName && (
                      <p className={styles.restaurantLocation}>
                        <span>🍽️</span> {dish.restaurantName}
                      </p>
                    )}
                    <p className={styles.dishDescription}>
                      {dish.description || 'No description available'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noResults}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <h3>No favorite dishes yet</h3>
              <p>Save your favorite dishes from the menu to see them here!</p>
            </div>
          )}
        </div>
      );
    }

    // Default view: All Restaurants
    return (
      <>
        {popularRestaurants.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>⭐</span>
                Popular Restaurants
              </h2>
              <p className={styles.sectionSubtitle}>Top rated restaurants loved by customers</p>
            </div>
            <div className={styles.restaurantsGrid}>
              {popularRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant._id}
                  restaurant={restaurant}
                  onClick={() => handleRestaurantClick(restaurant._id)}
                  onViewMenu={() => handleRestaurantClick(restaurant._id)}
                />
              ))}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🍴</span>
              All Restaurants
            </h2>
            {selectedCuisine !== "All" && (
              <div className={styles.filterIndicator}>
                <span>Filtered by: <strong>{selectedCuisine}</strong></span>
                <button className={styles.filterClear} onClick={clearCuisineFilter}>× Clear</button>
              </div>
            )}
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading restaurants...</p>
            </div>
          ) : restaurants.length === 0 ? (
            <div className={styles.noResults}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <h3>No restaurants found</h3>
              <p>Try adjusting your search or filters to find more options.</p>
            </div>
          ) : (
            <div className={styles.restaurantsGrid}>
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant._id}
                  restaurant={restaurant}
                  onClick={() => handleRestaurantClick(restaurant._id)}
                  onViewMenu={() => handleRestaurantClick(restaurant._id)}
                />
              ))}
            </div>
          )}
        </section>
      </>
    );
  };

  return (
    <div className={styles.customerHomepage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Find your perfect meal nearby
            <span className={styles.heroIcon}>🍴</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Discover the best local restaurants and get your favorite food delivered to your door.
          </p>
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <div className={styles.searchBar}>
              <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Enter location or restaurant name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className={styles.searchButton}>
                <span>Search</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Quick Filters Section */}
      <section className={styles.quickFilters}>
        <div className={styles.filtersContainer}>
          <div className={styles.filterRow}>
            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>
                <input
                  type="checkbox"
                  checked={openNow}
                  onChange={(e) => setOpenNow(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Open Now</span>
              </label>
            </div>

            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Distance: {maxDistance} km</label>
              <input
                type="range"
                min="1"
                max="20"
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                className={styles.rangeSlider}
              />
            </div>

            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Sort By</label>
              <select
                className={styles.select}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating">Rating</option>
                <option value="name">Name</option>
                <option value="distance">Distance</option>
              </select>
            </div>

            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Location</label>
              <select
                className={styles.select}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.cuisineSection}>
            <span className={styles.cuisineLabel}>Cuisine Types:</span>
            <div className={styles.cuisineTags}>
              {cuisines.map((cuisine) => (
                <button
                  key={cuisine}
                  type="button"
                  className={`${styles.cuisineTag} ${
                    selectedCuisine === cuisine ? styles.cuisineTagActive : ""
                  }`}
                  onClick={() => handleCuisineClick(cuisine)}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {renderContent()}
    </div>
  );
}

// Restaurant Card Component
function RestaurantCard({ restaurant, onClick }) {
  const formatPrice = (amount) => {
    if (!amount) return "₹₹";
    const rupees = "₹".repeat(Math.ceil(amount / 100));
    return rupees || "₹";
  };

  return (
    <div className={styles.restaurantCard} onClick={onClick} tabIndex={0} role="button" onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}>
      <div className={styles.restaurantImageContainer}>
        <img
          src={restaurant.image || "/images/default-restaurant.jpg"}
          alt={restaurant.name}
          className={styles.restaurantImage}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x250?text=Restaurant";
          }}
        />
        <div className={styles.restaurantOverlay}>
          <span
            className={`${styles.restaurantStatus} ${
              restaurant.isOpen ? styles.statusOpen : styles.statusClosed
            }`}
          >
            {restaurant.isOpen ? "🟢 Open" : "🔴 Closed"}
          </span>
          {restaurant.distance !== undefined && (
            <span className={styles.distanceBadge}>
              📍 {restaurant.distance.toFixed(1)} km
            </span>
          )}
        </div>
      </div>
      <div className={styles.restaurantInfo}>
        <div className={styles.restaurantHeader}>
          <h3 className={styles.restaurantName}>{restaurant.name}</h3>
          {restaurant.rating && (
            <div className={styles.ratingBadge}>
              <span className={styles.star}>⭐</span>
              <span className={styles.ratingValue}>{restaurant.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        {restaurant.location && (
          <p className={styles.restaurantLocation}>
            📍 {restaurant.location}
          </p>
        )}

        {restaurant.cuisine && restaurant.cuisine.length > 0 && (
          <div className={styles.cuisineTags}>
            {restaurant.cuisine.slice(0, 2).map((cuisine, idx) => (
              <span key={idx} className={styles.cuisineChip}>
                {cuisine}
              </span>
            ))}
            {restaurant.cuisine.length > 2 && (
              <span className={styles.cuisineChip}>+{restaurant.cuisine.length - 2}</span>
            )}
          </div>
        )}

        <div className={styles.restaurantFooter}>
          <span className={styles.priceRange}>
            {formatPrice(restaurant.amount)}
          </span>
          {restaurant.operatingHours && (
            <span className={styles.hours}>
              {restaurant.operatingHours.open} - {restaurant.operatingHours.close}
            </span>
          )}
          <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
            <button className={styles.viewMenuBtn} onClick={() => onClick && onClick()} aria-label={`View menu for ${restaurant.name}`}>
              View Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
