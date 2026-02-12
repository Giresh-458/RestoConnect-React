import { useState, useEffect, useCallback, useRef } from "react";
import { useLoaderData, redirect, useNavigate } from "react-router-dom";
import { isLogin } from "../util/auth";
import { getFavourites } from "../util/favourites";
import styles from "./CustomerHomepage.module.css";

const API_BASE = "http://localhost:3000";

/* ── cuisine category icons for the "What's on your mind?" carousel ── */
const CUISINE_ICONS = {
  All: "🍽️",
  Italian: "🍝",
  Chinese: "🥡",
  Indian: "🍛",
  Mexican: "🌮",
  Japanese: "🍣",
  Thai: "🍜",
  American: "🍔",
  Mediterranean: "🥙",
  Korean: "🍖",
  French: "🥐",
  Pizza: "🍕",
  Desserts: "🍰",
  Seafood: "🦐",
  Vegetarian: "🥗",
  BBQ: "🔥",
  Bakery: "🧁",
  Cafe: "☕",
};

const getCuisineIcon = (name) => CUISINE_ICONS[name] || "🍴";

/* ── loader ── */
export async function loader() {
  let role = await isLogin();
  if (role !== "customer") return redirect("/login");

  try {
    const response = await fetch(
      `${API_BASE}/api/customer/restaurants/search`,
      { credentials: "include" }
    );
    const data = await response.json();
    return { restaurants: data.restaurants || [], availableCuisines: data.availableCuisines || [] };
  } catch (error) {
    console.error("Error loading restaurants:", error);
    return { restaurants: [], availableCuisines: [] };
  }
}

