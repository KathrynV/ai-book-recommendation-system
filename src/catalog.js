// Catalog search — categories, age bands, and product lookups.
//
// Portfolio demo: reads synthetic data from demo-data/books.json. In
// production this module would call the store's real catalog API instead —
// recommend.js only depends on the functions exported here (searchProducts,
// searchCategories, getAgeTerms, searchProductsInCategory, getProductBySku),
// not on how they're implemented, so swapping the backing store is a
// contained change.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "demo-data");

const books = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "books.json"), "utf8"));

// Derived once at load time: every distinct category name in the catalog,
// assigned a stable id — stands in for a real catalog's category taxonomy
// (e.g. a WooCommerce product-category endpoint).
const categoryIndex = [...new Set(books.flatMap((b) => b.categories))].map((name, i) => ({
  id: i + 1,
  name,
  count: books.filter((b) => b.categories.includes(name)).length,
}));

// Stands in for a real catalog's age/reading-level attribute terms.
const AGE_TERMS = [
  { id: 1, name: "Toddler", slug: "toddler" },
  { id: 2, name: "Early Reader", slug: "early-reader" },
  { id: 3, name: "Middle Grade", slug: "middle-grade" },
  { id: 4, name: "Young Adult", slug: "young-adult" },
  { id: 5, name: "Adult", slug: "adult" },
];
const ageSlugByGroup = new Map(AGE_TERMS.map((t) => [t.name, t.slug]));

export function toCandidate(book) {
  return {
    id: book.id,
    sku: book.sku,
    title: book.title,
    authors: book.authors,
    categories: book.categories,
    ageGroup: book.ageGroup,
    availability: book.availability,
    inStock: book.inStock,
    price: book.price,
    currency: book.currency,
    permalink: book.permalink,
  };
}

// Literal text search against title/author — a stand-in for a real
// catalog's basic keyword search endpoint.
export async function searchProducts({ query, perPage = 10 }) {
  const needle = query.toLowerCase();
  const products = books
    .filter((b) => b.title.toLowerCase().includes(needle) || b.authors.some((a) => a.toLowerCase().includes(needle)))
    .slice(0, perPage);
  return { products, total: products.length, totalPages: 1 };
}

// Fuzzy-matches a theme/topic against the catalog's category list — this is
// what makes topic search thematic rather than a literal title/description
// text match, which would miss any book "about" a theme that doesn't happen
// to name it in the title (see README for a worked example).
export async function searchCategories(query, perPage = 5) {
  const needle = query.toLowerCase();
  return categoryIndex.filter((c) => c.name.toLowerCase().includes(needle)).slice(0, perPage);
}

export async function getAgeTerms() {
  return AGE_TERMS;
}

export async function searchProductsInCategory({ categoryId, ageSlug, perPage = 15 }) {
  const category = categoryIndex.find((c) => c.id === categoryId);
  if (!category) return { products: [] };
  const products = books
    .filter((b) => b.categories.includes(category.name))
    .filter((b) => !ageSlug || ageSlugByGroup.get(b.ageGroup) === ageSlug)
    .slice(0, perPage);
  return { products };
}

export async function getProductBySku(sku) {
  return books.find((b) => b.sku === sku) ?? null;
}
