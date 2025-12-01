import React, { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import styles from "./OwnerManagement.module.css";

export function OwnerManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newDish, setNewDish] = useState({
    name: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:3000/owner/menuManagement", {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }

      const data = await response.json();
      setMenuItems(data.products || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      setError("Failed to load menu items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDish(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addDish = async (e) => {
    e.preventDefault();

    if (!newDish.name.trim() || !newDish.price.trim()) {
      alert("Please fill in at least name and price");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/owner/menuManagement/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          name: newDish.name.trim(),
          price: parseFloat(newDish.price),
          description: newDish.description.trim()
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add dish");
      }

      // Clear form
      setNewDish({ name: '', price: '', description: '' });

      // Refresh menu items
      await fetchMenuItems();
    } catch (error) {
      console.error("Error adding dish:", error);
      alert("Failed to add dish. Please try again.");
    }
  };

  const deleteDish = async (dishId) => {
    if (!confirm("Are you sure you want to delete this dish?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/owner/menuManagement/delete/${dishId}`, {
        method: "POST",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to delete dish");
      }

      // Refresh menu items
      await fetchMenuItems();
    } catch (error) {
      console.error("Error deleting dish:", error);
      alert("Failed to delete dish. Please try again.");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className={styles.loading}>Loading menu items...</div>;
  }

  return (
    <div className={styles.ownerManagement}>
      <h1 className={styles.pageTitle}>Menu Management</h1>

      {error && <div className={styles.error}>{error}</div>}

      {/* Add New Dish Form */}
      <div className={styles.addDishForm}>
        <h2 className={styles.formTitle}>Add New Dish</h2>
        <form onSubmit={addDish}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="name">Dish Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newDish.name}
              onChange={handleInputChange}
              className={styles.formInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="price">Price (INR) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={newDish.price}
              onChange={handleInputChange}
              className={styles.formInput}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={newDish.description}
              onChange={handleInputChange}
              className={styles.formTextarea}
              placeholder="Optional description of the dish"
            />
          </div>

          <button type="submit" className={styles.addButton}>
            Add Dish
          </button>
        </form>
      </div>

      {/* Menu Items List */}
      <div className={styles.menuItemsSection}>
        <h2 className={styles.sectionTitle}>Current Menu Items</h2>

        {menuItems.length === 0 ? (
          <p className={styles.noItems}>No menu items found. Add your first dish above!</p>
        ) : (
          <div className={styles.menuItemsList}>
            {menuItems.map((item) => (
              <div key={item._id} className={styles.menuItem}>
                <div className={styles.itemHeader}>
                  <div>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemPrice}>{formatCurrency(item.price)}</p>
                  </div>
                  <button
                    onClick={() => deleteDish(item._id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>

                {item.description && (
                  <p className={styles.itemDescription}>{item.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export async function loader() {
  let role = await isLogin();
  if (role != 'owner') {
    return redirect('/login');
  }
}
 
