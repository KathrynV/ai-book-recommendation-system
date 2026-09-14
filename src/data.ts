import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, "..", "data");

export interface Customer {
  customer_id: string;
  age_group: string;
}

export interface Book {
  book_id: string;
  title: string;
  category: string;
  age_group: string;
  available: boolean;
}

export interface Transaction {
  transaction_id: string;
  customer_id: string;
  book_id: string;
  type: "borrow" | "purchase";
  date: string;
}

function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h.trim()] = (cells[i] ?? "").trim()));
    return row;
  });
}

function load(file: string): Record<string, string>[] {
  const raw = readFileSync(path.join(DATA_DIR, file), "utf-8");
  return parseCsv(raw);
}

/**
 * Demo data source: local CSV files under /data. In production this layer
 * reads from the store's database instead -- the tool interfaces above it
 * (src/tools/*) stay the same either way.
 */
export function loadCustomers(): Customer[] {
  return load("customers.csv").map((r) => ({
    customer_id: r.customer_id,
    age_group: r.age_group,
  }));
}

export function loadBooks(): Book[] {
  return load("books.csv").map((r) => ({
    book_id: r.book_id,
    title: r.title,
    category: r.category,
    age_group: r.age_group,
    available: r.available.toLowerCase() === "true",
  }));
}

export function loadTransactions(): Transaction[] {
  return load("transactions.csv").map((r) => ({
    transaction_id: r.transaction_id,
    customer_id: r.customer_id,
    book_id: r.book_id,
    type: r.type as "borrow" | "purchase",
    date: r.date,
  }));
}
