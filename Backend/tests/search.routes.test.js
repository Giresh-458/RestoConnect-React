const request = require("supertest");

const mockRestaurantFind = jest.fn();
const mockCountDocuments = jest.fn();
const mockRedisGet = jest.fn();
const mockRedisSetEx = jest.fn();

jest.mock("../Model/Restaurents_model", () => ({
  Restaurant: {
    find: mockRestaurantFind,
    countDocuments: mockCountDocuments,
  },
}));

jest.mock("../config/redis", () => ({
  get: mockRedisGet,
  setEx: mockRedisSetEx,
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
  test("GET /api/customer/search returns cached results when available", async () => {
    const cachedResponse = {
      page: 1,
      totalPages: 1,
      totalResults: 1,
      results: [{ _id: "rest-1", name: "Cache Hit Cafe" }],
    };
    mockRedisGet.mockResolvedValue(JSON.stringify(cachedResponse));

    const response = await request(app).get("/api/customer/search?q=cache");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(cachedResponse);
    expect(mockRestaurantFind).not.toHaveBeenCalled();
    expect(mockRedisSetEx).not.toHaveBeenCalled();
  });

  test("GET /api/customer/search queries restaurants and stores the response in cache", async () => {
    const results = [{ _id: "rest-2", name: "Spice Route", city: "Pune" }];
    const queryChain = createQueryChain(results);

    mockRedisGet.mockResolvedValue(null);
    mockRestaurantFind.mockReturnValue(queryChain);
    mockCountDocuments.mockResolvedValue(1);

    const response = await request(app).get(
      "/api/customer/search?city=Pune&open=true&page=2&limit=5",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      page: 2,
      totalPages: 1,
      totalResults: 1,
      results,
    });
    expect(mockRestaurantFind).toHaveBeenCalledWith({
      city: "Pune",
      isOpen: true,
    });
    expect(queryChain.skip).toHaveBeenCalledWith(5);
    expect(mockRedisSetEx).toHaveBeenCalledWith(
      expect.any(String),
      60,
      JSON.stringify(response.body),
    );
  });
});
