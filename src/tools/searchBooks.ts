import { loadBooks, type Book } from "../data.js";

export interface SearchBooksParams {
  category?: string;
  age_group?: string;
  available_only?: boolean;
}

/**
 * Mock tool: searches the demo book catalog.
 * Production equivalent queries the store's inventory/catalog table.
 */
export function searchBooks(params: SearchBooksParams = {}): Book[] {
  const { category, age_group, available_only = true } = params;
  return loadBooks().filter((b) => {
    if (category && b.category.toLowerCase() !== category.toLowerCase()) return false;
    if (age_group && b.age_group !== age_group) return false;
    if (available_only && !b.available) return false;
    return true;
  });
}
