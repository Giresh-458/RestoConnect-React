const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    name: String,
    items: [String],
  },
  { _id: false }
);

const personSchema = new Schema({
  name: { type: String, required: true, unique: true },
  username: { type: String, ref: "User", default: null },
  img_url: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: "" },
  emailNotificationsEnabled: { type: Boolean, default: true },
  prev_orders: [orderSchema],
  top_dishes: { type: Map, of: Number, default: {} },
  top_restaurent: { type: Map, of: Number, default: {} },
  cart: { type: Array, default: [] },
  favourites: { type: [String], default: [] },
});

// Instance method to add order
personSchema.methods.add_order = function (order) {
  this.prev_orders.push(order);

  const restaurantName = String(order?.name || "").trim();
  if (restaurantName) {
    this.top_restaurent.set(
      restaurantName,
      (this.top_restaurent.get(restaurantName) || 0) + 1,
    );
  }

  const items = Array.isArray(order?.items) ? order.items : [];
  items.forEach((element) => {
    const dishName = String(element || "").trim();
    if (!dishName) return;
    this.top_dishes.set(dishName, (this.top_dishes.get(dishName) || 0) + 1);
  });
  return this.save();
};

// Helper method to get top items from a map
personSchema.methods.getTopItems = function (map) {
  let entries = Array.from(map.entries());
  entries.sort((a, b) => b[1] - a[1]);
  let top3 = entries.slice(0, 3).map((entry) => entry[0]);
  let top3Count = entries.slice(0, 3).map((entry) => entry[1]);
  let total = entries.reduce((acc, entry) => acc + entry[1], 0);
  return { top3, top3Count, total };
};

// Method to get top dishes
personSchema.methods.give_topDishes = function () {
  let a = this.getTopItems(this.top_dishes);
  a.top3.push("others");
  a.top3Count.push(
    a.total - a.top3Count.reduce((sum, entry) => sum + entry, 0)
  );
  return { top3: a.top3, top3_cont: a.top3Count };
};

// Method to get top restaurants
personSchema.methods.give_topRestaurents = function () {
  let a = this.getTopItems(this.top_restaurent);
  a.top3.push("others");
  a.top3Count.push(
    a.total - a.top3Count.reduce((sum, entry) => sum + entry, 0)
  );
  return { top3: a.top3, top3_cont: a.top3Count };
};

// Static method to get user data by name
personSchema.statics.get_user_function = async function (name) {
  const user = await this.findOne({ name: name });
  if (!user) {
    return null;
  }
  const topDishesData = user.give_topDishes();
  const topRestaurantsData = user.give_topRestaurents();

  return {
    name: user.name,
    img_url: user.img_url,
    email: user.email,
    phone: user.phone,
    emailNotificationsEnabled: user.emailNotificationsEnabled,
    address: user.address,
    prev_order: user.prev_orders,
    item_list: topDishesData.top3,
    top_dishes_count: topDishesData.top3_cont,
    restaurent_list: topRestaurantsData.top3,
    top_restaurants_count: topRestaurantsData.top3_cont,
  };
};

const Person = mongoose.model("Person", personSchema);

module.exports = Person;
