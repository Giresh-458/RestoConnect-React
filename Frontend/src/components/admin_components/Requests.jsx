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

  useEffect(() => {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:3000/admin/requests", true);
    xhr.onload = function () {
      if (this.status === 200) {
        const data = JSON.parse(xhr.responseText);
        Dispatch({ type: "load", payload: data });
      }
    };
    xhr.withCredentials = true;
    xhr.send();
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

    if (state.lastaction === "accept") {
      let xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `http://localhost:3000/admin/accept_request/${state.lastpayload}`,
        true
      );
      xhr.withCredentials = true;
      xhr.send();
    } else if (state.lastaction === "reject") {
      let xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `http://localhost:3000/admin/reject_request/${state.lastpayload}`,
        true
      );
      xhr.withCredentials = true;
      xhr.send();
    }
  }, [state.lastaction]);

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
