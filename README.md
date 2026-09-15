# AI-Powered Book Recommendation System

An AI-powered recommendation application designed for a real-world bookstore and lending-library environment.

The system combines customer transaction history, reading preferences, catalog metadata, and current inventory availability to generate personalized book recommendations.

The original application was built and tested in an operational environment containing 1,500+ registered customers and 3,500+ titles. This public portfolio version uses synthetic data and contains no customer information, production credentials, proprietary endpoints, or confidential business data.

## Business Problem

Selecting personalized books manually from a catalog of thousands of titles requires staff to consider multiple factors:

- previous purchases and borrowing history
- reading preferences
- age and reading level
- topics and interests
- previous selections
- current inventory availability

The goal of this project was to turn that multi-step manual process into a structured AI-assisted workflow.

## Solution

I designed and built an application that combines operational data retrieval, filtering logic, inventory checks, and AI-assisted recommendation generation.

For an existing customer, the system:

1. Retrieves the customer profile.
2. Analyzes previous purchases and borrowing history.
3. Identifies reading preferences.
4. Searches the current catalog.
5. Excludes previously selected titles.
6. Checks current availability.
7. Generates three personalized recommendations.

For a new customer, the system:

1. Collects age or reading level.
2. Collects topics and interests.
3. Searches available inventory.
4. Identifies relevant titles.
5. Generates three personalized recommendations.

## Business Scale

The original application was designed and tested against an operational environment with:

- 1,500+ registered customers
- 3,500+ catalog titles
- historical transaction data
- live inventory information

The tested workflow can generate three personalized, availability-aware recommendations in approximately five minutes.

## Architecture

```
User (browser)
  ↓
Web application (Node.js HTTP server)
  ↓
Recommendation engine (src/recommend.js)
  ↓
Data access layer (src/customers.js, src/catalog.js)
  ↓
Customer / transaction / catalog data
  ↓
Claude — Anthropic Messages API (tool-use for structured output)
  ↓
Personalized recommendations
```

The public portfolio version uses synthetic JSON data while preserving the same data-access architecture used by the original application. This allows the recommendation logic to be demonstrated without exposing production systems or proprietary data.

A notable design detail: topic search is driven by the catalog's category structure, not literal title-word matching — a request for books about a theme finds titles that are genuinely about that theme even when the theme's name never appears in the title (see `src/recommend.js` and the "war" example in `demo-data/books.json`, where most matching titles don't contain the word).

## MCP Server

`mcp/` exposes the same data-access layer as a set of tools over the [Model Context Protocol](https://modelcontextprotocol.io) — independent of the web app, and usable by any MCP client (Claude Desktop, Claude Code, or another agent), not just this project's own UI:

```
mcp/
├── server.js
└── tools/
    ├── searchCustomers.js       — look up a customer by name, email, or phone
    ├── getCustomerHistory.js    — fetch a customer's order/borrow history
    ├── searchCatalog.js         — literal or category-based thematic search
    └── checkAvailability.js     — check a single book's stock/availability by SKU
```

Run it:

```bash
npm run mcp-server
```

It speaks MCP over stdio, so it's meant to be launched by an MCP client rather than run standalone — point Claude Desktop's or Claude Code's MCP config at `node mcp/server.js` in this repo, or connect to it programmatically with `@modelcontextprotocol/sdk`'s client. Same synthetic `demo-data/` as the web app; no real store, no real customer data.

## Technologies

- JavaScript / Node.js (no framework — plain `node:http`)
- Anthropic Claude API, using tool-use for schema-validated structured output
- Model Context Protocol (MCP) server exposing reusable, independently-callable tools
- Structured data filtering: category/theme matching, age-band filtering, deduplication against prior history
- Inventory/availability validation
- HTML / CSS / JavaScript (vanilla, no frontend framework)

## Getting Started

```bash
git clone https://github.com/KathrynV/ai-book-recommendation-system.git
cd ai-book-recommendation-system
cp .env.example .env
# either set ANTHROPIC_API_KEY in .env, or leave it blank and paste a key into the form each time
npm start
```

Then open http://localhost:3000. Try it with the bundled synthetic customers:

| Try searching for...            | Demonstrates                                                        |
| -------------------------------- | -------------------------------------------------------------------- |
| `Priya Chandra`                  | Series completism — she's partway through two series                |
| `Marcus Doyle`                   | Thematic search — his history is all "War & Conflict" adult fiction  |
| `Alex Rivera`                    | Disambiguation — two different people share this name                |
| `Jordan Kim`                     | The empty-history state (no transactions on file)                    |
| New customer, age "adult", topic "war" | Thematic catalog search with age-band filtering, no history needed |

## Privacy & Security

This repository is a sanitized portfolio version of a real-world application.

It does not contain:

- real customer information
- transaction histories
- production database credentials
- API keys
- production endpoints
- proprietary business data

All demonstration data is synthetic.

## Project Status

The original application has been built and tested and is being prepared for integration into daily operational workflows.

## What I Built

My work on the project included:

- identifying the business problem and defining the workflow
- designing the recommendation logic
- connecting AI workflows to operational data
- developing custom data-retrieval modules
- filtering previously selected titles
- validating inventory availability
- designing workflows for both existing and new customers
- testing the end-to-end recommendation process

## Future Development

Potential next steps include:

- operational rollout
- recommendation acceptance tracking
- employee time-savings measurement
- recommendation conversion analysis
- improved recommendation ranking
- dashboard reporting for recommendation performance

## License

MIT — see [LICENSE](LICENSE).
