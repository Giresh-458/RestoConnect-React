import { useEffect, useReducer, useRef, useState } from "react";
import { RestaurantEdit } from "./RestaurantEdit";
import styles from "./RestaurantSubPage.module.css";

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

  useEffect(() => {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:3000/admin/restaurants", true);
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
      let xhr = new XMLHttpRequest();
      xhr.open(
        "GET",
        `http://localhost:3000/admin/delete_restaurant/${state.lastpayload}`,
        true
      );
      xhr.withCredentials = true;
      xhr.send();
    } else if (state.lastaction === "edit") {
      let xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `http://localhost:3000/admin/edit_restaurant/${state.lastpayload._id}`,
        true
      );
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.withCredentials = true;
      xhr.send(JSON.stringify(state.lastpayload));
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
                    <div className={styles.email}>{ownerInfo.email}</div>
                  </td>
                  <td className={styles.amountPaid}>
                    ₹{restaurant.amount || 0}
                  </td>
                  <td className={styles.actions}>
                    <RestaurantEdit Dispatch={Dispatch} restaurant={restaurant} />
                    <button
                      onClick={() => {
                        if (!confirm(`Are you sure you want to permanently delete restaurant '${restaurant.name}'? This will remove its dishes and owner account.`)) return;
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
