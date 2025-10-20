import { useRef } from "react";

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
        props.Dispatch({ type: "edit", payload: { ...restaurant, ...data } });

        
        if (diagref.current) {
            diagref.current.close();
        }
        e.target.reset(); 
    };

    if (!restaurant) {
        return <button disabled>No Data</button>;
    }

    const dateOnly = restaurant.date ? new Date(restaurant.date).toISOString().split('T')[0] : '';
    
    return (
        <>
            <button onClick={openDialog}>Edit Restaurant</button>
            
            <dialog ref={diagref}>
                <h2>Edit {restaurant.name}</h2>
                
                <form onSubmit={closeDialog}>
                    
                    <input type="hidden" name="_id" value={restaurant._id} />

                  
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        defaultValue={restaurant.name}
                        required
                    />

                    
                    <label>Date (Read-Only):</label>
                    <input
                        type="text"
                        name="date"
                        defaultValue={dateOnly}
                        readOnly
                    />
                    
                    
                    <label>Rating:</label>
                    <input
                        type="number"
                        name="rating"
                        defaultValue={restaurant.rating}
                        min="0"
                        max="5"
                        step="0.1"
                        required
                    />
                    
                  
                    <label>Location:</label>
                    <input
                        type="text"
                        name="location"
                        defaultValue={restaurant.location}
                        required
                    />
                    
                    
                    <label>Amount ($):</label>
                    <input
                        type="number"
                        name="amount"
                        defaultValue={restaurant.amount}
                        min="0"
                        required
                    />

                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                        <button type="submit">Save Changes</button>
                        <button type="button" onClick={() => diagref.current.close()}>Cancel</button>
                    </div>
                </form>
            </dialog>
        </>
    );
}