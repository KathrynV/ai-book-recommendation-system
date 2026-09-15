import { z } from "zod";
import { getRecentOrderHistory } from "../../src/customers.js";

export const getCustomerHistoryTool = {
  name: "get_customer_history",
  config: {
    title: "Get customer order/borrow history",
    description:
      "Fetch a customer's past order/borrow history by customer id, deduplicated to " +
      "{name, sku} per title — no pricing, address, or other PII.",
    inputSchema: {
      customerId: z.string().min(1).describe("Customer id, e.g. 'C001'"),
    },
  },
  handler: async ({ customerId }) => {
    const history = await getRecentOrderHistory(customerId);
    return { content: [{ type: "text", text: JSON.stringify(history, null, 2) }] };
  },
};
