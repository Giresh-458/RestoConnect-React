const { Restaurant } = require("./Restaurents_model");

let active_user_count = 34;
let total_user_count = 200;

async function getRestaurantsList() {
    const restaurants = await Restaurant.find();
    return restaurants.map(r1 => ({
        name: r1.name,
        location: r1.location,
        amount: r1.amount,
        date: r1.date
    }));
}

module.exports = {
    active_user_count,
    total_user_count,
    getRestaurantsList,
};
