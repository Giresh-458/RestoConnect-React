const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderArgumentList = (argumentsList = []) => {
  if (argumentsList.length === 0) {
    return '<p class="docs-empty">No arguments.</p>';
  }

  return `
    <div class="docs-argument-list">
      ${argumentsList
        .map(
          (argument) => `
            <article class="docs-subcard">
              <div class="docs-inline-heading">
                <span class="docs-name">${escapeHtml(argument.name)}</span>
                <span class="docs-chip">${escapeHtml(argument.type)}</span>
              </div>
              <p>${escapeHtml(argument.description || "No description provided yet.")}</p>
              ${
                argument.defaultValue !== null
                  ? `<p class="docs-meta-line">Default: <code>${escapeHtml(
                      JSON.stringify(argument.defaultValue),
                    )}</code></p>`
                  : ""
              }
            </article>
          `,
        )
        .join("")}
    </div>
  `;
};

const renderFieldList = (fields = []) => {
  if (fields.length === 0) {
    return '<p class="docs-empty">No fields documented for this type.</p>';
  }

  return `
    <div class="docs-field-list">
      ${fields
        .map(
          (field) => `
            <article class="docs-subcard">
              <div class="docs-inline-heading">
                <span class="docs-name">${escapeHtml(field.name)}</span>
                <span class="docs-chip">${escapeHtml(field.type)}</span>
              </div>
              <p>${escapeHtml(field.description || "No description provided yet.")}</p>
              ${
                field.arguments && field.arguments.length > 0
                  ? `
                    <div class="docs-inline-section">
                      <h4>Arguments</h4>
                      ${renderArgumentList(field.arguments)}
                    </div>
                  `
                  : ""
              }
            </article>
          `,
        )
        .join("")}
    </div>
  `;
};

const renderEnumValues = (enumValues = []) => {
  if (enumValues.length === 0) {
    return "";
  }

  return `
    <div class="docs-inline-section">
      <h4>Values</h4>
      <div class="docs-argument-list">
        ${enumValues
          .map(
            (entry) => `
              <article class="docs-subcard">
                <div class="docs-inline-heading">
                  <span class="docs-name">${escapeHtml(entry.name)}</span>
                </div>
                <p>${escapeHtml(entry.description || "No description provided yet.")}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
};

