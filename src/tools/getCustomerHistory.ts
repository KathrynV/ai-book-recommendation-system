import { loadTransactions, loadBooks } from "../data.js";

export interface HistoryEntry {
  book_id: string;
  title: string;
  category: string;
  type: "borrow" | "purchase";
  date: string;
}

/**
 * Mock tool: returns a customer's past borrows/purchases with book details.
 * Production equivalent queries the store's order/transaction history.
 */
export function getCustomerHistory(customerId: string): HistoryEntry[] {
  const books = new Map(loadBooks().map((b) => [b.book_id, b]));
  return loadTransactions()
    .filter((t) => t.customer_id === customerId)
    .map((t) => {
      const book = books.get(t.book_id);
      return {
        book_id: t.book_id,
        title: book?.title ?? "Unknown title",
        category: book?.category ?? "Unknown",
        type: t.type,
        date: t.date,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
