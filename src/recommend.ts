import { searchCustomer } from "./tools/searchCustomer.js";
import { searchBooks } from "./tools/searchBooks.js";
import { getCustomerHistory } from "./tools/getCustomerHistory.js";
import type { Book } from "./data.js";

export interface Recommendation {
  book_id: string;
  title: string;
  category: string;
  reason: string;
}

function ageToAgeGroup(age: number): string {
  if (age <= 5) return "3-5";
  if (age <= 7) return "5-7";
  if (age <= 10) return "8-10";
  return "11-13";
}

function topCategories(categories: string[], n = 3): string[] {
  const counts = new Map<string, number>();
  for (const c of categories) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([c]) => c);
}

function ruleBasedPick(
  candidates: Book[],
  preferredCategories: string[],
  n: number,
  reasonForMatch: (b: Book) => string,
  reasonFallback: string
): Recommendation[] {
  const lowerPrefs = preferredCategories.map((c) => c.toLowerCase());
  const scored = candidates
    .map((b) => ({ book: b, score: lowerPrefs.includes(b.category.toLowerCase()) ? 1 : 0 }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, n).map(({ book, score }) => ({
    book_id: book.book_id,
    title: book.title,
    category: book.category,
    reason: score > 0 ? reasonForMatch(book) : reasonFallback,
  }));
}

/**
 * Optional LLM reasoning pass: if ANTHROPIC_API_KEY is set, ask Claude to
 * pick and explain the final N picks from the candidate shortlist. Falls
 * back to the rule-based picks (above) when no key is configured, so the
 * demo runs fully offline with no credentials.
 */
async function refineWithClaude(
  context: string,
  candidates: Book[],
  fallback: Recommendation[],
  n: number
): Promise<Recommendation[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const prompt = `${context}\n\nCandidate books (JSON): ${JSON.stringify(
      candidates.map((b) => ({ book_id: b.book_id, title: b.title, category: b.category }))
    )}\n\nPick exactly ${n} books from the candidates above. Respond ONLY with a JSON array of ` +
      `{"book_id": string, "reason": string} where "reason" is a one-sentence, friendly explanation.`;

    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content.find((block) => block.type === "text")?.text ?? "";
    const picks: { book_id: string; reason: string }[] = JSON.parse(text);
    const byId = new Map(candidates.map((b) => [b.book_id, b]));

    return picks
      .map((p) => {
        const book = byId.get(p.book_id);
        if (!book) return null;
        return { book_id: book.book_id, title: book.title, category: book.category, reason: p.reason };
      })
      .filter((r): r is Recommendation => r !== null)
      .slice(0, n);
  } catch {
    return fallback;
  }
}

export async function recommendForExistingCustomer(
  customerId: string,
  n = 3
): Promise<{ preferences: string[]; recommendations: Recommendation[] }> {
  const [customer] = searchCustomer({ customer_id: customerId });
  if (!customer) throw new Error(`Unknown customer_id: ${customerId}`);

  const history = getCustomerHistory(customerId);
  const preferences = topCategories(history.map((h) => h.category));
  const readIds = new Set(history.map((h) => h.book_id));

  const candidates = searchBooks({ age_group: customer.age_group, available_only: true }).filter(
    (b) => !readIds.has(b.book_id)
  );

  const fallback = ruleBasedPick(
    candidates,
    preferences,
    n,
    (b) => `Matches this customer's interest in ${b.category.toLowerCase()}, based on past borrows/purchases.`,
    "Popular pick in this customer's age group that they haven't read yet."
  );

  const recommendations = await refineWithClaude(
    `Recommend books for an existing customer (age group ${customer.age_group}) whose past ` +
      `borrows/purchases show a preference for: ${preferences.join(", ")}. Exclude anything they've already had.`,
    candidates,
    fallback,
    n
  );

  return { preferences, recommendations };
}

export async function recommendForNewCustomer(
  age: number,
  interests: string[],
  n = 3
): Promise<{ ageGroup: string; recommendations: Recommendation[] }> {
  const ageGroup = ageToAgeGroup(age);
  const candidates = searchBooks({ age_group: ageGroup, available_only: true });

  const fallback = ruleBasedPick(
    candidates,
    interests,
    n,
    (b) => `Matches the stated interest in ${b.category.toLowerCase()}.`,
    `A well-reviewed title for readers age ${age}.`
  );

  const recommendations = await refineWithClaude(
    `Recommend books for a new customer, age ${age} (age group ${ageGroup}), interested in: ${interests.join(", ")}.`,
    candidates,
    fallback,
    n
  );

  return { ageGroup, recommendations };
}
