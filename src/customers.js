// Customer + order-history lookups.
//
// This is a portfolio demo: it reads synthetic data from demo-data/*.json
// rather than talking to a real store's API. In production this module
// would call the store's actual customer/order endpoints (with real auth) —
// the interface (resolveCustomer, getRecentOrderHistory) stays the same
// either way, which is the point: recommend.js and server.js don't need to
// know or care which one is backing them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "demo-data");

const customers = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "customers.json"), "utf8"));
const transactions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "transactions.json"), "utf8"));
const books = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "books.json"), "utf8"));
const bookById = new Map(books.map((b) => [b.id, b]));

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

// Statuses that don't mean "the customer had this book" — a cancelled/failed
// order, an abandoned checkout draft, or a gift-certificate line item.
const EXCLUDED_STATUSES = new Set(["cancelled", "failed", "refunded", "checkout-draft"]);

function toCustomerSummary(c) {
  return { id: c.id, name: c.name, email: c.email, phone: c.phone ?? null };
}

// Resolves free-text input (name, email, or phone) to one or more matching
// customers. Email gets an exact-match lookup; anything else gets a fuzzy
// name/phone match.
export async function resolveCustomer(query) {
  const trimmed = query.trim();
  const digits = trimmed.replace(/\D/g, "");

  let matches;
  if (EMAIL_PATTERN.test(trimmed)) {
    matches = customers.filter((c) => c.email.toLowerCase() === trimmed.toLowerCase());
  } else if (digits.length >= 7) {
    matches = customers.filter((c) => (c.phone || "").replace(/\D/g, "").includes(digits));
  } else {
    const needle = trimmed.toLowerCase();
    matches = customers.filter((c) => c.name.toLowerCase().includes(needle));
  }

  return matches.map(toCustomerSummary);
}

// Fetches a customer's order history, resolved from transaction rows
// (customerId + bookId + status) to deduplicated {name, sku} line items —
// mirrors what a real order API would return (title + SKU only, no
// pricing/address/PII beyond what's needed to profile reading preferences).
export async function getRecentOrderHistory(customerId) {
  const lineItems = [];
  for (const tx of transactions) {
    if (tx.customerId !== customerId) continue;
    if (EXCLUDED_STATUSES.has(tx.status)) continue;
    const book = bookById.get(tx.bookId);
    if (!book) continue;
    lineItems.push({ name: book.title, sku: book.sku });
  }

  const seen = new Map();
  for (const item of lineItems) {
    const key = `${item.sku ?? ""}|${item.name}`;
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}
