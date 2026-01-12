import { useEffect, useState } from "react";
import styles from "./Inventory.module.css";
import { fetchInventory, updateInventoryQuantity } from "../api/inventoryApi";

export function Inventory() {
  console.log("Inventory component mounted");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("useEffect triggered, calling loadInventory");
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await fetchInventory();
      console.log("Fetched inventory data:", data);
      setInventory(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateInventory = async (itemId, action) => {
    try {
      const change = action === "increase" ? 1 : -1;
      await updateInventoryQuantity(itemId, change);
      // Refresh inventory data after update
      loadInventory();
    } catch (error) {
      console.error("Error updating inventory:", error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading inventory...</div>;
  }

  return (
    <div className={styles.inventoryContainer}>
      <h1 className={styles.title}>Inventory</h1>

      {inventory.length === 0 ? (
        <p className={styles.noItems}>No inventory items found.</p>
      ) : (
        <table className={styles.inventoryTable}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Min Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item._id}>
                <td className={styles.itemName}>{item.name}</td>
                <td className={styles.quantity}>{item.quantity}</td>
                <td className={styles.unit}>{item.unit}</td>
                <td className={styles.minStock}>{item.minStock}</td>
                <td className={styles.status}>
                  <span className={item.quantity <= item.minStock ? styles.lowStock : styles.inStock}>
                    {item.quantity <= item.minStock ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td className={styles.actions}>
                  <button
                    onClick={() => updateInventory(item._id, "increase")}
                    className={styles.increaseBtn}
                  >
                    +
                  </button>
                  <button
                    onClick={() => updateInventory(item._id, "decrease")}
                    className={styles.decreaseBtn}
                    disabled={item.quantity <= 0}
                  >
                    -
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
