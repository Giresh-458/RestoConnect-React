const {
  GraphQLList,
  GraphQLNonNull,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isUnionType,
} = require("graphql");
const { schema } = require("./schema");

const BUILT_IN_TYPE_NAMES = new Set(["String", "Boolean", "Float", "Int", "ID"]);

const QUERY_DOC_METADATA = {
  publicRestaurants: {
    auth: "Public query",
    exampleTitle: "Discover restaurants with active leftovers",
    exampleQuery: `query PublicRestaurants {
  publicRestaurants {
    id
    name
    city
    leftovers {
      itemName
      quantity
      expiryDate
    }
  }
}`,
  },
  restaurantInventory: {
    auth: "Requires owner, staff, admin, or employee authentication",
    exampleTitle: "Inspect inventory for a restaurant",
    exampleQuery: `query RestaurantInventory($restId: ID) {
  restaurantInventory(restId: $restId) {
    restaurantId
    restaurantName
    lowStockCount
    outOfStockCount
    inventory {
      id
      name
      quantity
      unit
      status
      isLowStock
      isOutOfStock
    }
  }
}`,
  },
};

const TYPE_KIND_ORDER = {
  Object: 0,
  Input: 1,
  Enum: 2,
  Interface: 3,
  Union: 4,
  Scalar: 5,
};

const unwrapGraphQLType = (type) => {
  if (type instanceof GraphQLNonNull) {
    const inner = unwrapGraphQLType(type.ofType);
    return {
      ...inner,
      label: `${inner.label}!`,
      required: true,
    };
  }

  if (type instanceof GraphQLList) {
    const inner = unwrapGraphQLType(type.ofType);
    return {
      ...inner,
      label: `[${inner.label}]`,
      isList: true,
    };
  }

  return {
    label: type.name,
    namedType: type.name,
    required: false,
    isList: false,
  };
};

const getTypeKind = (type) => {
  if (isObjectType(type)) return "Object";
  if (isInputObjectType(type)) return "Input";
  if (isEnumType(type)) return "Enum";
  if (isInterfaceType(type)) return "Interface";
  if (isUnionType(type)) return "Union";
  if (isScalarType(type)) return "Scalar";
  return "Other";
};

const sortByName = (left, right) => left.name.localeCompare(right.name);

const buildArgumentDoc = (argument) => {
  const typeInfo = unwrapGraphQLType(argument.type);

  return {
    name: argument.name,
    description: argument.description || "",
    type: typeInfo.label,
    namedType: typeInfo.namedType,
    required: typeInfo.required,
    defaultValue: argument.defaultValue ?? null,
  };
};

const buildFieldDoc = (fieldName, field) => {
  const typeInfo = unwrapGraphQLType(field.type);

  return {
    name: fieldName,
    description: field.description || "",
    type: typeInfo.label,
    namedType: typeInfo.namedType,
    arguments: (field.args || []).map(buildArgumentDoc).sort(sortByName),
  };
};

const buildInputFieldDoc = (fieldName, field) => {
  const typeInfo = unwrapGraphQLType(field.type);

  return {
    name: fieldName,
    description: field.description || "",
    type: typeInfo.label,
    namedType: typeInfo.namedType,
  };
};

const shouldDocumentType = (typeName, type, rootQueryName) => {
  if (!type || typeName.startsWith("__")) {
    return false;
  }

  if (typeName === rootQueryName) {
    return false;
  }

  if (BUILT_IN_TYPE_NAMES.has(typeName)) {
    return false;
  }

  return (
    isObjectType(type) ||
    isInputObjectType(type) ||
    isEnumType(type) ||
    isInterfaceType(type) ||
    isUnionType(type) ||
    isScalarType(type)
  );
};

const buildTypeDoc = (typeName, type) => {
  const kind = getTypeKind(type);

  let fields = [];
  let enumValues = [];

  if (typeof type.getFields === "function") {
    const rawFields = type.getFields();
    const fieldEntries = Object.entries(rawFields);

    fields = fieldEntries
      .map(([fieldName, field]) =>
        isInputObjectType(type) ? buildInputFieldDoc(fieldName, field) : buildFieldDoc(fieldName, field),
      )
      .sort(sortByName);
  }

  if (isEnumType(type)) {
    enumValues = type
      .getValues()
      .map((value) => ({
        name: value.name,
        description: value.description || "",
      }))
      .sort(sortByName);
  }

  return {
    name: typeName,
    kind,
    description: type.description || "",
    fields,
    enumValues,
  };
};

const buildQueryDoc = (fieldName, field) => {
  const typeInfo = unwrapGraphQLType(field.type);
  const metadata = QUERY_DOC_METADATA[fieldName] || {};

  return {
    name: fieldName,
    description: field.description || "",
    auth: metadata.auth || "Uses endpoint-level auth rules",
    exampleTitle: metadata.exampleTitle || `Example query for ${fieldName}`,
    exampleQuery: metadata.exampleQuery || `query {\n  ${fieldName}\n}`,
    returnType: typeInfo.label,
    arguments: (field.args || []).map(buildArgumentDoc).sort(sortByName),
  };
};

const buildGraphQLDocsModel = (targetSchema = schema) => {
  const queryType = targetSchema.getQueryType();
  const queryFields = queryType ? queryType.getFields() : {};
  const queryName = queryType ? queryType.name : "";

  const queries = Object.entries(queryFields)
    .map(([fieldName, field]) => buildQueryDoc(fieldName, field))
    .sort(sortByName);

  const types = Object.entries(targetSchema.getTypeMap())
    .filter(([typeName, type]) => shouldDocumentType(typeName, type, queryName))
    .map(([typeName, type]) => buildTypeDoc(typeName, type))
    .sort((left, right) => {
      const leftOrder = TYPE_KIND_ORDER[left.kind] ?? 999;
      const rightOrder = TYPE_KIND_ORDER[right.kind] ?? 999;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return left.name.localeCompare(right.name);
    });

  return {
    title: "RestoConnect GraphQL API",
    endpoint: "/graphql",
    docsJsonEndpoint: "/graphql-docs.json",
    graphiqlEndpoint: "/graphql",
    swaggerEndpoint: "/api-docs",
    overview:
      "Schema-driven GraphQL reference generated from the live backend schema. Use GraphiQL for execution and this page for a readable map of queries, arguments, and types.",
    authNotes: [
      "publicRestaurants is available without authentication.",
      "restaurantInventory accepts either the existing auth cookie or an Authorization: Bearer <jwt> header.",
      "State-changing REST calls still use the CSRF flow documented in Swagger.",
    ],
    queries,
    types,
  };
};

module.exports = {
  QUERY_DOC_METADATA,
  buildGraphQLDocsModel,
  unwrapGraphQLType,
};
