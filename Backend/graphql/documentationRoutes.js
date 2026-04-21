const { buildGraphQLDocsModel } = require("./documentation");
const { renderGraphQLDocsPage } = require("./documentationPage");

const registerGraphQLDocumentationRoutes = (app) => {
  app.get("/graphql-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(buildGraphQLDocsModel());
  });

  app.get("/graphql-docs", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(renderGraphQLDocsPage(buildGraphQLDocsModel()));
  });
};

module.exports = {
  registerGraphQLDocumentationRoutes,
};
