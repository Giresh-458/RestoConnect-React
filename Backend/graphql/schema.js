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
  description: "A leftover menu item that can still be offered before it expires.",
  fields: {
    _id: { type: GraphQLID },
    itemName: {
      type: GraphQLNonNull(GraphQLString),
      description: "Display name of the leftover food item.",
    },
    quantity: {
      type: GraphQLFloat,
      description: "Remaining quantity available for the leftover item.",
    },
    expiryDate: {
      type: GraphQLString,
      description: "ISO timestamp after which the leftover should no longer be shown.",
    },
    createdAt: {
      type: GraphQLString,
      description: "ISO timestamp for when the leftover record was created.",
    },
  },
});

const InventoryItemType = new GraphQLObjectType({
  name: "InventoryItem",
  description: "A single inventory line item derived from a restaurant inventory snapshot.",
  fields: {
    _id: { type: GraphQLID },
    id: { type: GraphQLID },
    name: {
      type: GraphQLNonNull(GraphQLString),
      description: "Human-readable inventory item name.",
    },
    quantity: {
      type: GraphQLFloat,
      description: "Current stock level for the item.",
    },
    unit: {
      type: GraphQLString,
      description: "Measurement unit used for the quantity value.",
    },
    supplier: {
      type: GraphQLString,
      description: "Supplier name when one is stored for the item.",
    },
    minStock: {
      type: GraphQLFloat,
      description: "Configured minimum stock threshold for low-stock warnings.",
    },
    status: {
      type: GraphQLString,
      description: "Computed inventory state such as Available, Low Stock, or Out of Stock.",
    },
    isLowStock: {
      type: GraphQLBoolean,
      description: "True when quantity is above zero but at or below the minimum threshold.",
    },
    isOutOfStock: {
      type: GraphQLBoolean,
      description: "True when the quantity has reached zero or lower.",
    },
    rest_id: {
      type: GraphQLID,
      description: "Restaurant identifier associated with the inventory item.",
    },
  },
});

const RestaurantInventoryType = new GraphQLObjectType({
  name: "RestaurantInventory",
  description: "Inventory summary for a restaurant along with computed stock flags.",
  fields: {
    restaurantId: {
      type: GraphQLNonNull(GraphQLID),
      description: "Unique identifier of the restaurant that owns this inventory snapshot.",
    },
    restaurantName: {
      type: GraphQLNonNull(GraphQLString),
      description: "Restaurant display name.",
    },
    city: {
      type: GraphQLString,
      description: "City where the restaurant operates.",
    },
    lowStockCount: {
      type: GraphQLFloat,
      description: "Number of inventory items currently flagged as low stock.",
    },
    outOfStockCount: {
      type: GraphQLFloat,
      description: "Number of inventory items currently out of stock.",
    },
    inventory: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(InventoryItemType))),
      description: "Expanded inventory rows for the selected restaurant.",
    },
  },
});

const RestaurantType = new GraphQLObjectType({
  name: "Restaurant",
  description: "Public restaurant information exposed through GraphQL queries.",
  fields: {
    _id: { type: GraphQLID },
    id: {
      type: GraphQLID,
      description: "Restaurant identifier mirrored from the database _id field.",
      resolve: (parent) => parent._id,
    },
    name: {
      type: GraphQLNonNull(GraphQLString),
      description: "Restaurant display name.",
    },
    city: {
      type: GraphQLString,
      description: "City where the restaurant is located.",
    },
    image: {
      type: GraphQLString,
      description: "Primary restaurant image URL or relative asset path.",
    },
    leftovers: {
      type: new GraphQLList(LeftoverType),
      description: "Non-expired leftovers sorted by nearest expiry time.",
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
  description: "Root query operations available in the RestoConnect GraphQL API.",
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
        restId: {
          type: GraphQLID,
          description:
            "Optional restaurant identifier. Required for admin or employee accounts without a default restaurant.",
        },
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
