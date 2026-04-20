const request = require("supertest");

const mockRestaurantFind = jest.fn();
const mockCountDocuments = jest.fn();

jest.mock("../Model/Restaurents_model", () => ({
  Restaurant: {
    find: mockRestaurantFind,
    countDocuments: mockCountDocuments,
  },
}));

const { createTestApp } = require("./helpers/createTestApp");
const { searchRestaurants } = require("../Controller/searchController");

const app = createTestApp((testApp) => {
  testApp.get("/api/customer/search", searchRestaurants);
});

function createQueryChain(results) {
  const lean = jest.fn().mockResolvedValue(results);
  const limit = jest.fn().mockReturnValue({ lean });
  const skip = jest.fn().mockReturnValue({ limit });

  return {
    lean,
    limit,
    skip,
    sort: jest.fn().mockReturnValue({ skip, limit, lean }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Search routes", () => {
  test("GET /api/customer/search queries restaurants with filters and pagination", async () => {
    const results = [{ _id: "rest-2", name: "Spice Route", city: "Pune" }];
    const queryChain = createQueryChain(results);

    mockRestaurantFind.mockReturnValue(queryChain);
    mockCountDocuments.mockResolvedValue(1);

    const response = await request(app).get(
      "/api/customer/search?city=Pune&open=true&page=2&limit=5",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      page: 2,
      limit: 5,
      totalPages: 1,
      totalResults: 1,
      results,
    });
    expect(mockRestaurantFind).toHaveBeenCalledWith(
      {
        city: "Pune",
        isOpen: true,
      },
      {},
    );
    expect(queryChain.sort).toHaveBeenCalledWith({ rating: -1, name: 1 });
    expect(queryChain.skip).toHaveBeenCalledWith(5);
  });

  test("GET /api/customer/search supports query alias and text score sort", async () => {
    const results = [{ _id: "rest-3", name: "Mumbai Grill", city: "Mumbai" }];
    const queryChain = createQueryChain(results);

    mockRestaurantFind.mockReturnValue(queryChain);
    mockCountDocuments.mockResolvedValue(1);

    const response = await request(app).get(
      "/api/customer/search?query=mumbai%20grill&cuisine=Indian",
    );

    expect(response.status).toBe(200);
    expect(mockRestaurantFind).toHaveBeenCalledWith(
      {
        $text: { $search: "mumbai grill" },
        cuisine: "Indian",
      },
      { score: { $meta: "textScore" } },
    );
    expect(queryChain.sort).toHaveBeenCalledWith({
      score: { $meta: "textScore" },
      rating: -1,
    });
  });

  test("GET /api/customer/search rejects invalid open filter values", async () => {
    const response = await request(app).get("/api/customer/search?open=maybe");

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Invalid open filter/);
    expect(mockRestaurantFind).not.toHaveBeenCalled();
  });
});
