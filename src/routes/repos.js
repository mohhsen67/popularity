import { Router } from "express";
import { querySchema } from "../schemas/query.schema.js";
import { env } from "../config/env.js";
import { cacheWithLock } from "../lib/cache.js";
import { popularityScore } from "../lib/score.js";
import { HttpStatusCodes } from "../constants/http-status-codes.js";

const router = Router();

router.get("/popularity", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: "Invalid query", details: parsed.error.flatten() });
  }
  const { language, created_after, per_page, page, q } = parsed.data;

  const githubQ = [
    `language:${language}`,
    `created:>=${created_after}`,
    q ? `${q}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const searchParams = new URLSearchParams({
    q: githubQ,
    sort: "updated",
    order: "desc",
    per_page: String(per_page),
    page: String(page),
  });

  const cacheKey = `gh:${searchParams.toString()}`;

  try {
    const payload = await cacheWithLock(
      cacheKey,
      env.CACHE_TTL_SECONDS,
      async () => {
        const headers = {
          Accept: "application/vnd.github+json",
          "User-Agent": "gh-popularity-challenge",
        };
        if (env.GITHUB_TOKEN)
          headers["Authorization"] = `Bearer ${env.GITHUB_TOKEN}`;

        const ghResp = await fetch(
          `https://api.github.com/search/repositories?${searchParams}`,
          { headers }
        );

        if (!ghResp.ok) {
          const body = await ghResp.json().catch(() => ({}));
          const err = new Error("GitHub API error");
          err.status = ghResp.status;
          err.details = body;
          throw err;
        }

        const data = await ghResp.json();

        const items = (data.items || [])
          .map((r) => ({
            id: r.id,
            name: r.name,
            full_name: r.full_name,
            html_url: r.html_url,
            description: r.description,
            language: r.language,
            topics: r.topics,
            stargazers_count: r.stargazers_count,
            forks_count: r.forks_count,
            updated_at: r.updated_at,
            created_at: r.created_at,
            watchers_count: r.watchers_count,
            open_issues_count: r.open_issues_count,
            score: popularityScore(r),
          }))
          .sort((a, b) => b.score - a.score);

        return {
          query: { language, created_after, per_page, page, q: q || "" },
          result_count: items.length,
          items,
        };
      }
    );

    return res.json(payload);
  } catch (err) {
    const status = err?.status ?? HttpStatusCodes.INTERNAL_SERVER_ERROR;
    const details = err?.details ?? String(err);
    return res.status(status).json({ error: "Upstream error", details });
  }
});

export default router;