/* ────────── MAIN COMPONENT ────────── */
export function CustomerHomepage() {
  const { restaurants: initialRestaurants, availableCuisines: initialCuisines } = useLoaderData();
  const navigate = useNavigate();

  /* ── state ── */
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [searchQuery, setSearchQuery] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [location, setLocation] = useState("All");
  const [locations, setLocations] = useState([]);
  const [cuisines, setCuisines] = useState(["All", ...(initialCuisines || [])]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [cuisineScrollPos, setCuisineScrollPos] = useState(0);
  const cuisineRef = useRef(null);

  /* ── fetch helpers ── */
  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/restaurants`, { credentials: "include" });
      const data = await res.json();
      setLocations(data.cities || ["All"]);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  }, []);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (openNow) params.append("openNow", "true");
      if (sortBy) params.append("sortBy", sortBy);
      if (selectedCuisine && selectedCuisine !== "All") params.append("cuisine", selectedCuisine);
      if (location && location !== "All") params.append("location", location);

      const res = await fetch(
        `${API_BASE}/api/customer/restaurants/search?${params.toString()}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setRestaurants(data.restaurants || []);
      if (data.availableCuisines?.length) {
        setCuisines(["All", ...data.availableCuisines]);
      }
    } catch (err) {
      console.error("Error fetching restaurants:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, openNow, sortBy, selectedCuisine, location]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);
  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  /* debounced search */
  useEffect(() => {
    const h = setTimeout(() => {
      if (searchQuery?.trim().length > 0) fetchRestaurants();
    }, 350);
    return () => clearTimeout(h);
  }, [searchQuery, fetchRestaurants]);

  /* fetch favorites */
  useEffect(() => {
    if (activeTab !== "favorites") return;
    (async () => {
      try {
        setLoadingFavorites(true);
        const data = await getFavourites();
        setFavorites(Array.isArray(data) ? data : []);
      } catch {
        setFavorites([]);
      } finally {
        setLoadingFavorites(false);
      }
    })();
  }, [activeTab]);

  /* ── derived data ── */
  const topRated = [...restaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);
  const openRestaurants = restaurants.filter((r) => r.isOpen);
  const totalOpenCount = openRestaurants.length;

  /* ── handlers ── */
  const handleSearch = (e) => { e.preventDefault(); fetchRestaurants(); };
  const handleCuisineClick = (c) => setSelectedCuisine(c === selectedCuisine ? "All" : c);
  const goToRestaurant = (id) => navigate(`/customer/restaurant/${id}`);

  /* cuisine horizontal scroll */
  const scrollCuisines = (dir) => {
    if (!cuisineRef.current) return;
    const amount = 220;
    cuisineRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  /* ────────────────── JSX ────────────────── */
  return (
    <div className={styles.page}>
      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.heroBadge}>Dine-in Experience</span>
            <h1 className={styles.heroTitle}>
              Discover &amp; Reserve<br />the Best Tables Near You
            </h1>
            <p className={styles.heroSub}>
              Browse top-rated restaurants, explore menus, and book your table — all in one place.
            </p>
            {/* stats row */}
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <strong>{restaurants.length}</strong>
                <span>Restaurants</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <strong>{totalOpenCount}</strong>
                <span>Open Now</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <strong>{cuisines.length - 1}+</strong>
                <span>Cuisines</span>
              </div>
            </div>
          </div>
          {/* search */}
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <div className={styles.searchBar}>
              <svg className={styles.searchSvg} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search restaurants, cuisines, or locations…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value && location !== "All") setLocation("All");
                }}
              />
              <button type="submit" className={styles.searchBtn}>Search</button>
            </div>
            {/* quick filter toggles */}
            <div className={styles.quickToggles}>
              <button type="button" className={`${styles.toggleChip} ${openNow ? styles.toggleActive : ""}`} onClick={() => setOpenNow(!openNow)}>
                <span className={styles.toggleDot} style={{ background: openNow ? "#22c55e" : "#94a3b8" }} /> Open Now
              </button>
              <button type="button" className={`${styles.toggleChip} ${showFilters ? styles.toggleActive : ""}`} onClick={() => setShowFilters(!showFilters)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M2 14h4M10 8h4M18 16h4" /></svg>
                Filters
              </button>
              {selectedCuisine !== "All" && (
                <span className={styles.activeFilterTag}>
                  {getCuisineIcon(selectedCuisine)} {selectedCuisine}
                  <button onClick={() => setSelectedCuisine("All")} className={styles.clearFilterX}>&times;</button>
                </span>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* ── FILTER PANEL (collapsible) ── */}
      {showFilters && (
        <section className={styles.filterPanel}>
          <div className={styles.filterPanelInner}>
            <div className={styles.filterGroup}>
              <label>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="rating">Top Rated</option>
                <option value="name">Name A-Z</option>
                <option value="distance">Nearest First</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label>Location</label>
              <select value={location} onChange={(e) => { setLocation(e.target.value); setSearchQuery(""); }}>
                {locations.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </section>
      )}

      {/* ── TABS ── */}
      <div className={styles.container}>
        <div className={styles.tabBar}>
          <button className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`} onClick={() => setActiveTab("all")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            All Restaurants
          </button>
          <button className={`${styles.tab} ${activeTab === "favorites" ? styles.tabActive : ""}`} onClick={() => setActiveTab("favorites")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={activeTab === "favorites" ? "#ef4444" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            My Favorites
          </button>
        </div>
      </div>

      {/* ── FAVORITES TAB ── */}
      {activeTab === "favorites" && (
        <div className={styles.container}>
          {loadingFavorites ? (
            <div className={styles.loader}><div className={styles.spinner} /><p>Loading favorites…</p></div>
          ) : favorites.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              <h3>No favorites yet</h3>
              <p>Heart the dishes you love and find them here.</p>
            </div>
          ) : (
            <div className={styles.favGrid}>
              {favorites.map((dish) => (
                <div key={dish._id || dish.id} className={styles.favCard}>
                  <div className={styles.favImgWrap}>
                    <img src={dish.image || "/placeholder-dish.jpg"} alt={dish.name} />
                    {dish.price != null && <span className={styles.favPrice}>₹{Number(dish.price).toFixed(0)}</span>}
                  </div>
                  <div className={styles.favBody}>
                    <h4>{dish.name}</h4>
                    {dish.restaurantName && <p className={styles.favRestaurant}>{dish.restaurantName}</p>}
                    {dish.description && <p className={styles.favDesc}>{dish.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ALL RESTAURANTS TAB ── */}
      {activeTab === "all" && (
        <>
          {/* Cuisine carousel: "What's on your mind?" */}
          {cuisines.length > 1 && (
            <section className={styles.cuisineSection}>
              <div className={styles.container}>
                <div className={styles.sectionHead}>
                  <h2>What's on your mind?</h2>
                  <div className={styles.scrollBtns}>
                    <button onClick={() => scrollCuisines("left")} aria-label="scroll left">‹</button>
                    <button onClick={() => scrollCuisines("right")} aria-label="scroll right">›</button>
                  </div>
                </div>
                <div className={styles.cuisineTrack} ref={cuisineRef}>
                  {cuisines.filter((c) => c !== "All").map((c) => (
                    <button
                      key={c}
                      className={`${styles.cuisineItem} ${selectedCuisine === c ? styles.cuisineItemActive : ""}`}
                      onClick={() => handleCuisineClick(c)}
                    >
                      <span className={styles.cuisineEmoji}>{getCuisineIcon(c)}</span>
                      <span className={styles.cuisineName}>{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Top Rated */}
          {topRated.length > 0 && (
            <section className={styles.sectionBlock}>
              <div className={styles.container}>
                <div className={styles.sectionHead}>
                  <h2>Top Rated Near You</h2>
                  <span className={styles.sectionBadge}>{topRated.length} places</span>
                </div>
                <div className={styles.horizScroll}>
                  {topRated.map((r) => (
                    <TopRatedCard key={r._id} restaurant={r} onClick={() => goToRestaurant(r._id)} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* All restaurants grid */}
          <section className={styles.sectionBlock}>
            <div className={styles.container}>
              <div className={styles.sectionHead}>
                <h2>
                  {selectedCuisine !== "All" ? `${selectedCuisine} Restaurants` : "All Restaurants"}
                </h2>
                <span className={styles.countLabel}>{restaurants.length} found</span>
              </div>

              {loading ? (
                <div className={styles.loader}><div className={styles.spinner} /><p>Finding restaurants…</p></div>
              ) : restaurants.length === 0 ? (
                <div className={styles.emptyState}>
                  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                  <h3>No restaurants found</h3>
                  <p>Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className={styles.grid}>
                  {restaurants.map((r) => (
                    <RestaurantCard key={r._id} restaurant={r} onClick={() => goToRestaurant(r._id)} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <h4 className={styles.footerBrand}>🍽️ RestoConnect</h4>
              <p>Your go-to platform for discovering restaurants and reserving the perfect table for every occasion.</p>
            </div>
            <div>
              <h5>Quick Links</h5>
              <ul>
                <li><button onClick={() => navigate("/customer/")}>Home</button></li>
                <li><button onClick={() => navigate("/customer/dashboard")}>My Dashboard</button></li>
                <li><button onClick={() => navigate("/customer/support")}>Support</button></li>
              </ul>
            </div>
            <div>
              <h5>Explore</h5>
              <ul>
                <li><button onClick={() => { setSelectedCuisine("All"); setActiveTab("all"); }}>All Cuisines</button></li>
                <li><button onClick={() => { setOpenNow(true); setActiveTab("all"); }}>Open Now</button></li>
                <li><button onClick={() => { setSortBy("rating"); setActiveTab("all"); }}>Top Rated</button></li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>&copy; {new Date().getFullYear()} RestoConnect. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════ TOP-RATED HORIZONTAL CARD ═══════════════ */
function TopRatedCard({ restaurant, onClick }) {
  return (
    <div className={styles.topCard} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <div className={styles.topCardImg}>
        <img src={restaurant.image || "/images/default-restaurant.jpg"} alt={restaurant.name} onError={(e) => { e.target.src = "https://via.placeholder.com/400x250?text=Restaurant"; }} />
        <div className={styles.topCardOverlay}>
          {restaurant.rating != null && (
            <span className={styles.ratingPill}>⭐ {restaurant.rating.toFixed(1)}</span>
          )}
        </div>
      </div>
      <div className={styles.topCardBody}>
        <h4>{restaurant.name}</h4>
        {restaurant.cuisine?.length > 0 && <p className={styles.topCardCuisine}>{restaurant.cuisine.slice(0, 2).join(", ")}</p>}
        {restaurant.location && <p className={styles.topCardLoc}>📍 {restaurant.location}</p>}
      </div>
    </div>
  );
}

/* ═══════════════ RESTAURANT GRID CARD ═══════════════ */
function RestaurantCard({ restaurant, onClick }) {
  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick()}>
      {/* image */}
      <div className={styles.cardImg}>
        <img
          src={restaurant.image || "/images/default-restaurant.jpg"}
          alt={restaurant.name}
          onError={(e) => { e.target.src = "https://via.placeholder.com/400x250?text=Restaurant"; }}
        />
        {/* badges */}
        <div className={styles.cardBadges}>
          <span className={restaurant.isOpen ? styles.badgeOpen : styles.badgeClosed}>
            {restaurant.isOpen ? "Open" : "Closed"}
          </span>
          {restaurant.distance != null && restaurant.distance > 0 && (
            <span className={styles.badgeDist}>{restaurant.distance.toFixed(1)} km</span>
          )}
        </div>
        {restaurant.rating != null && (
          <span className={styles.cardRating}>
            ⭐ {restaurant.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* body */}
      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{restaurant.name}</h3>
        {restaurant.cuisine?.length > 0 && (
          <p className={styles.cardCuisine}>{restaurant.cuisine.join(", ")}</p>
        )}
        {restaurant.location && (
          <p className={styles.cardLocation}>📍 {restaurant.location}</p>
        )}
        <div className={styles.cardFooter}>
          {restaurant.operatingHours && (
            <span className={styles.cardHours}>🕐 {restaurant.operatingHours.open} – {restaurant.operatingHours.close}</span>
          )}
          <button className={styles.menuBtn} onClick={(e) => { e.stopPropagation(); onClick(); }}>View Menu →</button>
        </div>
      </div>
    </div>
  );
}
