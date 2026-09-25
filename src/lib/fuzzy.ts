import type { Task } from "./types.ts";

/**
 * Normalizes Persian and English text by converting letter variants,
 * removing Arabic diacritics, zero-width non-joiners, and normalizing digits.
 */
export function normalizeText(input: string): string {
  if (!input) return "";

  return (
    input
      .toLowerCase()
      // Convert Arabic/Persian letter variants
      .replace(/[ي]/g, "ی")
      .replace(/[ك]/g, "ک")
      .replace(/[ةۀ]/g, "ه")
      .replace(/[ؤ]/g, "و")
      .replace(/[إأآٱ]/g, "ا")
      // Remove Zero-Width Non-Joiner and invisible chars
      .replace(/[\u200C\u200B\u200E\u200F\u00A0\uFEFF]/g, " ")
      // Remove Persian/Arabic vowel diacritics (Tanwin, Tashdid, Sukun, Fatha, Damma, Kasra)
      .replace(/[\u064B-\u065F\u0670]/g, "")
      // Convert Persian & Arabic numbers to standard English digits
      .replace(/[۰٠]/g, "0")
      .replace(/[۱١]/g, "1")
      .replace(/[۲٢]/g, "2")
      .replace(/[۳٣]/g, "3")
      .replace(/[۴٤]/g, "4")
      .replace(/[۵٥]/g, "5")
      .replace(/[۶٦]/g, "6")
      .replace(/[۷٧]/g, "7")
      .replace(/[۸٨]/g, "8")
      .replace(/[۹٩]/g, "9")
      // Collapse multiple spaces
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Calculates a fuzzy match score between target text and search query.
 * Returns a score > 0 if matched (higher is better match), or 0 if no match.
 */
export function fuzzyScore(target: string, query: string): number {
  const normTarget = normalizeText(target);
  const normQuery = normalizeText(query);

  if (!normQuery) return 1;
  if (!normTarget) return 0;

  // 1. Exact match
  if (normTarget === normQuery) {
    return 1000;
  }

  // 2. Starts with query
  if (normTarget.startsWith(normQuery)) {
    return 800 + (normQuery.length / normTarget.length) * 100;
  }

  // 3. Substring match
  const subIndex = normTarget.indexOf(normQuery);
  if (subIndex !== -1) {
    return 500 - subIndex * 10 + (normQuery.length / normTarget.length) * 100;
  }

  // 4. Token-based matching (all query words present in target)
  const queryTokens = normQuery.split(" ").filter(Boolean);
  if (queryTokens.length > 1) {
    const allTokensMatch = queryTokens.every((token) => normTarget.includes(token));
    if (allTokensMatch) {
      return 400 + queryTokens.length * 20;
    }
  }

  // 5. Sequential character fuzzy match (supports typos and abbreviations)
  let qIdx = 0;
  let score = 0;
  let consecutiveMatches = 0;
  let prevMatchIdx = -1;

  for (let tIdx = 0; tIdx < normTarget.length; tIdx++) {
    if (normTarget[tIdx] === normQuery[qIdx]) {
      // Bonus for consecutive matches
      consecutiveMatches++;
      score += 10 + consecutiveMatches * 5;

      // Bonus for match at start of word
      if (tIdx === 0 || normTarget[tIdx - 1] === " ") {
        score += 15;
      }

      // Penalty for distance from previous matched char
      if (prevMatchIdx !== -1) {
        const gap = tIdx - prevMatchIdx - 1;
        score -= Math.min(gap * 2, 20);
      }

      prevMatchIdx = tIdx;
      qIdx++;

      if (qIdx === normQuery.length) {
        // Query fully matched!
        return Math.max(score, 10);
      }
    } else {
      consecutiveMatches = 0;
    }
  }

  return 0;
}

/**
 * Searches and scores a task against a search query.
 */
export function scoreTask(task: Task, query: string): number {
  if (!query.trim()) return 1;

  let totalScore = 0;

  // Title match (highest weight)
  const titleScore = fuzzyScore(task.title, query);
  if (titleScore > 0) {
    totalScore += titleScore * 3;
  }

  // Description match
  if (task.description) {
    const descScore = fuzzyScore(task.description, query);
    if (descScore > 0) {
      totalScore += descScore * 1.5;
    }
  }

  // Tags & Scoped Facets match
  if (task.tags && task.tags.length > 0) {
    const cleanQuery = query.replace(/^#/, "");
    for (const rawTag of task.tags) {
      const cleanTag = rawTag.replace(/^#/, "");
      let tagScore = fuzzyScore(cleanTag, cleanQuery);

      // If scoped tag (e.g. "key:value"), also match against value part directly
      if (cleanTag.includes(":")) {
        const parts = cleanTag.split(":");
        const valScore = fuzzyScore(parts[1], cleanQuery);
        const keyScore = fuzzyScore(parts[0], cleanQuery);
        tagScore = Math.max(tagScore, valScore, keyScore * 0.8);
      }

      if (tagScore > 0) {
        totalScore += tagScore * 2.5;
      }
    }
  }

  // Priority match
  const priorityTerms: Record<string, string[]> = {
    high: ["فوری", "مهم", "ضروری", "urgent", "high", "p1", "!فوری", "!urgent"],
    medium: ["متوسط", "medium", "med", "p2", "!متوسط", "!medium"],
    low: ["کم", "پایین", "low", "p3", "!کم", "!low"],
  };

  const normQ = normalizeText(query);
  const taskPriority = task.priority || "none";
  if (taskPriority in priorityTerms) {
    if (priorityTerms[taskPriority].some((term) => normQ.includes(normalizeText(term)))) {
      totalScore += 150;
    }
  }

  return totalScore;
}

/**
 * Filters and ranks tasks using Persian & English fuzzy search.
 */
export function fuzzySearchTasks(tasks: Task[], query: string): Task[] {
  const trimmed = query.trim();
  if (!trimmed) return tasks;

  const scored = tasks
    .map((task) => ({ task, score: scoreTask(task, trimmed) }))
    .filter((item) => item.score > 0);

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  return scored.map((item) => item.task);
}
