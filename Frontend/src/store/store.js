import { configureStore } from "@reduxjs/toolkit";
import cartSlice from "./CartSlice";
import restaurantReducer from "./restaurantSlice";
import ownerReducer from "./ownerSlice";

const store = configureStore({
  reducer: {
    cart: cartSlice,
    restaurants: restaurantReducer,
    owner: ownerReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
