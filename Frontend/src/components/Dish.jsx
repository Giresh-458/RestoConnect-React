import { useSelector, useDispatch } from "react-redux";
import { addItem, removeItem } from "../store/CartSlice";
import styles from "./Dish.module.css";

export function Dish(props) {
  const quantity = useSelector((state) => {
    const dish = state.cartSlice.dishes.find(
      (element) => element.id === props.data.id || element.id === props.data._id
    );
    return dish ? dish.quantity : 0;
  });

  const dispatch = useDispatch();

  function additem() {
    // Ensure amount field exists for cart compatibility
    const dishData = {
      ...props.data,
      id: props.data.id || props.data._id,
      amount: props.data.amount || props.data.price || 0
    };
    dispatch(addItem(dishData));
  }

  function removeitem() {
    const dishData = {
      ...props.data,
      id: props.data.id || props.data._id,
      amount: props.data.amount || props.data.price || 0
    };
    dispatch(removeItem(dishData));
  }

  return (
    <div className={styles.dishCard}>
      {props.data.pic && (
        <img src={props.data.pic} alt={props.data.name} className={styles.dishImage} />
      )}
      <div className={styles.dishInfo}>
        <h3 className={styles.dishName}>{props.data.name}</h3>
        <p className={styles.dishPrice}>₹{props.data.amount || props.data.price || 0}</p>
        {props.data.desc && (
          <p className={styles.dishDescription}>{props.data.desc}</p>
        )}
        {props.data.description && (
          <p className={styles.dishDescription}>{props.data.description}</p>
        )}
        <div className={styles.quantityControls}>
          {quantity === 0 ? (
            <button className={styles.addButton} onClick={additem}>
              Add to Cart
            </button>
          ) : (
            <div className={styles.quantityButtons}>
              <button className={styles.quantityButton} onClick={removeitem}>
                −
              </button>
              <span className={styles.quantity}>{quantity}</span>
              <button className={styles.quantityButton} onClick={additem}>
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
