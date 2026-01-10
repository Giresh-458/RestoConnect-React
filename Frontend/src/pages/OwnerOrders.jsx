import { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import "./OwnerOrders.css";

export function OwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // ⭐ 1. ADD THIS FUNCTION
  const getReadableOrderId = (order, index) => {
    if (!order.createdAt) return "ORD-UNKNOWN";

    const date = new Date(order.createdAt);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date
      .toLocaleString("en-IN", { month: "short" })
      .toUpperCase();

    return `ORD-${day}${month}-${index + 1}`;
  };

  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/owner/orders", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch orders");

        const data = await response.json();
        console.log("Fetched orders:", data);
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);



  const filteredOrders = orders.filter((order) => {
  if (statusFilter === "all") return true;

  // Paid is based on paymentStatus
  if (statusFilter === "paid") {
    return order.paymentStatus === "paid";
  }

  // Other statuses come from order.status
  return order.status?.toLowerCase() === statusFilter;
});


  return (
    <div className="orders-container">
      <h2 className="orders-heading">Orders</h2>


    <div className="orders-filter">
      <label htmlFor="statusFilter">Filter by status: </label>

      <select
        id="statusFilter"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="all">All</option>
        <option value="completed">Completed</option>
        <option value="preparing">Preparing</option>
        <option value="pending">Pending</option>
        <option value="paid">Paid</option>
      </select>
    </div>


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
          {filteredOrders.length > 0 ? (
            // ⭐ 2. ADD index HERE
            filteredOrders.map((order, index) => (
              <>
                <tr key={order._id} className="order-row">
                  
                  {/* ⭐ 3. REPLACE ORDER ID */}
                  <td>{getReadableOrderId(order, index)}</td>

                  <td>{order.table_id || "N/A"}</td>
                  <td>{order.dishes?.length || 0} items</td>
                  <td>₹{order.totalAmount?.toFixed(2) || "0.00"}</td>
                  <td>
                    <span
                      className={`status-badge status-${order.status?.toLowerCase()}`}
                    >
                      {order.status || "PENDING"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="view-items-btn"
                      onClick={() =>
                        setExpandedOrder(
                          expandedOrder === order._id ? null : order._id
                        )
                      }
                    >
                      {expandedOrder === order._id
                        ? "Hide Items"
                        : "View Items"}
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
                                <td>
                                  ₹
                                  {item.price
                                    ? item.price.toFixed(2)
                                    : "0.00"}
                                </td>
                                <td>
                                  ₹
                                  {(
                                    (item.quantity || 1) *
                                    (item.price || 0)
                                  ).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="order-summary">
                          <div className="summary-row">
                            <span>Subtotal:</span>
                            <span>
                              ₹{order.subtotal?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                          <div className="summary-row">
                            <span>Tax ({order.taxRate || 0}%):</span>
                            <span>
                              ₹{order.taxAmount?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                          <div className="summary-row total">
                            <span>Total:</span>
                            <span>
                              ₹{order.totalAmount?.toFixed(2) || "0.00"}
                            </span>
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
