import { useEffect, useState } from "react";
import { useNavigate, redirect } from "react-router-dom";
import { isLogin } from "../util/auth";
import { 
  fetchInventory, 
  updateInventoryQuantity, 
  createInventoryItem, 
  deleteInventoryItem 
} from "../api/inventoryApi";
import styles from "./InventoryManagement.module.css";

export function InventoryManagement() {
  console.log("InventoryManagement component mounted");
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('inventory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse saved inventory, using empty array', e);
      return [];
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    unit: 'kg',
    quantity: 0,
    minStock: 0
  });
  
  const navigate = useNavigate();
  const lowStockCount = Array.isArray(inventory) ? inventory.filter(i => (i?.quantity ?? 0) <= (i?.minStock ?? 0)).length : 0;

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      console.log("Fetching inventory data...");
      const inventoryData = await fetchInventory();
      console.log("Inventory data fetched:", inventoryData);
      setInventory(inventoryData);
      try {
        localStorage.setItem('inventory', JSON.stringify(inventoryData));
      } catch (e) {
        console.error('Failed to save inventory to localStorage', e);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      alert('Failed to load inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryUpdate = async (itemId, change) => {
    try {
      const result = await updateInventoryQuantity(itemId, change);
      setInventory(prevInventory => {
        if (!prevInventory || !Array.isArray(prevInventory)) {
          return [result.inventory];
        }
        return prevInventory.map(item =>
          item._id === itemId ? result.inventory : item
        );
      });
    } catch (error) {
      console.error("Error updating inventory:", error);
      alert(error.message || "Failed to update inventory. Please try again.");
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: (newItem.name || '').trim(),
        unit: newItem.unit,
        quantity: Number.isFinite(newItem.quantity) && newItem.quantity >= 0 ? newItem.quantity : 0,
        minStock: Number.isFinite(newItem.minStock) && newItem.minStock >= 0 ? newItem.minStock : 0
      };
      
      if (!payload.name) {
        alert('Please enter a valid item name');
        return;
      }
      
      const result = await createInventoryItem(payload);
      
      setInventory(prevInventory => {
        const newInventory = Array.isArray(prevInventory) 
          ? [...prevInventory, result.inventory]
          : [result.inventory];
        
        try {
          localStorage.setItem('inventory', JSON.stringify(newInventory));
        } catch (e) {
          console.error('Failed to update inventory in localStorage', e);
        }
        
        return newInventory;
      });
      
      setNewItem({ name: '', unit: 'kg', quantity: 0, minStock: 0 });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding inventory item:", error);
      alert(error.message || "Failed to add inventory item. Please try again.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this inventory item?")) {
      return;
    }

    try {
      await deleteInventoryItem(itemId);
      
      setInventory(prevInventory => {
        const newInventory = Array.isArray(prevInventory) 
          ? prevInventory.filter(item => item?._id !== itemId)
          : [];
        
        try {
          localStorage.setItem('inventory', JSON.stringify(newInventory));
        } catch (e) {
          console.error('Failed to update inventory in localStorage', e);
        }
        
        return newInventory;
      });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      alert(error.message || "Failed to delete inventory item. Please try again.");
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading inventory...</div>;
  }

  return (
    <div className={styles.inventoryPage}>
      <div className={styles.inventoryHeader}>
        <h1>Inventory Management</h1>
        <div className={styles.headerActions}>
          <div className={styles.stockSummary}>
            {lowStockCount > 0 ? (
              <span className={styles.lowStockBadge}>
                {lowStockCount} item{lowStockCount > 1 ? 's' : ''} low on stock
              </span>
            ) : (
              <span className={styles.inStockBadge}>All items in stock</span>
            )}
          </div>
          <button 
            className={styles.addButton}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add New Item'}
          </button>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className={styles.addItemSection}>
          <h2>Add New Inventory Item</h2>
          <form className={styles.addItemForm} onSubmit={handleAddItem}>
            <div className={styles.formGroup}>
              <label htmlFor="itemName">Item Name</label>
              <input
                id="itemName"
                type="text"
                placeholder="Enter item name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                required
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="unit">Unit</label>
                <select
                  id="unit"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className={styles.formSelect}
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                  <option value="pieces">pieces</option>
                  <option value="boxes">boxes</option>
                  <option value="packets">packets</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="quantity">Initial Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                  min="0"
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="minStock">Minimum Stock Level</label>
                <input
                  id="minStock"
                  type="number"
                  placeholder="0"
                  value={newItem.minStock}
                  onChange={(e) => setNewItem({ ...newItem, minStock: parseInt(e.target.value) || 0 })}
                  min="0"
                  className={styles.formInput}
                />
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                Add Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory List */}
      <div className={styles.inventoryList}>
        {inventory.length > 0 ? (
          <table className={styles.inventoryTable}>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Current Quantity</th>
                <th>Min Stock Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...inventory]
                .sort((a, b) => {
                  const aLow = (a.quantity ?? 0) <= (a.minStock ?? 0);
                  const bLow = (b.quantity ?? 0) <= (b.minStock ?? 0);
                  if (aLow !== bLow) return aLow ? -1 : 1;
                  return (a.name || '').localeCompare(b.name || '');
                })
                .map((item) => (
                  <tr 
                    key={item._id} 
                    className={`${styles.inventoryItem} ${
                      (item.quantity ?? 0) <= (item.minStock ?? 0) ? styles.lowStockItem : ''
                    }`}
                  >
                    <td>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemUnit}>({item.unit})</span>
                    </td>
                    <td className={styles.quantityCell}>
                      <div className={styles.quantityControls}>
                        <button
                          className={styles.quantityButton}
                          onClick={() => handleInventoryUpdate(item._id, -1)}
                          disabled={(item.quantity ?? 0) <= 0}
                          title="Decrease by 1"
                        >
                          -
                        </button>
                        <span className={styles.quantityValue}>{item.quantity} {item.unit}</span>
                        <button
                          className={styles.quantityButton}
                          onClick={() => handleInventoryUpdate(item._id, 1)}
                          title="Increase by 1"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{item.minStock} {item.unit}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${
                        (item.quantity ?? 0) <= (item.minStock ?? 0) 
                          ? styles.lowStockBadge 
                          : styles.inStockBadge
                      }`}>
                        {(item.quantity ?? 0) <= (item.minStock ?? 0) ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteItem(item._id)}
                        title="Delete item"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <p>No inventory items found.</p>
            <button 
              className={styles.addButton}
              onClick={() => setShowAddForm(true)}
            >
              + Add Your First Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Loader function to check authentication before loading the component
export async function loader() {
  const role = await isLogin();
  if (role !== 'owner') {
    return redirect('/login');
  }
  return null;
}

export default InventoryManagement;
