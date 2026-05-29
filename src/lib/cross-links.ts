/**
 * Cross-linking between update pages and guide pages.
 * Kept in a separate module to avoid circular imports between updates.ts and guides.ts.
 */
import { getAllUpdates, type UpdateMeta } from "./updates";
import { getAllGuides, type GuideMeta } from "./guides";

// Tokenize a string into lowercase slug tokens (drop years + short words)
function tokens(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !/^\d{4}$/.test(t)); // drop 4-digit years
}

// Score: how many tokens from `a` appear in `b`
function matchScore(a: string[], b: string[]): number {
  return a.filter((t) => b.includes(t)).length;
}

/**
 * Find the best-matching guide page for a given update slug.
 * Returns null if no guide scores ≥ 1 common token.
 */
export function getRelatedGuideForUpdate(updateSlug: string): GuideMeta | null {
  const updates = getAllUpdates();
  const update = updates.find((u) => u.slug === updateSlug);
  if (!update) return null;

  const updateTokens = tokens(`${update.examName} ${update.organization}`);
  const guides = getAllGuides();

  let best: GuideMeta | null = null;
  let bestScore = 0;

  for (const guide of guides) {
    const guideTokens = tokens(`${guide.slug} ${guide.title}`);
    const score = matchScore(updateTokens, guideTokens);
    if (score > bestScore) {
      bestScore = score;
      best = guide;
    }
  }

  return bestScore >= 2 ? best : null;
}

/**
 * Find update pages relevant to a given guide slug.
 * Returns up to `limit` updates sorted by publishedDate desc.
 */
export function getRelatedUpdatesForGuide(guideSlug: string, limit = 4): UpdateMeta[] {
  const guides = getAllGuides();
  const guide = guides.find((g) => g.slug === guideSlug);
  if (!guide) return [];

  const guideTokens = tokens(`${guide.slug} ${guide.title}`);
  const updates = getAllUpdates();

  const scored = updates
    .map((u) => {
      const ut = tokens(`${u.examName} ${u.organization}`);
      return { update: u, score: matchScore(guideTokens, ut) };
    })
    .filter(({ score }) => score >= 2)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.update.publishedDate || "").localeCompare(a.update.publishedDate || "");
    });

  return scored.slice(0, limit).map(({ update }) => update);
}
