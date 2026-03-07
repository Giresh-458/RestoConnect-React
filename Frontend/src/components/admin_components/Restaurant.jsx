import { useEffect, useReducer, useRef, useState } from "react";
import { RestaurantEdit } from "./RestaurantEdit";
import { maskEmail } from "../../util/maskEmail";
import styles from "./RestaurantSubPage.module.css";
import { useConfirm } from "../common/ConfirmDialog";

const initialState = {
  restaurants_list: [],
  lastaction: "load",
  lastpayload: "restaurants",
};

function reducer(state, action) {
  if (action.type === "load") {
    return {
      restaurants_list: [...action.payload],
      lastaction: "load",
      lastpayload: "restaurants",
    };
  } else if (action.type === "delete") {
    return {
      restaurants_list: state.restaurants_list.filter(
        (element) => element._id !== action.payload
      ),
      lastaction: "delete",
      lastpayload: action.payload,
    };
  } else if (action.type === "edit") {
    return {
      restaurants_list: state.restaurants_list.map((element) =>
        element._id === action.payload._id ? action.payload : element
      ),
      lastaction: "edit",
      lastpayload: action.payload,
    };
  }
  return state;
}

export function Restaurant({ searchTerm }) {
  const firstRender = useRef(true);
  const [state, Dispatch] = useReducer(reducer, initialState);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const confirmDlg = useConfirm();

  useEffect(() => {
    fetch("http://localhost:3000/api/admin/restaurants", { credentials: "include" })
      .then((res) => res.ok ? res.json() : Promise.reject(res))
      .then((data) => Dispatch({ type: "load", payload: data }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = state.restaurants_list.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    } else {
      setFilteredRestaurants(state.restaurants_list);
    }
  }, [state.restaurants_list, searchTerm]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (state.lastaction === "delete") {
      fetch(`http://localhost:3000/api/admin/restaurants/${state.lastpayload}`, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => {});
    } else if (state.lastaction === "edit") {
      fetch(`http://localhost:3000/api/admin/restaurants/${state.lastpayload._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.lastpayload),
      }).catch(() => {});
    }
  }, [state.lastaction]);

  return (
    <div className={styles.restaurantContainer}>
      <h2 className={styles.sectionTitle}> Active Restaurants</h2>

      {state.restaurants_list.length === 0 && state.lastaction === "load" ? (
        <p className={styles.loadingMessage}>Loading restaurants...</p>
      ) : filteredRestaurants.length === 0 ? (
        <p className={styles.noDataMessage}>No restaurants found.</p>
      ) : (
        <table className={styles.restaurantTable}>
          <thead>
            <tr>
              <th>Restaurant Name</th>
              <th>Owner</th>
              <th>Email </th>
              <th>Amount Paid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRestaurants.map((restaurant) => {
              const ownerInfo = restaurant.owner || {
                name: "N/A",
                email: "N/A",
              };

              return (
                <tr key={restaurant._id}>
                  <td className={styles.restaurantName}>{restaurant.name}</td>
                  <td className={styles.ownerName}>{ownerInfo.name}</td>
                  <td className={styles.contactInfo}>
                    <div className={styles.email}>{maskEmail(ownerInfo.email)}</div>
                  </td>
                  <td className={styles.amountPaid}>
                    ₹{restaurant.amount || 0}
                  </td>
                  <td className={styles.actions}>
                    <RestaurantEdit Dispatch={Dispatch} restaurant={restaurant} />
                    <button
                      onClick={async () => {
                        const ok = await confirmDlg({ title: "Delete Restaurant", message: `Are you sure you want to permanently delete restaurant '${restaurant.name}'? This will remove its dishes and owner account.`, variant: "danger", confirmText: "Delete" });
                        if (!ok) return;
                        Dispatch({ type: "delete", payload: restaurant._id });
                      }}
                      className={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
