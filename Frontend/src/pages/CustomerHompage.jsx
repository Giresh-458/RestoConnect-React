import { useState, useEffect, useCallback } from "react";
import { useLoaderData, redirect, useNavigate } from "react-router-dom";
import { isLogin } from "../util/auth";
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

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  const handleCuisineClick = (cuisine) => {
    setSelectedCuisine(cuisine === selectedCuisine ? "All" : cuisine);
  };

  const clearCuisineFilter = () => {
    setSelectedCuisine("All");
  };

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/customer/restaurant/${restaurantId}`);
  };

  return (
    <div className={styles.customerHomepage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}></div>
          <span className={styles.logoText}>FoodFind</span>
        </div>
        <nav className={styles.nav}>
          <a href="#" className={styles.navLink}>Home</a>
          <a href="#" className={styles.navLink}>Explore</a>
          <a href="#" className={styles.navLink}>Offers</a>
          <a href="#" className={styles.navLink}>About Us</a>
        </nav>
        <div className={styles.headerActions}>
          <button className={styles.signUpButton}>Sign Up</button>
          <a href="/login" className={styles.loginLink}>Log In</a>
          <button className={styles.notificationButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
        </div>
      </header>

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
              <button type="submit" className={styles.searchButton}>Search</button>
            </div>
          </form>
        </div>
      </section>

      {/* Filters Section */}
      <section className={styles.filtersSection}>
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <div className={styles.filterItem}>
              <svg className={styles.filterIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span className={styles.filterLabel}>Open Now</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={openNow}
                  onChange={(e) => setOpenNow(e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>

            <div className={styles.filterItem}>
              <span className={styles.filterLabel}>Within Distance</span>
              <div className={styles.sliderContainer}>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{maxDistance} km</span>
              </div>
            </div>

            <div className={styles.filterItem}>
              <span className={styles.filterLabel}>Sort By</span>
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
              <span className={styles.filterLabel}>Location</span>
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

          <div className={styles.cuisineFilters}>
            <span className={styles.filterLabel}>Cuisine</span>
            <div className={styles.cuisineTags}>
              {cuisines.map((cuisine) => (
                <button
                  key={cuisine}
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

      {/* Results Section */}
      <section className={styles.resultsSection}>
        {selectedCuisine !== "All" && (
          <div className={styles.filterIndicator}>
            Showing results for: <span className={styles.filterChip}>{selectedCuisine}</span>
            <button className={styles.filterClear} onClick={clearCuisineFilter}>×</button>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Loading restaurants...</div>
        ) : restaurants.length === 0 ? (
          <div className={styles.noResults}>No restaurants found. Try adjusting your filters.</div>
        ) : (
          <div className={styles.restaurantsGrid}>
            {restaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                className={styles.restaurantCard}
                onClick={() => handleRestaurantClick(restaurant._id)}
              >
                <div className={styles.restaurantImageContainer}>
                  <img
                    src={restaurant.image || "https://via.placeholder.com/300x200"}
                    alt={restaurant.name}
                    className={styles.restaurantImage}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300x200";
                    }}
                  />
                  <span
                    className={`${styles.restaurantStatus} ${
                      restaurant.isOpen ? styles.statusOpen : styles.statusClosed
                    }`}
                  >
                    {restaurant.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
                <div className={styles.restaurantInfo}>
                  <h3 className={styles.restaurantName}>{restaurant.name}</h3>
                  {restaurant.rating && (
                    <p className={styles.restaurantRating}>⭐ {restaurant.rating.toFixed(1)}</p>
                  )}
                  {restaurant.location && (
                    <p className={styles.restaurantLocation}>{restaurant.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
