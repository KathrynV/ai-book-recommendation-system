import { z } from "zod";
import { resolveCustomer } from "../../src/customers.js";

export const searchCustomersTool = {
  name: "search_customers",
  config: {
    title: "Search customers",
    description:
      "Look up a customer by name, email, or phone number in the demo dataset. " +
      "Returns matching customer records (id, name, email, phone) — zero, one, or " +
      "several if the name is ambiguous.",
    inputSchema: {
      query: z.string().min(1).describe("Customer name, email, or phone number"),
    },
  },
  handler: async ({ query }) => {
    const matches = await resolveCustomer(query);
    return { content: [{ type: "text", text: JSON.stringify(matches, null, 2) }] };
  },
};
