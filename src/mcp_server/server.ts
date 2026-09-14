#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchCustomer } from "../tools/searchCustomer.js";
import { searchBooks } from "../tools/searchBooks.js";
import { getCustomerHistory } from "../tools/getCustomerHistory.js";
import { checkInventory } from "../tools/checkInventory.js";

/**
 * Demo MCP server. Exposes the same tool surface as the production
 * server, but backed by the synthetic CSV files in /data instead of a
 * real database -- see .env.example / README for what changes in production
 * (DATABASE_URL + credentials swapped in, mock tools swapped for real queries).
 */
const server = new McpServer({
  name: "ai-book-recommendation-system-demo",
  version: "0.1.0",
});

server.registerTool(
  "search_customer",
  {
    title: "Search Customer",
    description: "Look up a customer by ID or age group in the demo dataset.",
    inputSchema: {
      customer_id: z.string().optional(),
      age_group: z.string().optional(),
    },
  },
  async ({ customer_id, age_group }) => ({
    content: [
      { type: "text", text: JSON.stringify(searchCustomer({ customer_id, age_group }), null, 2) },
    ],
  })
);

server.registerTool(
  "search_books",
  {
    title: "Search Books",
    description: "Search the demo catalog by category and/or age group.",
    inputSchema: {
      category: z.string().optional(),
      age_group: z.string().optional(),
      available_only: z.boolean().optional(),
    },
  },
  async ({ category, age_group, available_only }) => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(searchBooks({ category, age_group, available_only }), null, 2),
      },
    ],
  })
);

server.registerTool(
  "get_customer_history",
  {
    title: "Get Customer History",
    description: "Return a customer's past borrows/purchases from the demo dataset.",
    inputSchema: { customer_id: z.string() },
  },
  async ({ customer_id }) => ({
    content: [{ type: "text", text: JSON.stringify(getCustomerHistory(customer_id), null, 2) }],
  })
);

server.registerTool(
  "check_inventory",
  {
    title: "Check Inventory",
    description: "Check whether a specific book is currently available.",
    inputSchema: { book_id: z.string() },
  },
  async ({ book_id }) => ({
    content: [{ type: "text", text: JSON.stringify(checkInventory(book_id), null, 2) }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
