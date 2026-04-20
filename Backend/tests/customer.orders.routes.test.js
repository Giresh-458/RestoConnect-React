const request = require("supertest");

const mockPersonFindOne = jest.fn();
const mockDishFind = jest.fn();
const mockDishFindById = jest.fn();
const mockDishFindByName = jest.fn();
const mockRestaurantFindById = jest.fn();
const mockRestaurantDistinct = jest.fn();
const mockOrderFindOne = jest.fn();
const mockReservationFindOne = jest.fn();
const mockPromoCodeFindOne = jest.fn();
const mockPromoCodeUpdateOne = jest.fn();
const mockCartFindOneAndUpdate = jest.fn();

jest.mock("../Model/customer_model", () => ({
  findOne: mockPersonFindOne,
  get_user_function: jest.fn(),
}));

jest.mock("../Model/Dishes_model_test", () => ({
  Dish: {
    find: mockDishFind,
    findById: mockDishFindById,
    findByName: mockDishFindByName,
  },
}));

jest.mock("../Model/Restaurents_model", () => ({
  Restaurant: {
    find_by_id: mockRestaurantFindById,
    distinct: mockRestaurantDistinct,
  },
}));

jest.mock("../Model/feedback", () => ({
  find: jest.fn(),
  updateMany: jest.fn(),
}));

jest.mock("../Model/Order_model", () => ({
  Order: {
    findOne: mockOrderFindOne,
    updateMany: jest.fn(),
  },
}));

jest.mock("../Model/Reservation_model", () => ({
  Reservation: {
    findOne: mockReservationFindOne,
  },
}));

jest.mock("../Model/PromoCode_model", () => ({
  PromoCode: {
    findOne: mockPromoCodeFindOne,
    updateOne: mockPromoCodeUpdateOne,
  },
}));

jest.mock("../Model/userRoleModel", () => ({
  User: {
    findOne: jest.fn(),
  },
}));

jest.mock("../Model/Cart_model", () => ({
  Cart: {
    findOneAndUpdate: mockCartFindOneAndUpdate,
  },
}));

jest.mock("../util/fileUpload", () => ({
  getImageUrl: jest.fn((req, filename) => filename || null),
  getProfilePicUrl: jest.fn((req, filename) => filename || null),
  getRestaurantImageUrl: jest.fn((req, filename) => filename || null),
}));

const { createTestApp } = require("./helpers/createTestApp");
const customerController = require("../Controller/customerController");

const app = createTestApp((testApp) => {
  testApp.post("/api/customer/order_reservation/order", customerController.order);
  testApp.get("/api/customer/orders/:orderId", customerController.getOrderById);
  testApp.post("/api/customer/orders/:orderId/reorder", customerController.reorderOrder);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Customer order routes", () => {
  test("POST /api/customer/order_reservation/order blocks orders for closed restaurants", async () => {
    mockRestaurantFindById.mockResolvedValue({ _id: "rest-1", isOpen: false });

    const response = await request(app)
      .post("/api/customer/order_reservation/order")
      .set("x-test-rest-id", "rest-1")
      .send({
        restaurant: "Closed Kitchen",
        specialRequests: "No onions",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: "Restaurant is currently closed",
    });
    expect(mockRestaurantFindById).toHaveBeenCalledWith("rest-1");
  });

  test("GET /api/customer/orders/:orderId denies access to another customer's order", async () => {
    mockOrderFindOne.mockResolvedValue({
      _id: "order-1",
      customerName: "someone-else",
    });

    const response = await request(app)
      .get("/api/customer/orders/order-1")
      .set("x-test-user", "alice");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "",
      error: "Forbidden",
    });
  });

  test("POST /api/customer/orders/:orderId/reorder recreates cart items for the signed-in customer", async () => {
    const personDoc = {
      cart: [],
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockOrderFindOne.mockResolvedValue({
      _id: "order-9",
      customerName: "alice",
      rest_id: "rest-9",
      restaurant: "Spice Route",
      dishes: ["dish-1", "dish-1", "Biryani"],
    });
    mockDishFindById.mockImplementation(async (dishId) => {
      if (dishId === "dish-1") {
        return {
          _id: "dish-1",
          name: "Paneer Tikka",
          price: 150,
          image: "paneer.jpg",
        };
      }

      return null;
    });
    mockDishFindByName.mockImplementation(async (dishName) => {
      if (dishName === "Biryani") {
        return {
          _id: "dish-2",
          name: "Biryani",
          price: 240,
          img_url: "biryani.jpg",
        };
      }

      return null;
    });
    mockPersonFindOne.mockResolvedValue(personDoc);
    mockCartFindOneAndUpdate.mockResolvedValue({});

    const response = await request(app)
      .post("/api/customer/orders/order-9/reorder")
      .set("x-test-user", "alice");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      restaurant: {
        id: "rest-9",
        name: "Spice Route",
      },
      items: [
        {
          id: "dish-1",
          name: "Paneer Tikka",
          price: 150,
          amount: 300,
          image: "paneer.jpg",
          quantity: 2,
        },
        {
          id: "dish-2",
          name: "Biryani",
          price: 240,
          amount: 240,
          image: "biryani.jpg",
          quantity: 1,
        },
      ],
    });
    expect(personDoc.cart).toEqual([
      { dish: "dish-1", quantity: 2 },
      { dish: "Biryani", quantity: 1 },
    ]);
    expect(personDoc.markModified).toHaveBeenCalledWith("cart");
    expect(personDoc.save).toHaveBeenCalled();
    expect(mockCartFindOneAndUpdate).toHaveBeenCalledWith(
      {
        customerName: "alice",
        restaurantId: "rest-9",
      },
      {
        $set: {
          items: [
            { dish: "dish-1", quantity: 2 },
            { dish: "Biryani", quantity: 1 },
          ],
        },
      },
      { upsert: true, new: true },
    );
  });
});
