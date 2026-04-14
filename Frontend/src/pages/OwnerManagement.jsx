import { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import * as api from "../api/ownerApi";
import { useToast } from "../components/common/Toast";
import { useConfirm } from "../components/common/ConfirmDialog";
import { toBackendAssetUrl } from "../config/api";
import styles from "./OwnerManagement.module.css";

const CATEGORIES = ["Starters", "Main Course", "Desserts", "Beverages", "Sides", "Specials"];

export function OwnerManagement() {
  const toast = useToast();
  const confirm = useConfirm();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", description: "", serves: 1, category: "Main Course" });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [restInfo, setRestInfo] = useState({ name: "", cuisine: [], isOpen: true, operatingHours: {} });
  const [time] = useState(new Date());

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [data, settings] = await Promise.all([api.fetchMenu(), api.fetchSettings()]);
      setMenuItems(data.products || []);
      if (settings) setRestInfo({ name: settings.name || "", cuisine: settings.cuisine || [], isOpen: settings.isOpen !== undefined ? settings.isOpen : true, operatingHours: settings.operatingHours || {} });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.warn("Max file size is 5MB"); return; }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setForm({ name: "", price: "", description: "", serves: 1, category: "Main Course" });
    setSelectedImage(null);
    setImagePreview(null);
    setEditingItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("price", form.price);
    formData.append("description", form.description);
    formData.append("serves", form.serves);
    formData.append("category", form.category);
    if (selectedImage) formData.append("image", selectedImage);

    try {
      if (editingItem) {
        await api.editDish(editingItem._id, formData);
      } else {
        await api.addDish(formData);
      }
      resetForm();
      await load();
    } catch (e) {
      toast.error(e.message || "Failed to save dish");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      price: item.price,
      description: item.description || "",
      serves: item.serves || 1,
      category: item.category || "Main Course",
    });
    setImagePreview(item.imageUrl || null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ title: "Delete Dish", message: "Are you sure you want to delete this dish? This cannot be undone.", variant: "danger", confirmText: "Delete" });
    if (!ok) return;
    try {
      await api.deleteDish(id);
      toast.success("Dish deleted successfully");
      await load();
    } catch (e) { toast.error("Failed to delete dish"); }
  };

  const getImageUrl = (item) => {
    if (item.imageUrl) return item.imageUrl;
    if (item.image) {
      if (item.image.startsWith("http")) return item.image;
      return toBackendAssetUrl(item.image, "uploads");
    }
    return "/images/image-not-found.jpg";
  };

  const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

  const filtered = menuItems.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory === "all" || item.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // Group by category
  const grouped = {};
  filtered.forEach((item) => {
    const cat = item.category || "Main Course";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  if (loading) {
    return <div className={styles.loader}><div className={styles.spinner} /><p>Loading menu...</p></div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>🍴 Menu Management</h1>
          {restInfo.name && <p className={styles.heroRestName}>{restInfo.name}</p>}
          <p className={styles.heroDate}>
            {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            <span className={styles.heroTime}>{time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </div>
        <div className={styles.heroRight}>
          <div className={`${styles.statusPill} ${restInfo.isOpen ? styles.statusOpen : styles.statusClosed}`}>
            <span className={styles.statusDot} />
            <span>{restInfo.isOpen ? "OPEN" : "CLOSED"}</span>
            <span className={styles.statusHours}>{restInfo.operatingHours?.open || "09:00"} - {restInfo.operatingHours?.close || "22:00"}</span>
          </div>
          <button className={styles.addBtnHero} onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? "✕ Close" : "+ Add Dish"}
          </button>
        </div>
      </header>

      {/* Add/Edit Form */}
      {showForm && (
        <form className={styles.dishForm} onSubmit={handleSubmit}>
          <h3>{editingItem ? "Edit Dish" : "Add New Dish"}</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className={styles.formGroup}>
              <label>Price (₹) *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Serves</label>
              <input type="number" min="1" max="20" value={form.serves} onChange={(e) => setForm({ ...form, serves: e.target.value })} />
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the dish..." />
            </div>
            <div className={styles.formGroup}>
              <label>Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div className={styles.imgPreview}>
                  <img src={imagePreview} alt="Preview" />
                  <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(null); }}>✕</button>
                </div>
              )}
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitBtn}>{editingItem ? "Save Changes" : "Add Dish"}</button>
            <button type="button" className={styles.cancelBtn} onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      {/* Search & Filter */}
      <div className={styles.toolBar}>
        <input
          type="text"
          placeholder="Search dishes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.categoryFilter}>
          <button className={filterCategory === "all" ? styles.active : ""} onClick={() => setFilterCategory("all")}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c} className={filterCategory === c ? styles.active : ""} onClick={() => setFilterCategory(c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      {Object.keys(grouped).length === 0 && <p className={styles.empty}>No dishes found. Add your first dish above!</p>}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className={styles.categorySection}>
          <h2 className={styles.categoryTitle}>{category} <span>({items.length})</span></h2>
          <div className={styles.menuGrid}>
            {items.map((item) => (
              <div key={item._id} className={styles.menuCard}>
                <div className={styles.cardImg}>
                  <img
                    src={getImageUrl(item)}
                    alt={item.name}
                    onError={(e) => { e.target.src = "/images/image-not-found.jpg"; }}
                  />
                  {item.isAvailable === false && <div className={styles.unavailBanner}>Unavailable</div>}
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.dishName}>{item.name}</h3>
                  <div className={styles.dishMeta}>
                    <span className={styles.dishPrice}>{fmt(item.price)}</span>
                    {item.serves > 1 && <span className={styles.dishServes}>Serves {item.serves}</span>}
                  </div>
                  {item.description && <p className={styles.dishDesc}>{item.description}</p>}
                  <div className={styles.cardActions}>
                    <button className={styles.editBtn} onClick={() => handleEdit(item)}>✏️ Edit</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(item._id)}>🗑️ Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export async function loader() {
  const role = await isLogin();
  if (role !== "owner") return redirect("/login");
  return null;
}
