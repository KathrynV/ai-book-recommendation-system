import { recommendForExistingCustomer, recommendForNewCustomer } from "./recommend.js";

/**
 * CLI demo of the recommendation workflow:
 *   User -> AI Application -> MCP tools -> Customer/Transaction/Catalog data -> Recommendations
 *
 * This script calls the same tool functions the MCP server (src/mcp_server)
 * exposes, so it can run standalone without spinning up an MCP client/server
 * pair -- useful for a quick demo. See README for running it over real MCP.
 *
 * Usage:
 *   npm run demo:existing -- C002
 *   npm run demo:new -- --age 6 --interests dinosaurs,science
 */
async function main() {
  const [mode, ...rest] = process.argv.slice(2);

  if (mode === "existing") {
    const customerId = rest[0];
    if (!customerId) {
      console.error("Usage: npm run demo:existing -- <customer_id>");
      process.exit(1);
    }
    const { preferences, recommendations } = await recommendForExistingCustomer(customerId);
    console.log(`Customer ${customerId}`);
    console.log(`Preferences (from history): ${preferences.join(", ")}`);
    console.log("Recommended:");
    recommendations.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title} [${r.category}] (${r.book_id})`);
      console.log(`     ${r.reason}`);
    });
    return;
  }

  if (mode === "new") {
    const ageArgIdx = rest.indexOf("--age");
    const interestsArgIdx = rest.indexOf("--interests");
    const age = ageArgIdx >= 0 ? Number(rest[ageArgIdx + 1]) : NaN;
    const interests = interestsArgIdx >= 0 ? rest[interestsArgIdx + 1].split(",") : [];

    if (Number.isNaN(age) || interests.length === 0) {
      console.error("Usage: npm run demo:new -- --age <number> --interests <comma,separated,list>");
      process.exit(1);
    }

    const { ageGroup, recommendations } = await recommendForNewCustomer(age, interests);
    console.log(`New customer, age ${age} (age group ${ageGroup})`);
    console.log(`Interests: ${interests.join(", ")}`);
    console.log("Recommended:");
    recommendations.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title} [${r.category}] (${r.book_id})`);
      console.log(`     ${r.reason}`);
    });
    return;
  }

  console.error("Usage:\n  npm run demo:existing -- <customer_id>\n  npm run demo:new -- --age <n> --interests <a,b,c>");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
