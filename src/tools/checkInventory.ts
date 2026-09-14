import { loadBooks } from "../data.js";

export interface InventoryStatus {
  book_id: string;
  title: string;
  available: boolean;
}

/**
 * Mock tool: checks whether a specific book is currently available.
 * Production equivalent queries live inventory availability.
 */
export function checkInventory(bookId: string): InventoryStatus | null {
  const book = loadBooks().find((b) => b.book_id === bookId);
  if (!book) return null;
  return { book_id: book.book_id, title: book.title, available: book.available };
}
