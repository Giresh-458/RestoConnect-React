import { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import "./OwnerReservations.css";

export function OwnerReservations() {
  const [reservations, setReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");


  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/owner/reservations", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch reservations");
        const data = await response.json();
        console.log("Fetched reservations:", data);
        setReservations(data);
      } catch (error) {
        console.error("Error fetching reservations:", error);
      }
    };

    fetchReservations();
  }, []);

  const filteredReservations = reservations.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status?.toLowerCase() === statusFilter;
  });


  return (
    <div className="reservations-container">
      <h2 className="reservations-heading">Reservations</h2>

      <div className="reservations-filter">
        <label htmlFor="reservationStatus">Filter by status: </label>
        <select
          id="reservationStatus"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="confirmed">Confirmed</option>
        </select>
      </div>

      <table className="reservations-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Time</th>
            <th>Table</th>
            <th>Guests</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {/* {reservations.length > 0 ? (
            reservations.map((r) => ( */}
            {filteredReservations.length > 0 ? (
              filteredReservations.map((r) => (

              <tr key={r._id}>
                <td>{r.customerName}</td>
                <td>{r.time}</td>
                <td>{r.table_id}</td>
                <td>{r.guests}</td>
                <td>
                  <span className={`status-badge status-${r.status?.toLowerCase()}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No reservations found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export async function loader() {
  const role = await isLogin();
  if (role !== "owner") return redirect("/login");
  return null;
}
