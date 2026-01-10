import { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import "./OwnerOrders.css";

export function OwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/owner/orders", {
          method: "GET",
          credentials: "include", // keep cookies/session
        });

        if (!response.ok) throw new Error("Failed to fetch orders");

        const data = await response.json();
        console.log("Fetched orders:", data); // Debug log
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="orders-container">
      <h2 className="orders-heading">Orders</h2>

      <table className="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Table</th>
            <th>Items</th>
            <th>Amount (₹)</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <>
                <tr key={order._id} className="order-row">
                  <td>{order._id.substring(0, 6)}...</td>
                  <td>{order.table_id || "N/A"}</td>
                  <td>{order.dishes?.length || 0} items</td>
                  <td>₹{order.totalAmount?.toFixed(2) || '0.00'}</td>
                  <td>
                    <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                      {order.status || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="view-items-btn"
                      onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                    >
                      {expandedOrder === order._id ? 'Hide Items' : 'View Items'}
                    </button>
                  </td>
                </tr>
                {expandedOrder === order._id && (
                  <tr className="order-details">
                    <td colSpan="6">
                      <div className="order-items">
                        <h4>Order Items:</h4>
                        <table className="items-table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.dishes?.map((item, index) => (
                              <tr key={index}>
                                <td>{item.name || `Item ${index + 1}`}</td>
                                <td>{item.quantity || 1}</td>
                                <td>₹{item.price ? item.price.toFixed(2) : '0.00'}</td>
                                <td>₹{((item.quantity || 1) * (item.price || 0)).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="order-summary">
                          <div className="summary-row">
                            <span>Subtotal:</span>
                            <span>₹{order.subtotal?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="summary-row">
                            <span>Tax ({order.taxRate || 0}%):</span>
                            <span>₹{order.taxAmount?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="summary-row total">
                            <span>Total:</span>
                            <span>₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ✅ Loader for route protection
export async function loader() {
  let role = await isLogin();
  if (role !== "owner") {
    return redirect("/login");
  }
  return null;
}
