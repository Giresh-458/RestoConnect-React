import { useRef } from "react";
import styles from "./RestaurantSubPage.module.css";

export function RestaurantEdit(props) {
  const restaurant = props.restaurant;
  const diagref = useRef(null);

  const openDialog = () => {
    if (diagref.current) {
      diagref.current.showModal();
    }
  };

  const closeDialog = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const processedData = {
      ...data,
      amount: parseFloat(data.amount),
      rating: parseFloat(data.rating),
    };

    props.Dispatch({
      type: "edit",
      payload: { ...restaurant, ...processedData },
    });

    if (diagref.current) {
      diagref.current.close();
    }
  };

  if (!restaurant) {
    return <button disabled>No Data</button>;
  }

  const dateOnly = restaurant.date
    ? new Date(restaurant.date).toISOString().split("T")[0]
    : "";

  return (
    <>
      <button onClick={openDialog} className={styles.updateBtn}>
        Update
      </button>

      <dialog ref={diagref} className={styles.editDialog}>
        <div className={styles.dialogHeader}>
          <h2>Edit {restaurant.name}</h2>
        </div>

        <form onSubmit={closeDialog} className={styles.editForm}>
          <input type="hidden" name="_id" value={restaurant._id} />

          <div className={styles.formGroup}>
            <label>Restaurant Name:</label>
            <input
              type="text"
              name="name"
              defaultValue={restaurant.name}
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Join Date:</label>
            <input
              type="text"
              name="date"
              defaultValue={dateOnly}
              readOnly
              className={`${styles.formInput} ${styles.readonly}`}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Rating:</label>
            <input
              type="number"
              name="rating"
              defaultValue={restaurant.rating}
              min="0"
              max="5"
              step="0.1"
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Location:</label>
            <input
              type="text"
              name="location"
              defaultValue={restaurant.location}
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Amount Paid ($):</label>
            <input
              type="number"
              name="amount"
              defaultValue={restaurant.amount}
              min="0"
              step="0.01"
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => diagref.current.close()}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn}>
              Save Changes
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
