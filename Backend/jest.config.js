module.exports = {
  clearMocks: true,
  restoreMocks: true,
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "html", "lcov", "json-summary"],
  collectCoverageFrom: [
    "Controller/authController.js",
    "Controller/searchController.js",
    "Controller/customerController.js",
    "Model/PromoCode_model.js",
    "graphql/schema.js",
    "graphql/documentation.js",
    "graphql/documentationPage.js",
    "graphql/documentationRoutes.js",
  ],
};
