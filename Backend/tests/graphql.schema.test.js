const { graphql } = require("graphql");

const mockRestaurantFind = jest.fn();
const mockRestaurantFindById = jest.fn();

jest.mock("../Model/Restaurents_model", () => ({
  Restaurant: {
    find: mockRestaurantFind,
    findById: mockRestaurantFindById,
  },
}));

const { schema } = require("../graphql/schema");

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
});
