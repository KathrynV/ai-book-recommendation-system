import { z } from "zod";
import { getProductBySku } from "../../src/catalog.js";

export const checkAvailabilityTool = {
  name: "check_availability",
  config: {
    title: "Check book availability",
    description:
      "Look up a single book by its exact SKU and report whether it's currently in stock, " +
      "and whether it's a for-sale or for-borrow (library) copy.",
    inputSchema: {
      sku: z.string().min(1).describe("Exact SKU, e.g. '9780010000001-L'"),
    },
  },
  handler: async ({ sku }) => {
    const product = await getProductBySku(sku);
    if (!product) {
      return { isError: true, content: [{ type: "text", text: `No book found for sku=${sku}.` }] };
    }
    return { content: [{ type: "text", text: JSON.stringify(product, null, 2) }] };
  },
};
