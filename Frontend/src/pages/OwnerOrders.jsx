import { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import "./OwnerOrders.css";

export function OwnerOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("http://localhost:3000/owner/orders", {
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
          </tr>
        </thead>

        <tbody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <tr key={order._id}>
                <td>{order._id}</td>
                <td>{order.table_id || "N/A"}</td>
                <td>
                  {Array.isArray(order.dishes)
                    ? order.dishes.join(", ")
                    : "—"}
                </td>
                <td>{order.totalAmount}</td>
                <td>
                  <span
                    className={`status-badge status-${order.status?.toLowerCase()}`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
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
