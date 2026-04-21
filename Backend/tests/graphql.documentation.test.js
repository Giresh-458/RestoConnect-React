const { GraphQLID, GraphQLList, GraphQLNonNull } = require("graphql");

const { schema } = require("../graphql/schema");
const {
  QUERY_DOC_METADATA,
  buildGraphQLDocsModel,
  unwrapGraphQLType,
} = require("../graphql/documentation");

describe("GraphQL documentation model", () => {
  test("unwrapGraphQLType preserves list and required modifiers", () => {
    expect(unwrapGraphQLType(new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID))))).toEqual({
      isList: true,
      label: "[ID!]!",
      namedType: "ID",
      required: true,
    });
  });

  test("buildGraphQLDocsModel exposes endpoint metadata and auth notes", () => {
    const docs = buildGraphQLDocsModel(schema);

    expect(docs.title).toBe("RestoConnect GraphQL API");
    expect(docs.endpoint).toBe("/graphql");
    expect(docs.docsJsonEndpoint).toBe("/graphql-docs.json");
    expect(docs.graphiqlEndpoint).toBe("/graphql");
    expect(docs.swaggerEndpoint).toBe("/api-docs");
    expect(docs.authNotes).toEqual(
      expect.arrayContaining([
        expect.stringContaining("publicRestaurants"),
        expect.stringContaining("Authorization: Bearer <jwt>"),
      ]),
    );
  });

  test("buildGraphQLDocsModel includes query metadata from the live schema", () => {
    const docs = buildGraphQLDocsModel(schema);
    const queries = Object.fromEntries(docs.queries.map((query) => [query.name, query]));

    expect(Object.keys(queries)).toEqual(["publicRestaurants", "restaurantInventory"]);
    expect(queries.publicRestaurants.auth).toBe(QUERY_DOC_METADATA.publicRestaurants.auth);
    expect(queries.publicRestaurants.exampleQuery).toContain("leftovers");
    expect(queries.restaurantInventory.auth).toBe(QUERY_DOC_METADATA.restaurantInventory.auth);
    expect(queries.restaurantInventory.arguments).toEqual([
      expect.objectContaining({
        description: expect.stringContaining("Optional restaurant identifier"),
        name: "restId",
        required: false,
        type: "ID",
      }),
    ]);
  });

  test("buildGraphQLDocsModel includes object types but filters built-in GraphQL types", () => {
    const docs = buildGraphQLDocsModel(schema);
    const typeNames = docs.types.map((type) => type.name);

    expect(typeNames).toEqual(
      expect.arrayContaining([
        "InventoryItem",
        "Leftover",
        "Restaurant",
        "RestaurantInventory",
      ]),
    );
    expect(typeNames).not.toContain("Query");
    expect(typeNames).not.toContain("String");
  });

  test("type details include field descriptions and nested argument metadata", () => {
    const docs = buildGraphQLDocsModel(schema);
    const restaurantType = docs.types.find((type) => type.name === "Restaurant");
    const inventoryType = docs.types.find((type) => type.name === "RestaurantInventory");

    expect(restaurantType.description).toContain("Public restaurant information");
    expect(restaurantType.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          description: expect.stringContaining("Restaurant display name"),
          name: "name",
          type: "String!",
        }),
        expect.objectContaining({
          description: expect.stringContaining("Non-expired leftovers"),
          name: "leftovers",
          type: "[Leftover]",
        }),
      ]),
    );
    expect(inventoryType.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          description: expect.stringContaining("low stock"),
          name: "lowStockCount",
          type: "Float",
        }),
        expect.objectContaining({
          description: expect.stringContaining("Expanded inventory rows"),
          name: "inventory",
          type: "[InventoryItem!]!",
        }),
      ]),
    );
  });
});
