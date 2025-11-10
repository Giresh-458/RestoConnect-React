import { useEffect, useState } from "react";
import styles from "./Inventory.module.css";

export function Inventory() {
  const [inventory, setInventory] = useState({
    labels: [],
    values: [],
    units: [],
    suppliers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch("http://localhost:3000/owner/inventory", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateInventory = async (item, action) => {
    try {
      const response = await fetch(
        "http://localhost:3000/owner/inventory/update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ item, action }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory);
      }
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

      {inventory.labels.length === 0 ? (
        <p className={styles.noItems}>No inventory items found.</p>
      ) : (
        <table className={styles.inventoryTable}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.labels.map((item, index) => (
              <tr key={index}>
                <td className={styles.itemName}>{item}</td>
                <td className={styles.quantity}>{inventory.values[index]}</td>
                <td className={styles.unit}>{inventory.units[index]}</td>
                <td className={styles.supplier}>
                  {inventory.suppliers[index]}
                </td>
                <td className={styles.actions}>
                  <button
                    onClick={() => updateInventory(item, "increase")}
                    className={styles.increaseBtn}
                  >
                    +
                  </button>
                  <button
                    onClick={() => updateInventory(item, "decrease")}
                    className={styles.decreaseBtn}
                    disabled={inventory.values[index] <= 0}
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