const renderGraphQLDocsPage = (docs) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(docs.title)}</title>
    <style>
      :root {
        --bg: #f5efe6;
        --panel: rgba(255, 252, 246, 0.9);
        --panel-strong: #fffdf8;
        --ink: #14213d;
        --muted: #5b6472;
        --accent: #e76f51;
        --accent-deep: #c8553d;
        --teal: #1f7a8c;
        --border: rgba(20, 33, 61, 0.12);
        --shadow: 0 18px 45px rgba(20, 33, 61, 0.1);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        color: var(--ink);
        font-family: "Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(231, 111, 81, 0.18), transparent 26rem),
          radial-gradient(circle at top right, rgba(31, 122, 140, 0.16), transparent 24rem),
          linear-gradient(180deg, #f6f0e8 0%, #f1e7da 48%, #f8f5ef 100%);
      }

      a {
        color: inherit;
      }

      .docs-shell {
        width: min(1180px, calc(100% - 2rem));
        margin: 0 auto;
        padding: 2rem 0 4rem;
      }

      .docs-hero {
        padding: 2rem;
        border: 1px solid var(--border);
        border-radius: 28px;
        background: linear-gradient(145deg, rgba(255, 253, 248, 0.95), rgba(255, 247, 239, 0.82));
        box-shadow: var(--shadow);
      }

      .docs-eyebrow {
        margin: 0 0 0.75rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        font-size: 0.74rem;
        color: var(--teal);
        font-weight: 700;
      }

      .docs-hero h1 {
        margin: 0;
        font-size: clamp(2.1rem, 4vw, 3.4rem);
        line-height: 1;
      }

      .docs-lead {
        max-width: 58rem;
        margin: 1rem 0 0;
        color: var(--muted);
        font-size: 1.02rem;
        line-height: 1.7;
      }

      .docs-actions,
      .docs-summary-grid,
      .docs-query-grid,
      .docs-type-grid {
        display: grid;
        gap: 1rem;
      }

      .docs-actions {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        margin-top: 1.5rem;
      }

      .docs-action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 3.25rem;
        padding: 0.9rem 1rem;
        border-radius: 16px;
        text-decoration: none;
        font-weight: 700;
        border: 1px solid transparent;
        transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
      }

      .docs-action:hover {
        transform: translateY(-2px);
      }

      .docs-action.primary {
        background: linear-gradient(135deg, var(--accent), var(--accent-deep));
        color: #fffaf5;
        box-shadow: 0 12px 25px rgba(231, 111, 81, 0.25);
      }

      .docs-action.secondary {
        background: rgba(255, 255, 255, 0.72);
        border-color: var(--border);
      }

      .docs-section {
        margin-top: 1.75rem;
      }

      .docs-summary-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .docs-card,
      .docs-query-card,
      .docs-type-card,
      .docs-subcard {
        border: 1px solid var(--border);
        background: var(--panel);
        border-radius: 22px;
        box-shadow: var(--shadow);
      }

      .docs-card,
      .docs-query-card,
      .docs-type-card {
        padding: 1.3rem;
      }

      .docs-card h2,
      .docs-section h2 {
        margin: 0 0 0.8rem;
      }

      .docs-card p,
      .docs-query-card p,
      .docs-type-card p,
      .docs-subcard p,
      .docs-list li {
        color: var(--muted);
        line-height: 1.65;
      }

      .docs-list {
        margin: 0;
        padding-left: 1.1rem;
      }

      .docs-query-grid,
      .docs-type-grid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }

      .docs-inline-heading {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.65rem;
        margin-bottom: 0.7rem;
      }

      .docs-name {
        font-size: 1.08rem;
        font-weight: 800;
      }

      .docs-chip {
        display: inline-flex;
        align-items: center;
        min-height: 1.7rem;
        padding: 0.1rem 0.65rem;
        border-radius: 999px;
        background: rgba(31, 122, 140, 0.12);
        color: var(--teal);
        font-size: 0.82rem;
        font-weight: 700;
      }

      .docs-meta-line {
        margin: 0.45rem 0 0;
        font-size: 0.92rem;
      }

      .docs-inline-section {
        margin-top: 1rem;
      }

      .docs-inline-section h4 {
        margin: 0 0 0.7rem;
      }

      .docs-argument-list,
      .docs-field-list {
        display: grid;
        gap: 0.8rem;
      }

      .docs-subcard {
        padding: 1rem;
        background: var(--panel-strong);
      }

      .docs-code {
        margin: 0;
        padding: 1rem;
        border-radius: 18px;
        overflow-x: auto;
        background: #102033;
        color: #f8f1e8;
        font-family: "Cascadia Code", "Fira Code", Consolas, monospace;
        font-size: 0.9rem;
        line-height: 1.6;
      }

      .docs-empty {
        margin: 0;
        color: var(--muted);
      }

      @media (max-width: 720px) {
        .docs-shell {
          width: min(100% - 1rem, 100%);
          padding-top: 1rem;
        }

        .docs-hero {
          padding: 1.35rem;
          border-radius: 22px;
        }
      }
    </style>
  </head>
  <body>
    <main class="docs-shell">
      <section class="docs-hero">
        <p class="docs-eyebrow">Live GraphQL Reference</p>
        <h1>${escapeHtml(docs.title)}</h1>
        <p class="docs-lead">${escapeHtml(docs.overview)}</p>
        <div class="docs-actions">
          <a class="docs-action primary" href="${escapeHtml(docs.graphiqlEndpoint)}">Open GraphiQL</a>
          <a class="docs-action secondary" href="${escapeHtml(docs.swaggerEndpoint)}">Open Swagger</a>
          <a class="docs-action secondary" href="${escapeHtml(docs.docsJsonEndpoint)}">View JSON model</a>
        </div>
      </section>

      <section class="docs-section docs-summary-grid">
        <article class="docs-card">
          <h2>Endpoint</h2>
          <p>All GraphQL operations execute through <code>${escapeHtml(docs.endpoint)}</code>.</p>
        </article>
        <article class="docs-card">
          <h2>Authentication</h2>
          <ul class="docs-list">
            ${docs.authNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
          </ul>
        </article>
      </section>

      <section class="docs-section">
        <h2>Queries</h2>
        <div class="docs-query-grid">
          ${docs.queries
            .map(
              (query) => `
                <article class="docs-query-card">
                  <div class="docs-inline-heading">
                    <span class="docs-name">${escapeHtml(query.name)}</span>
                    <span class="docs-chip">${escapeHtml(query.returnType)}</span>
                  </div>
                  <p>${escapeHtml(query.description || "No description provided yet.")}</p>
                  <p class="docs-meta-line"><strong>Auth:</strong> ${escapeHtml(query.auth)}</p>
                  <div class="docs-inline-section">
                    <h4>Arguments</h4>
                    ${renderArgumentList(query.arguments)}
                  </div>
                  <div class="docs-inline-section">
                    <h4>${escapeHtml(query.exampleTitle)}</h4>
                    <pre class="docs-code"><code>${escapeHtml(query.exampleQuery)}</code></pre>
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>

      <section class="docs-section">
        <h2>Types</h2>
        <div class="docs-type-grid">
          ${docs.types
            .map(
              (type) => `
                <article class="docs-type-card">
                  <div class="docs-inline-heading">
                    <span class="docs-name">${escapeHtml(type.name)}</span>
                    <span class="docs-chip">${escapeHtml(type.kind)}</span>
                  </div>
                  <p>${escapeHtml(type.description || "No description provided yet.")}</p>
                  ${renderEnumValues(type.enumValues)}
                  <div class="docs-inline-section">
                    <h4>Fields</h4>
                    ${renderFieldList(type.fields)}
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    </main>
  </body>
</html>`;

module.exports = {
  renderGraphQLDocsPage,
};
