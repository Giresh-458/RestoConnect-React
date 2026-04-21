const mockRestaurantFind = jest.fn();
const mockRestaurantFindById = jest.fn();
const mockUserFindOne = jest.fn();
const mockVerifyToken = jest.fn();

jest.mock("../Model/Restaurents_model", () => ({
  Restaurant: {
    find: mockRestaurantFind,
    findById: mockRestaurantFindById,
  },
}));

jest.mock("../Model/userRoleModel", () => ({
  User: {
    findOne: mockUserFindOne,
  },
}));

jest.mock("../util/jwtHelper", () => ({
  AUTH_TOKEN_COOKIE: "authToken",
  verifyToken: mockVerifyToken,
}));

const { createGraphQLOptions, resolveGraphQLAuth } = require("../graphql/schema");

describe("GraphQL authentication helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("resolveGraphQLAuth authenticates from a bearer token", async () => {
    const select = jest.fn().mockResolvedValue({
      username: "owner1",
      role: "owner",
      rest_id: "rest-88",
    });

    mockVerifyToken.mockReturnValue({ username: "owner1" });
    mockUserFindOne.mockReturnValue({ select });

    const auth = await resolveGraphQLAuth({
      cookies: {},
      headers: {
        authorization: "Bearer signed.jwt.token",
      },
    });

    expect(mockVerifyToken).toHaveBeenCalledWith("signed.jwt.token");
    expect(mockUserFindOne).toHaveBeenCalledWith({ username: "owner1" });
    expect(select).toHaveBeenCalledWith("username role rest_id");
    expect(auth).toEqual({
      username: "owner1",
      role: "owner",
      rest_id: "rest-88",
    });
  });

  test("resolveGraphQLAuth falls back to the active session when no token is present", async () => {
    const select = jest.fn().mockResolvedValue({
      username: "staff1",
      role: "staff",
      rest_id: "rest-22",
    });

    mockUserFindOne.mockReturnValue({ select });

    const auth = await resolveGraphQLAuth({
      cookies: {},
      headers: {},
      session: {
        username: "staff1",
        cookie: {
          _expires: new Date(Date.now() + 60 * 1000).toISOString(),
        },
      },
    });

    expect(mockVerifyToken).not.toHaveBeenCalled();
    expect(mockUserFindOne).toHaveBeenCalledWith({ username: "staff1" });
    expect(auth).toEqual({
      username: "staff1",
      role: "staff",
      rest_id: "rest-22",
    });
  });

  test("resolveGraphQLAuth returns null for expired sessions or unknown users", async () => {
    mockUserFindOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const auth = await resolveGraphQLAuth({
      cookies: {},
      headers: {},
      session: {
        username: "staff1",
        cookie: {
          _expires: new Date(Date.now() - 60 * 1000).toISOString(),
        },
      },
    });

    expect(mockUserFindOne).not.toHaveBeenCalled();
    expect(auth).toBeNull();
  });

  test("createGraphQLOptions enables GraphiQL and includes the resolved auth context", async () => {
    const select = jest.fn().mockResolvedValue({
      username: "admin1",
      role: "admin",
      rest_id: "rest-55",
    });

    mockVerifyToken.mockReturnValue({ username: "admin1" });
    mockUserFindOne.mockReturnValue({ select });

    const req = {
      cookies: {
        authToken: "cookie.jwt.token",
      },
      headers: {},
    };

    const options = await createGraphQLOptions(req);

    expect(options.graphiql).toBe(true);
    expect(options.schema).toBeDefined();
    expect(options.context).toEqual({
      auth: {
        username: "admin1",
        role: "admin",
        rest_id: "rest-55",
      },
      req,
    });
  });
});
