const {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} = require("graphql");
const { Restaurant } = require("../Model/Restaurents_model");
const { User } = require("../Model/userRoleModel");
const { verifyToken, AUTH_TOKEN_COOKIE } = require("../util/jwtHelper");

const INVENTORY_ROLES = new Set(["owner", "staff", "admin", "employee"]);

const toIsoString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const buildInventoryItems = (restaurant) => {
  const inventoryData = restaurant?.inventoryData || {};
  const labels = Array.isArray(inventoryData.labels) ? inventoryData.labels : [];
  const values = Array.isArray(inventoryData.values) ? inventoryData.values : [];
  const units = Array.isArray(inventoryData.units) ? inventoryData.units : [];
  const suppliers = Array.isArray(inventoryData.suppliers) ? inventoryData.suppliers : [];
  const minStocks = Array.isArray(inventoryData.minStocks) ? inventoryData.minStocks : [];

  return labels.map((name, index) => {
    const quantity = Number(values[index] || 0);
    const minStock = Number(minStocks[index] || 0);

    let status = "Available";
    if (quantity <= 0) {
      status = "Out of Stock";
    } else if (quantity <= minStock) {
      status = "Low Stock";
    }

    return {
      _id: `item_${index}`,
      id: `item_${index}`,
      name,
      quantity,
      unit: units[index] || "pieces",
      supplier: suppliers[index] || "",
      minStock,
      status,
      isLowStock: quantity > 0 && quantity <= minStock,
      isOutOfStock: quantity <= 0,
      rest_id: restaurant?._id ? String(restaurant._id) : null,
    };
  });
};

const resolveGraphQLAuth = async (req) => {
  let user = null;
  let token = req.cookies?.[AUTH_TOKEN_COOKIE];

  if (!token) {
    const header = req.headers?.authorization || req.headers?.Authorization;
    if (header && /^Bearer\s+/i.test(header)) {
      token = header.replace(/^Bearer\s+/i, "").trim();
    }
  }

  if (token) {
    const payload = verifyToken(token);
    if (payload?.username) {
      user = await User.findOne({ username: payload.username }).select("username role rest_id");
    }
  }

  if (!user && req.session?.username) {
    const sessionExpired =
      req.session.cookie?._expires &&
      new Date(req.session.cookie._expires) <= new Date();

    if (!sessionExpired) {
      user = await User.findOne({ username: req.session.username }).select("username role rest_id");
    }
  }

  if (!user) {
    return null;
  }

  return {
    username: user.username,
    role: user.role,
    rest_id: user.rest_id ? String(user.rest_id) : null,
  };
};

const ensureInventoryAccess = (auth, requestedRestId) => {
  if (!auth) {
    throw new Error("Authentication required for restaurantInventory");
  }

  if (!INVENTORY_ROLES.has(auth.role)) {
    throw new Error("Forbidden: inventory is available only to owner, staff, admin, or employee roles");
  }

  const requested = requestedRestId ? String(requestedRestId) : "";

  if (auth.role === "owner" || auth.role === "staff") {
    if (!auth.rest_id) {
      throw new Error("Authenticated user is not linked to a restaurant");
    }
    if (requested && requested !== auth.rest_id) {
      throw new Error("Forbidden: you can only access inventory for your assigned restaurant");
    }
    return auth.rest_id;
  }

  if (requested) {
    return requested;
  }

  if (auth.rest_id) {
    return auth.rest_id;
  }

  throw new Error("restId is required for this account");
};

const LeftoverType = new GraphQLObjectType({
  name: "Leftover",
  fields: {
    _id: { type: GraphQLID },
    itemName: { type: GraphQLNonNull(GraphQLString) },
    quantity: { type: GraphQLFloat },
    expiryDate: { type: GraphQLString },
    createdAt: { type: GraphQLString },
  },
});

const InventoryItemType = new GraphQLObjectType({
  name: "InventoryItem",
  fields: {
    _id: { type: GraphQLID },
    id: { type: GraphQLID },
    name: { type: GraphQLNonNull(GraphQLString) },
    quantity: { type: GraphQLFloat },
    unit: { type: GraphQLString },
    supplier: { type: GraphQLString },
    minStock: { type: GraphQLFloat },
    status: { type: GraphQLString },
    isLowStock: { type: GraphQLBoolean },
    isOutOfStock: { type: GraphQLBoolean },
    rest_id: { type: GraphQLID },
  },
});

const RestaurantInventoryType = new GraphQLObjectType({
  name: "RestaurantInventory",
  fields: {
    restaurantId: { type: GraphQLNonNull(GraphQLID) },
    restaurantName: { type: GraphQLNonNull(GraphQLString) },
    city: { type: GraphQLString },
    lowStockCount: { type: GraphQLFloat },
    outOfStockCount: { type: GraphQLFloat },
    inventory: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(InventoryItemType))) },
  },
});

const RestaurantType = new GraphQLObjectType({
  name: "Restaurant",
  fields: {
    _id: { type: GraphQLID },
    id: {
      type: GraphQLID,
      resolve: (parent) => parent._id,
    },
    name: { type: GraphQLNonNull(GraphQLString) },
    city: { type: GraphQLString },
    image: { type: GraphQLString },
    leftovers: {
      type: new GraphQLList(LeftoverType),
      resolve: (parent) => {
        if (!parent.leftovers || parent.leftovers.length === 0) return [];

        return parent.leftovers
          .filter((item) => item.expiryDate && new Date(item.expiryDate) > new Date())
          .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
          .map((item) => ({
            _id: item._id?.toString(),
            itemName: item.itemName,
            quantity: item.quantity,
            expiryDate: toIsoString(item.expiryDate),
            createdAt: toIsoString(item.createdAt),
          }));
      },
    },
  },
});

const RootQueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    publicRestaurants: {
      type: new GraphQLList(RestaurantType),
      description: "Get all restaurants with their non-expired leftover items (public, no auth)",
      async resolve() {
        const restaurants = await Restaurant.find({})
          .select("_id name city image leftovers")
          .lean();

        return restaurants.map((restaurant) => ({
          ...restaurant,
          _id: String(restaurant._id),
        }));
      },
    },
    restaurantInventory: {
      type: RestaurantInventoryType,
      description:
        "Get inventory for the authenticated restaurant. Owner/staff use their own restaurant automatically; admin/employee may pass restId.",
      args: {
        restId: { type: GraphQLID },
      },
      async resolve(_source, { restId }, context) {
        const effectiveRestId = ensureInventoryAccess(context?.auth, restId);
        const restaurant = await Restaurant.findById(effectiveRestId)
          .select("_id name city inventoryData")
          .lean();

        if (!restaurant) {
          throw new Error("Restaurant not found");
        }

        const inventory = buildInventoryItems(restaurant);
        return {
          restaurantId: String(restaurant._id),
          restaurantName: restaurant.name,
          city: restaurant.city || null,
          lowStockCount: inventory.filter((item) => item.isLowStock).length,
          outOfStockCount: inventory.filter((item) => item.isOutOfStock).length,
          inventory,
        };
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: RootQueryType,
});

const createGraphQLOptions = async (req) => ({
  schema,
  graphiql: true,
  context: {
    req,
    auth: await resolveGraphQLAuth(req),
  },
});

module.exports = {
  buildInventoryItems,
  createGraphQLOptions,
  resolveGraphQLAuth,
  schema,
};
