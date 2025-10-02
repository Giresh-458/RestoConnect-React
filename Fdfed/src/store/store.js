import { configureStore } from "@reduxjs/toolkit";
import cartSlice from "./CartSlice";



const store = configureStore({

reducer:{
    cartSlice:cartSlice
}

})

export default store;