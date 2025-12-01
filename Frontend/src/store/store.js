import { configureStore } from "@reduxjs/toolkit";
import cartSlice from "./CartSlice";
import restaurantReducer from "./restaurantSlice";

const store = configureStore({
  reducer: {
    cart: cartSlice,
    restaurants: restaurantReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;