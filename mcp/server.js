#!/usr/bin/env node
// MCP server exposing this project's data-access layer (src/customers.js,
// src/catalog.js) as tools any MCP client (Claude Desktop, Claude Code, or
// another agent) can call directly — independent of the web app in
// server.js, which calls the same underlying functions but talks to Claude
// itself via direct API tool-use rather than acting as an MCP server.
// Reads the same synthetic demo-data/ as the web app; no real store, no
// real customer data.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { searchCustomersTool } from "./tools/searchCustomers.js";
import { getCustomerHistoryTool } from "./tools/getCustomerHistory.js";
import { searchCatalogTool } from "./tools/searchCatalog.js";
import { checkAvailabilityTool } from "./tools/checkAvailability.js";

const server = new McpServer({
  name: "ai-book-recommendation-system-mcp",
  version: "1.0.0",
});

for (const tool of [searchCustomersTool, getCustomerHistoryTool, searchCatalogTool, checkAvailabilityTool]) {
  server.registerTool(tool.name, tool.config, tool.handler);
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
