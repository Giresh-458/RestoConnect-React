import { useState } from "react";
import { Requests } from "./Requests";
import { Restaurant } from "./Restaurant";
import styles from "./RestaurantSubPage.module.css";

export function RestaurantSubPage() {
  const [restSubPage, setRestSubPage] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className={styles.restaurantManagement}>
      <h1 className={styles.pageTitle}>Restaurant Management</h1>
      <p className={styles.pageSubtitle}>
        Overview and administration of all active and pending restaurant
        listings.
      </p>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search restaurants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tabNavigation}>
        <button
          onClick={() => setRestSubPage("active")}
          className={`${styles.tabButton} ${
            restSubPage === "active" ? styles.active : ""
          }`}
        >
          Active Restaurants
        </button>
        <button
          onClick={() => setRestSubPage("pending")}
          className={`${styles.tabButton} ${
            restSubPage === "pending" ? styles.active : ""
          }`}
        >
          Pending Restaurants
        </button>
      </div>

      <div className={styles.tabContent}>
        {restSubPage === "active" && <Restaurant searchTerm={searchTerm} />}
        {restSubPage === "pending" && <Requests searchTerm={searchTerm} />}
      </div>
    </div>
  );
}
