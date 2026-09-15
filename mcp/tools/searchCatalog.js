import { z } from "zod";
import { searchProducts, searchCategories, searchProductsInCategory } from "../../src/catalog.js";

export const searchCatalogTool = {
  name: "search_catalog",
  config: {
    title: "Search catalog",
    description:
      "Search the book catalog either by literal title/author text, or by theme/category. " +
      "Thematic mode finds books genuinely about a topic even when that word never appears " +
      "in the title (it matches the catalog's category taxonomy, not the title string).",
    inputSchema: {
      query: z.string().min(1).describe("Search text: title, author, or a theme/topic"),
      mode: z
        .enum(["text", "theme"])
        .default("text")
        .describe("'text' = literal title/author match; 'theme' = category-based thematic match"),
    },
  },
  handler: async ({ query, mode }) => {
    if (mode === "theme") {
      const categories = await searchCategories(query);
      const results = [];
      for (const cat of categories.slice(0, 3)) {
        const { products } = await searchProductsInCategory({ categoryId: cat.id, perPage: 20 });
        results.push(...products);
      }
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    }
    const { products } = await searchProducts({ query, perPage: 20 });
    return { content: [{ type: "text", text: JSON.stringify(products, null, 2) }] };
  },
};
