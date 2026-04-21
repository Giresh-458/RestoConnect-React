const express = require("express");
const request = require("supertest");

const { registerGraphQLDocumentationRoutes } = require("../graphql/documentationRoutes");

describe("GraphQL documentation routes", () => {
  const createApp = () => {
    const app = express();
    registerGraphQLDocumentationRoutes(app);
    return app;
  };

  test("GET /graphql-docs.json returns a JSON model with public CORS access", async () => {
    const response = await request(createApp()).get("/graphql-docs.json");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("*");
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toEqual(
      expect.objectContaining({
        endpoint: "/graphql",
        graphiqlEndpoint: "/graphql",
        title: "RestoConnect GraphQL API",
      }),
    );
    expect(response.body.queries.map((query) => query.name)).toEqual([
      "publicRestaurants",
      "restaurantInventory",
    ]);
  });

  test("GET /graphql-docs returns the rendered HTML documentation page", async () => {
    const response = await request(createApp()).get("/graphql-docs");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toContain("RestoConnect GraphQL API");
    expect(response.text).toContain("Open GraphiQL");
    expect(response.text).toContain("publicRestaurants");
    expect(response.text).toContain("restaurantInventory");
    expect(response.text).toContain("/graphql-docs.json");
  });
});
