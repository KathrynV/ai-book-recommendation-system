import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Demonstrates the actual MCP protocol round trip: spawns src/mcp_server/server.ts
 * as a child process and talks to it over stdio, the same way Claude Desktop or
 * any other MCP client would -- rather than importing the tool functions directly
 * (as src/demo.ts does for convenience).
 *
 * Usage: npm run mcp-client-demo
 */
async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", path.join(__dirname, "mcp_server", "server.ts")],
  });

  const client = new Client({ name: "mcp-client-demo", version: "0.1.0" });
  await client.connect(transport);

  const { tools } = await client.listTools();
  console.log(
    "Tools exposed by the MCP server:",
    tools.map((t) => t.name)
  );

  function firstText(result: Awaited<ReturnType<typeof client.callTool>>): string {
    const content = result.content as { type: string; text?: string }[];
    return content[0]?.text ?? "";
  }

  console.log("\n--- call: get_customer_history(customer_id=C002) ---");
  const history = await client.callTool({
    name: "get_customer_history",
    arguments: { customer_id: "C002" },
  });
  console.log(firstText(history));

  console.log("--- call: search_books(category=Dinosaurs, age_group=5-7) ---");
  const books = await client.callTool({
    name: "search_books",
    arguments: { category: "Dinosaurs", age_group: "5-7" },
  });
  console.log(firstText(books));

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
