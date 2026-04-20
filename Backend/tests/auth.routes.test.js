const request = require("supertest");

const mockUserFindOne = jest.fn();
const mockUserSave = jest.fn();
const mockPersonSave = jest.fn();
const mockPasswordResetCodeSave = jest.fn();
const mockCompare = jest.fn();
const mockSignToken = jest.fn();
const mockVerifyToken = jest.fn();
const mockSendPasswordResetCode = jest.fn();
const mockGetAuthCookieOptions = jest.fn(() => ({ httpOnly: true }));
const mockGetClearCookieOptions = jest.fn(() => ({ httpOnly: true }));

const MockUser = jest.fn(function MockUser(data) {
  Object.assign(this, data);
  this.save = mockUserSave;
});
MockUser.findOne = mockUserFindOne;

const MockPerson = jest.fn(function MockPerson(data) {
  Object.assign(this, data);
  this.save = mockPersonSave;
});
MockPerson.findOne = jest.fn();

const MockPasswordResetCode = jest.fn(function MockPasswordResetCode(data) {
  Object.assign(this, data);
  this.save = mockPasswordResetCodeSave;
});
MockPasswordResetCode.findOne = jest.fn();
MockPasswordResetCode.updateMany = jest.fn();

jest.mock("../Model/userRoleModel", () => ({
  User: MockUser,
}));

jest.mock("../Model/customer_model", () => MockPerson);

jest.mock("../Model/PasswordResetCode_model", () => ({
  PasswordResetCode: MockPasswordResetCode,
}));

jest.mock("bcrypt", () => ({
  compare: mockCompare,
}));

jest.mock("../util/fileUpload", () => ({
  getProfilePicUrl: jest.fn((req, filename) =>
    filename ? `http://localhost/${filename}` : null,
  ),
}));

jest.mock("../util/emailService", () => ({
  sendPasswordResetCode: mockSendPasswordResetCode,
}));

jest.mock("../util/jwtHelper", () => ({
  AUTH_TOKEN_COOKIE: "authToken",
  signToken: mockSignToken,
  verifyToken: mockVerifyToken,
}));

jest.mock("../util/cookies", () => ({
  getAuthCookieOptions: mockGetAuthCookieOptions,
  getClearCookieOptions: mockGetClearCookieOptions,
}));

const { createTestApp } = require("./helpers/createTestApp");
const authController = require("../Controller/authController");

const app = createTestApp((testApp) => {
  testApp.post("/api/auth/login", authController.login);
  testApp.post("/api/auth/signup", authController.signup);
  testApp.get("/api/auth/check-session", authController.checkSession);
});

beforeEach(() => {
  jest.clearAllMocks();
  MockUser.mockClear();
  MockPerson.mockClear();
  MockPasswordResetCode.mockClear();
});

describe("Authentication routes", () => {
  test("POST /api/auth/login returns an auth cookie for valid credentials", async () => {
    mockUserFindOne.mockResolvedValue({
      username: "alice",
      role: "customer",
      password: "hashed-password",
      isSuspended: false,
    });
    mockCompare.mockResolvedValue(true);
    mockSignToken.mockReturnValue("signed.jwt.token");

    const response = await request(app).post("/api/auth/login").send({
      username: "alice",
      password: "secret1",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      valid: true,
      role: "customer",
      username: "alice",
      message: "Login successful",
    });
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("authToken=signed.jwt.token")]),
    );
    expect(mockSignToken).toHaveBeenCalledWith({
      username: "alice",
      role: "customer",
    });
  });

  test("POST /api/auth/login rejects incomplete credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      username: "alice",
      password: "",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      valid: false,
      error: "Username and password are required",
    });
  });

  test("POST /api/auth/signup creates a customer account", async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockPersonSave.mockResolvedValue(undefined);
    mockUserSave.mockResolvedValue(undefined);

    const response = await request(app).post("/api/auth/signup").send({
      username: "new_customer",
      email: "customer@example.com",
      password: "secret1",
      fullName: "New Customer",
      mobile: "9876543210",
      role: "customer",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      message: "Account created successfully. Please login.",
      username: "new_customer",
    });
    expect(MockPerson).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "new_customer",
        email: "customer@example.com",
        phone: "9876543210",
      }),
    );
    expect(MockUser).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "new_customer",
        email: "customer@example.com",
        role: "customer",
      }),
    );
  });

  test("GET /api/auth/check-session returns the current user from the auth cookie", async () => {
    const select = jest.fn().mockResolvedValue({ role: "customer" });
    mockVerifyToken.mockReturnValue({ username: "alice" });
    mockUserFindOne.mockReturnValue({ select });

    const response = await request(app)
      .get("/api/auth/check-session")
      .set("Cookie", ["authToken=valid-token"]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      valid: true,
      username: "alice",
      role: "customer",
    });
    expect(select).toHaveBeenCalledWith("role");
  });
});
