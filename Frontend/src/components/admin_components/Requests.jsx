import { useEffect, useReducer, useRef, useState } from "react";
import { maskEmail } from "../../util/maskEmail";
import styles from "./RestaurantSubPage.module.css";

const initialState = {
  requests_list: [],
  lastaction: "load",
  lastpayload: "requests",
};

function reducer(state, action) {
  if (action.type === "load") {
    return {
      requests_list: [...action.payload],
      lastaction: "load",
      lastpayload: null,
    };
  } 
  else if (action.type === "accept" || action.type === "reject") {
    return {
      requests_list: state.requests_list.filter(
        (req) => req.owner_username !== action.payload
      ),
      lastaction: action.type,
      lastpayload: action.payload,
    };
  }
  return state;
}


export function Requests({ searchTerm }) {
  const firstRender = useRef(true);
  const [state, Dispatch] = useReducer(reducer, initialState);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [csrfToken, setCsrfToken] = useState(null);

  useEffect(() => {
    fetch("/api/admin/restaurant-requests", { credentials: "include" })
      .then((res) => res.ok ? res.json() : Promise.reject(res))
      .then((data) => Dispatch({ type: "load", payload: data }))
      .catch(() => {});

    fetch("/api/csrf-token", { method: "GET", credentials: "include" })
      .then((res) => res.json())
      .then((data) => data?.csrfToken && setCsrfToken(data.csrfToken))
      .catch((err) => console.error("Failed to fetch CSRF token for requests:", err));
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = state.requests_list.filter(
        (request) =>
          request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.owner_username
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
      setFilteredRequests(filtered);
    } else {
      setFilteredRequests(state.requests_list);
    }
  }, [state.requests_list, searchTerm]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    // Do not attempt POST without a CSRF token
    if (!csrfToken) {
      return;
    }

    if (state.lastaction === "accept") {
      fetch(`/api/admin/restaurant-requests/${state.lastpayload}/accept`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      }).catch(() => {});
    } else if (state.lastaction === "reject") {
      fetch(`/api/admin/restaurant-requests/${state.lastpayload}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      }).catch(() => {});
    }
  }, [state.lastaction, csrfToken]);

  return (
    <div className={styles.requestsContainer}>
      <h2 className={styles.sectionTitle}>Pending Restaurant Requests</h2>

      {state.requests_list.length === 0 && state.lastaction === "load" ? (
        <p className={styles.loadingMessage}>Loading requests...</p>
      ) : filteredRequests.length === 0 ? (
        <p className={styles.noDataMessage}>No pending requests found.</p>
      ) : (
        <table className={styles.requestsTable}>
          <thead>
            <tr>
              <th>Restaurant Name</th>
              <th>Owner</th>
              <th>Email</th>
              <th>Location</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => (
              <tr key={request._id}>
                <td className={styles.restaurantName}>{request.name}</td>
                <td className={styles.ownerName}>{request.owner_username}</td>
                <td className={styles.email}>{maskEmail(request.email)}</td>
                <td className={styles.location}>{request.location}</td>
                <td className={styles.amount}>₹{request.amount}</td>
                <td className={styles.actions}>
                  <button
                    onClick={() =>
                      Dispatch({
                        type: "accept",
                        payload: request.owner_username,
                      })
                    }
                    className={styles.approveBtn}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      Dispatch({
                        type: "reject",
                        payload: request.owner_username,
                      })
                    }
                    className={styles.rejectBtn}
                  >
                    Reject
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
