const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * This function returns a number between 0 and 1 that says how “fresh” a repo is. If a repo was updated today,
 * it gets close to 1. As days pass, the number smoothly shrinks (about half after 14 days by default).
 * Newer work gets a bigger bonus.
 * @param {string} updatedAtISO - ISO timestamp (e.g. "2025-08-20T12:34:56Z")
 * @param {number} [halfLifeDays=14]
 * @returns {number}
 */
export function recencyDecay(updatedAtISO, halfLifeDays = 14) {
  const updatedAt = new Date(updatedAtISO).getTime();
  const now = Date.now();
  const days = Math.max(0, (now - updatedAt) / MS_PER_DAY);
  return Math.exp(-Math.log(2) * days / halfLifeDays);
}

/**
 * This function makes one simple score by mixing three things: how many stars a repo has, how many forks it has,
 * and how recently it was updated. Stars and forks help, but the more recent the activity, the bigger the boost.
 * Higher score = more popular and active.
 * @param {{stargazers_count: number, forks_count: number, updated_at: string}} repo
 *   Signals: total stars, total forks, and last update timestamp (ISO 8601).
 * @returns {number} Score (higher = more popular/active), rounded to 6 decimals.
 */
export function popularityScore({ stargazers_count, forks_count, updated_at }) {
  const wStars = 1.0;
  const wForks = 0.8;
  const wRecency = 3.0;

  const starsTerm = wStars * Math.log1p(stargazers_count);
  const forksTerm = wForks * Math.log1p(forks_count);
  const recencyTerm = wRecency * recencyDecay(updated_at);

  return Number((starsTerm + forksTerm + recencyTerm).toFixed(6));
}
