import React, { useState, useEffect } from "react";
import { useToast } from "../components/common/Toast";
import {
  fetchLeftovers,
  addLeftover,
  updateLeftover,
  deleteLeftover,
  deleteExpiredLeftovers,
} from "../api/staffApi";
import "./StaffLeftoversPage.css";

function StaffLeftoversPage() {
  const [leftovers, setLeftovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    itemName: "",
    quantity: "",
    expiryDate: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const { showToast } = useToast();

  // Load on mount
  useEffect(() => {
    loadLeftovers();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadLeftovers();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadLeftovers() {
    try {
      setLoading(true);
      const data = await fetchLeftovers();
      setLeftovers(data || []);
    } catch (error) {
      console.error("Error loading leftovers:", error);
      showToast(`Failed to load leftovers: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const errors = {};

    if (!formData.itemName || formData.itemName.trim() === "") {
      errors.itemName = "Item name is required";
    }

    if (
      !formData.quantity ||
      isNaN(formData.quantity) ||
      Number(formData.quantity) <= 0
    ) {
      errors.quantity = "Quantity must be a positive number";
    }

    if (!formData.expiryDate) {
      errors.expiryDate = "Expiry date is required";
    } else {
      const selectedDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.expiryDate = "Expiry date cannot be in the past";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleAddLeftover(e) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const data = {
        itemName: formData.itemName.trim(),
        quantity: Number(formData.quantity),
        expiryDate: new Date(formData.expiryDate).toISOString(),
      };

      const newItem = await addLeftover(data);
      
      // Directly update state with the new item returned from server
      setLeftovers((prev) => [...prev, newItem]);
      showToast("Leftover item added successfully", "success");
      resetForm();
    } catch (error) {
      console.error("Error adding leftover:", error);
      showToast(error.message || "Failed to add leftover item", "error");
    }
  }

  async function handleUpdateLeftover(e) {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const data = {};
      if (formData.itemName) data.itemName = formData.itemName.trim();
      if (formData.quantity) data.quantity = Number(formData.quantity);
      if (formData.expiryDate)
        data.expiryDate = new Date(formData.expiryDate).toISOString();

      const updatedItem = await updateLeftover(editingId, data);

      // Directly swap the updated item in state
      setLeftovers((prev) =>
        prev.map((item) =>
          item._id === editingId ? updatedItem : item
        )
      );
      showToast("Leftover item updated successfully", "success");
      resetForm();
    } catch (error) {
      console.error("Error updating leftover:", error);
      showToast(error.message || "Failed to update leftover item", "error");
    }
  }

  async function handleDeleteLeftover(id) {
    if (!window.confirm("Are you sure you want to delete this leftover item?"))
      return;

    try {
      await deleteLeftover(id);
      // Directly remove from state
      setLeftovers((prev) => prev.filter((item) => item._id !== id));
      showToast("Leftover item deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting leftover:", error);
      showToast(error.message || "Failed to delete leftover item", "error");
    }
  }

  async function handleDeleteExpired() {
    if (leftovers.length === 0) {
      showToast("No leftovers to clean up", "info");
      return;
    }

    const expiredCount = leftovers.filter(
      (item) => new Date(item.expiryDate) < new Date()
    ).length;

    if (expiredCount === 0) {
      showToast("No expired items found", "info");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${expiredCount} expired leftover item(s)?`
      )
    )
      return;

    try {
      const result = await deleteExpiredLeftovers();
      // Directly remove expired items from state
      setLeftovers((prev) =>
        prev.filter((item) => new Date(item.expiryDate) >= new Date())
      );
      showToast(result.message || "Expired items deleted", "success");
    } catch (error) {
      console.error("Error deleting expired leftovers:", error);
      showToast(error.message || "Failed to delete expired items", "error");
    }
  }

  function handleEditClick(item) {
    setEditingId(item._id);
    setFormData({
      itemName: item.itemName,
      quantity: item.quantity.toString(),
      expiryDate: new Date(item.expiryDate).toISOString().split("T")[0],
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setFormData({ itemName: "", quantity: "", expiryDate: "" });
    setFormErrors({});
    setEditingId(null);
    setShowAddForm(false);
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getExpiryStatus(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return { status: "expired", label: "Expired", color: "#ef4444" };
    if (diffDays === 0)
      return { status: "today", label: "Expires Today", color: "#f59e0b" };
    if (diffDays <= 3)
      return {
        status: "soon",
        label: `${diffDays} day${diffDays > 1 ? "s" : ""}`,
        color: "#f97316",
      };
    return {
      status: "good",
      label: `${diffDays} days left`,
      color: "#10b981",
    };
  }

  const expiredCount = leftovers.filter(
    (item) => new Date(item.expiryDate) < new Date()
  ).length;

  return (
    <div className="sl-page">
      <div className="sl-header">
        <div>
          <h1 className="sl-title">Leftover Food Management</h1>
          <p className="sl-subtitle">Track and manage leftover food items</p>
        </div>
        <div className="sl-actions">
          <button
            className="sl-btn sl-btn-secondary sl-btn-sm"
            onClick={loadLeftovers}
            disabled={loading}
          >
            {loading ? "⏳" : "🔄"} Refresh
          </button>
          {expiredCount > 0 && (
            <button
              className="sl-btn sl-btn-danger"
              onClick={handleDeleteExpired}
            >
              🗑️ Clean Expired ({expiredCount})
            </button>
          )}
          <button
            className="sl-btn sl-btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "✕ Cancel" : "+ Add Leftover"}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="sl-form-card">
          <h2 className="sl-form-title">
            {editingId ? "Edit Leftover Item" : "Add New Leftover Item"}
          </h2>
          <form onSubmit={editingId ? handleUpdateLeftover : handleAddLeftover}>
            <div className="sl-form-grid">
              <div className="sl-form-group">
                <label className="sl-label">Item Name *</label>
                <input
                  type="text"
                  className={`sl-input ${formErrors.itemName ? "sl-input-error" : ""}`}
                  placeholder="e.g., Chicken Biryani"
                  value={formData.itemName}
                  onChange={(e) =>
                    setFormData({ ...formData, itemName: e.target.value })
                  }
                />
                {formErrors.itemName && (
                  <span className="sl-error">{formErrors.itemName}</span>
                )}
              </div>

              <div className="sl-form-group">
                <label className="sl-label">Quantity *</label>
                <input
                  type="number"
                  className={`sl-input ${formErrors.quantity ? "sl-input-error" : ""}`}
                  placeholder="e.g., 5"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                />
                {formErrors.quantity && (
                  <span className="sl-error">{formErrors.quantity}</span>
                )}
              </div>

              <div className="sl-form-group">
                <label className="sl-label">Expiry Date *</label>
                <input
                  type="date"
                  className={`sl-input ${formErrors.expiryDate ? "sl-input-error" : ""}`}
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
                {formErrors.expiryDate && (
                  <span className="sl-error">{formErrors.expiryDate}</span>
                )}
              </div>
            </div>

            <div className="sl-form-actions">
              <button type="submit" className="sl-btn sl-btn-primary">
                {editingId ? "Update Item" : "Add Item"}
              </button>
              <button
                type="button"
                className="sl-btn sl-btn-secondary"
                onClick={resetForm}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leftovers List */}
      <div className="sl-content">
        {loading ? (
          <div className="sl-loading">Loading leftovers...</div>
        ) : leftovers.length === 0 ? (
          <div className="sl-empty">
            <div className="sl-empty-icon">🍽️</div>
            <h3>No Leftover Items</h3>
            <p>Add your first leftover food item to track it</p>
            <button
              className="sl-btn sl-btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              + Add Leftover
            </button>
          </div>
        ) : (
          <>
            <div className="sl-stats">
              <div className="sl-stat-item">
                <span className="sl-stat-value">{leftovers.length}</span>
                <span className="sl-stat-label">Total Items</span>
              </div>
              <div className="sl-stat-item">
                <span
                  className="sl-stat-value"
                  style={{ color: "#ef4444" }}
                >
                  {expiredCount}
                </span>
                <span className="sl-stat-label">Expired</span>
              </div>
              <div className="sl-stat-item">
                <span
                  className="sl-stat-value"
                  style={{ color: "#10b981" }}
                >
                  {leftovers.length - expiredCount}
                </span>
                <span className="sl-stat-label">Active</span>
              </div>
            </div>

            <div className="sl-grid">
              {leftovers.map((item) => {
                const expiryStatus = getExpiryStatus(item.expiryDate);
                return (
                  <div
                    key={item._id}
                    className={`sl-card sl-card-${expiryStatus.status}`}
                  >
                    <div className="sl-card-header">
                      <h3 className="sl-card-title">{item.itemName}</h3>
                      <span
                        className="sl-card-badge"
                        style={{ backgroundColor: expiryStatus.color }}
                      >
                        {expiryStatus.label}
                      </span>
                    </div>

                    <div className="sl-card-body">
                      <div className="sl-card-row">
                        <span className="sl-card-label">Quantity:</span>
                        <span className="sl-card-value">{item.quantity}</span>
                      </div>
                      <div className="sl-card-row">
                        <span className="sl-card-label">Added On:</span>
                        <span className="sl-card-value">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <div className="sl-card-row">
                        <span className="sl-card-label">Expires On:</span>
                        <span
                          className="sl-card-value"
                          style={{
                            color: expiryStatus.color,
                            fontWeight: "600",
                          }}
                        >
                          {formatDate(item.expiryDate)}
                        </span>
                      </div>
                    </div>

                    <div className="sl-card-actions">
                      <button
                        className="sl-btn sl-btn-sm sl-btn-edit"
                        onClick={() => handleEditClick(item)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="sl-btn sl-btn-sm sl-btn-delete"
                        onClick={() => handleDeleteLeftover(item._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default StaffLeftoversPage;