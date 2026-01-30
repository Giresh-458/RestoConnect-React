import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    dishes: [],
    reservation: {},
    amount: 0,
    restId: null,
    restName: "",
    promoCode: null,
    promoDiscount: 0,
  },
  reducers: {
    addItem: (state, action) => {
      let item = action.payload;
      let presentItem = state.dishes.find((it) => {
        return it.id === item.id;
      });

      if (presentItem == undefined) {
        state.dishes.push({ ...item, quantity: 1 });
      } else {
        presentItem.quantity += 1;
      }
      state.amount += item.amount;
    },

    removeItem: (state, action) => {
      let item = action.payload;
      let presentItem = state.dishes.find((it) => {
        return it.id === item.id;
      });

      if (presentItem == undefined) {
        return;
      } else if (presentItem.quantity == 1) {
        state.dishes = state.dishes.filter((it) => it.id !== item.id);
      } else {
        presentItem.quantity--;
      }
      state.amount -= item.amount;
    },
    deleteItem: (state, action) => {
      let item = action.payload;
      let presentItem = state.dishes.find((it) => {
        return it.id === item.id;
      });

      if (presentItem == undefined) {
        return;
      }

      state.amount -= item.amount * presentItem.quantity;
      state.dishes = state.dishes.filter((it) => it.id !== item.id);
    },
    addReservation: (state, action) => {
      state.reservation = { ...action.payload };
      let amount_add =
        action.payload["seater1"] * 10 +
        action.payload["seater2"] * 20 +
        action.payload["seater4"] * 40 +
        action.payload["seater12"] * 100;
      state.amount += amount_add;
    },
    removeReservation: (state) => {
      let amount_remove =
        state.reservation["seater1"] * 10 +
        state.reservation["seater2"] * 20 +
        state.reservation["seater4"] * 40 +
        state.reservation["seater12"] * 100;
      state.reservation = null;
      state.amount -= amount_remove;
    },
    clearcart: (state) => {
      state.dishes = [];
      state.reservation = {};
      state.amount = 0;
      state.restId = null;
      state.restName = "";
      state.promoCode = null;
      state.promoDiscount = 0;
    },
    setPromoCode: (state, action) => {
      state.promoCode = action.payload.code || null;
      state.promoDiscount = action.payload.discount || 0;
    },
    clearPromoCode: (state) => {
      state.promoCode = null;
      state.promoDiscount = 0;
    },
    replaceCart: (state, action) => {
      const items = Array.isArray(action.payload) ? action.payload : [];
      state.dishes = items.map((item) => {
        let quantity = item.quantity ?? 1;
        let price = item.price ?? 0;
        let amount = price;

        if (!item.price && item.amount && quantity) {
          amount = item.amount / quantity;
        } else if (item.amount && item.price === undefined) {
          amount = item.amount;
        }
        return {
          ...item,
          quantity,
          amount,
        };
      });
      state.amount = state.dishes.reduce(
        (total, item) => total + (item.amount ?? 0) * (item.quantity ?? 1),
        0,
      );
      if (!state.reservation) {
        state.reservation = {};
      }
    },
    setRestaurant: (state, action) => {
      state.restId = action.payload?.restId ?? null;
      state.restName = action.payload?.restName ?? "";
    },
  },
});

export const {
  addItem,
  removeItem,
  deleteItem,
  addReservation,
  removeReservation,
  clearcart,
  replaceCart,
  setRestaurant,
  setPromoCode,
  clearPromoCode,
} = cartSlice.actions;
export default cartSlice.reducer;
