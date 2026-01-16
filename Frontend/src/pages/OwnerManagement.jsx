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
    description: '',
    serves: 1
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addDish = async (e) => {
    e.preventDefault();

    const name = newDish.name.trim();
    const priceStr = newDish.price.trim();
    const description = newDish.description.trim();
    const serves = newDish.serves ? parseInt(newDish.serves) : 1;

    // Basic frontend validation
    const nameRegex = /^[A-Za-z][A-Za-z0-9\s]{1,79}$/;
    if (!name || !nameRegex.test(name)) {
      alert("Please enter a valid dish name (must start with a letter and can contain only letters, numbers, and spaces).");
      return;
    }

    if (!priceStr || isNaN(priceStr)) {
      alert("Please enter a valid price.");
      return;
    }

    const price = parseFloat(priceStr);
    if (price <= 0) {
      alert("Price must be a positive number.");
      return;
    }

    if (description.length > 0 && description.length > 300) {
      alert("Description is too long (maximum 300 characters).");
      return;
    }

    if (serves < 1 || serves > 20) {
      alert("Serves must be between 1 and 20 people.");
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', name);
      formData.append('price', price);
      formData.append('description', description);
      formData.append('serves', serves);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch("http://localhost:3000/owner/menuManagement/add", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add dish");
      }

      // Clear form
      setNewDish({ name: '', price: '', description: '', serves: 1 });
      setSelectedImage(null);
      setImagePreview(null);
      // Reset file input
      const fileInput = document.getElementById('dishImage');
      if (fileInput) fileInput.value = '';

      // Refresh menu items
      await fetchMenuItems();
    } catch (error) {
      console.error("Error adding dish:", error);
      alert(error.message || "Failed to add dish. Please try again.");
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

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="serves">Serves (No. of People) *</label>
            <input
              type="number"
              id="serves"
              name="serves"
              value={newDish.serves}
              onChange={handleInputChange}
              className={styles.formInput}
              min="1"
              max="20"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="dishImage">Dish Image</label>
            <input
              type="file"
              id="dishImage"
              name="image"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageChange}
              className={styles.formInput}
            />
            {imagePreview && (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    const fileInput = document.getElementById('dishImage');
                    if (fileInput) fileInput.value = '';
                  }}
                  className={styles.removeImageButton}
                >
                  Remove Image
                </button>
              </div>
            )}
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
            {menuItems.map((item) => {
              // Use imageUrl if provided by backend, otherwise construct from image field
              let imageUrl = item.imageUrl;
              if (!imageUrl && item.image) {
                if (item.image.startsWith('http')) {
                  imageUrl = item.image;
                } else if (item.image.startsWith('/images/')) {
                  imageUrl = `http://localhost:3000${item.image}`;
                } else {
                  imageUrl = `http://localhost:3000/uploads/${item.image}`;
                }
              }
              if (!imageUrl) {
                imageUrl = 'http://localhost:3000/images/default-dish.jpg';
              }
              
              return (
                <div key={item._id} className={styles.menuItem}>
                  <div className={styles.itemContent}>
                    <div className={styles.itemImageContainer}>
                      <img 
                        src={imageUrl} 
                        alt={item.name}
                        className={styles.itemImage}
                        onError={(e) => {
                          e.target.src = 'http://localhost:3000/images/default-dish.jpg';
                        }}
                      />
                    </div>
                    <div className={styles.itemDetails}>
                      <div className={styles.itemHeader}>
                        <div>
                          <h3 className={styles.itemName}>{item.name}</h3>
                          <p className={styles.itemPrice}>{formatCurrency(item.price)}</p>
                          {item.serves && (
                            <p className={styles.itemServes}>Serves {item.serves} {item.serves === 1 ? 'person' : 'people'}</p>
                          )}
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
                  </div>
                </div>
              );
            })}
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
 
