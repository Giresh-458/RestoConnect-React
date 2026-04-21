const { graphql } = require("graphql");

const mockRestaurantFind = jest.fn();
const mockRestaurantFindById = jest.fn();

jest.mock("../Model/Restaurents_model", () => ({
  Restaurant: {
    find: mockRestaurantFind,
    findById: mockRestaurantFindById,
  },
}));

const { buildInventoryItems, schema } = require("../graphql/schema");

const createFindChain = (result) => ({
  select: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(result),
  }),
});

const createFindByIdChain = (result) => ({
  select: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(result),
  }),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GraphQL schema", () => {
  test("publicRestaurants returns public restaurant data", async () => {
    mockRestaurantFind.mockReturnValue(
      createFindChain([
        {
          _id: "rest-1",
          name: "Green Bowl",
          city: "Pune",
          image: "green.jpg",
          leftovers: [
            {
              _id: "left-1",
              itemName: "Rice Bowl",
              quantity: 2,
              expiryDate: new Date(Date.now() + 60 * 60 * 1000),
              createdAt: new Date("2026-04-20T10:00:00.000Z"),
            },
          ],
        },
      ]),
    );

    const result = await graphql({
      schema,
      source: `
        query {
          publicRestaurants {
            id
            name
            city
            leftovers {
              itemName
              quantity
            }
          }
        }
      `,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.publicRestaurants).toEqual([
      {
        id: "rest-1",
        name: "Green Bowl",
        city: "Pune",
        leftovers: [
          {
            itemName: "Rice Bowl",
            quantity: 2,
          },
        ],
      },
    ]);
  });

  test("restaurantInventory requires authentication", async () => {
    const result = await graphql({
      schema,
      source: `
        query {
          restaurantInventory {
            restaurantId
          }
        }
      `,
      contextValue: { auth: null },
    });

    expect(result.data.restaurantInventory).toBeNull();
    expect(result.errors[0].message).toMatch(/Authentication required/);
  });

  test("restaurantInventory returns computed inventory for business users", async () => {
    mockRestaurantFindById.mockReturnValue(
      createFindByIdChain({
        _id: "rest-1",
        name: "Green Bowl",
        city: "Pune",
        inventoryData: {
          labels: ["Rice", "Oil", "Salt"],
          values: [3, 0, 1],
          units: ["kg", "L", "kg"],
          suppliers: ["Farm Co", "Supply Hub", ""],
          minStocks: [5, 1, 1],
        },
      }),
    );

    const result = await graphql({
      schema,
      source: `
        query {
          restaurantInventory {
            restaurantId
            restaurantName
            lowStockCount
            outOfStockCount
            inventory {
              id
              name
              quantity
              unit
              supplier
              minStock
              status
              isLowStock
              isOutOfStock
            }
          }
        }
      `,
      contextValue: {
        auth: {
          username: "owner1",
          role: "owner",
          rest_id: "rest-1",
        },
      },
    });

    expect(result.errors).toBeUndefined();
    expect(mockRestaurantFindById).toHaveBeenCalledWith("rest-1");
    expect(result.data.restaurantInventory.restaurantId).toBe("rest-1");
    expect(result.data.restaurantInventory.lowStockCount).toBe(2);
    expect(result.data.restaurantInventory.outOfStockCount).toBe(1);
    expect(result.data.restaurantInventory.inventory).toEqual([
      {
        id: "item_0",
        name: "Rice",
        quantity: 3,
        unit: "kg",
        supplier: "Farm Co",
        minStock: 5,
        status: "Low Stock",
        isLowStock: true,
        isOutOfStock: false,
      },
      {
        id: "item_1",
        name: "Oil",
        quantity: 0,
        unit: "L",
        supplier: "Supply Hub",
        minStock: 1,
        status: "Out of Stock",
        isLowStock: false,
        isOutOfStock: true,
      },
      {
        id: "item_2",
        name: "Salt",
        quantity: 1,
        unit: "kg",
        supplier: "",
        minStock: 1,
        status: "Low Stock",
        isLowStock: true,
        isOutOfStock: false,
      },
    ]);
  });

  test("publicRestaurants filters expired leftovers and sorts the remaining items by expiry", async () => {
    mockRestaurantFind.mockReturnValue(
      createFindChain([
        {
          _id: "rest-2",
          name: "Fresh Fork",
          city: "Mumbai",
          image: "fresh-fork.jpg",
          leftovers: [
            {
              _id: "left-expired",
              itemName: "Expired Curry",
              quantity: 1,
              expiryDate: new Date(Date.now() - 30 * 60 * 1000),
            },
            {
              _id: "left-late",
              itemName: "Evening Salad",
              quantity: 1,
              expiryDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
            },
            {
              _id: "left-soon",
              itemName: "Lunch Wrap",
              quantity: 2,
              expiryDate: new Date(Date.now() + 30 * 60 * 1000),
            },
          ],
        },
      ]),
    );

    const result = await graphql({
      schema,
      source: `
        query {
          publicRestaurants {
            leftovers {
              itemName
            }
          }
        }
      `,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.publicRestaurants[0].leftovers).toEqual([
      { itemName: "Lunch Wrap" },
      { itemName: "Evening Salad" },
    ]);
  });

  test("restaurantInventory blocks owners from inspecting another restaurant", async () => {
    const result = await graphql({
      schema,
      source: `
        query {
          restaurantInventory(restId: "rest-2") {
            restaurantId
          }
        }
      `,
      contextValue: {
        auth: {
          username: "owner1",
          role: "owner",
          rest_id: "rest-1",
        },
      },
    });

    expect(result.data.restaurantInventory).toBeNull();
    expect(result.errors[0].message).toMatch(/only access inventory for your assigned restaurant/);
    expect(mockRestaurantFindById).not.toHaveBeenCalled();
  });

  test("restaurantInventory lets admins inspect an explicit restaurant id", async () => {
    mockRestaurantFindById.mockReturnValue(
      createFindByIdChain({
        _id: "rest-9",
        name: "Admin View",
        city: "Delhi",
        inventoryData: {
          labels: ["Tea"],
          values: [6],
          units: ["boxes"],
          suppliers: ["Warehouse"],
          minStocks: [3],
        },
      }),
    );

    const result = await graphql({
      schema,
      source: `
        query {
          restaurantInventory(restId: "rest-9") {
            restaurantId
            restaurantName
          }
        }
      `,
      contextValue: {
        auth: {
          username: "admin1",
          role: "admin",
          rest_id: null,
        },
      },
    });

    expect(result.errors).toBeUndefined();
    expect(mockRestaurantFindById).toHaveBeenCalledWith("rest-9");
    expect(result.data.restaurantInventory).toEqual({
      restaurantId: "rest-9",
      restaurantName: "Admin View",
    });
  });

  test("restaurantInventory reports missing restaurants", async () => {
    mockRestaurantFindById.mockReturnValue(createFindByIdChain(null));

    const result = await graphql({
      schema,
      source: `
        query {
          restaurantInventory {
            restaurantId
          }
        }
      `,
      contextValue: {
        auth: {
          username: "owner1",
          role: "owner",
          rest_id: "rest-missing",
        },
      },
    });

    expect(result.data.restaurantInventory).toBeNull();
    expect(result.errors[0].message).toBe("Restaurant not found");
  });

  test("buildInventoryItems applies defaults for missing units and supplier values", () => {
    const inventory = buildInventoryItems({
      _id: "rest-4",
      inventoryData: {
        labels: ["Rice", "Sauce"],
        values: [0, 7],
        minStocks: [1, 3],
      },
    });

    expect(inventory).toEqual([
      expect.objectContaining({
        id: "item_0",
        isLowStock: false,
        isOutOfStock: true,
        rest_id: "rest-4",
        status: "Out of Stock",
        supplier: "",
        unit: "pieces",
      }),
      expect.objectContaining({
        id: "item_1",
        isLowStock: false,
        isOutOfStock: false,
        status: "Available",
        supplier: "",
        unit: "pieces",
      }),
    ]);
  });
});
