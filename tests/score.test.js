import { describe, it, expect } from "@jest/globals";
import { popularityScore, recencyDecay } from "../src/lib/score.js";

describe("recencyDecay", () => {
  it("is 1 for 'now", () => {
    const now = new Date().toISOString();
    const res = recencyDecay(now);
    expect(res).toBeCloseTo(1.0, 6);
  });
});

describe("popularityScore", () => {
  it("increases with stars and forks", () => {
    const base = popularityScore({ stargazers_count: 0, forks_count: 0, updated_at: new Date().toISOString() });
    const moreStars = popularityScore({ stargazers_count: 100, forks_count: 0, updated_at: new Date().toISOString() });
    const moreForks = popularityScore({ stargazers_count: 0, forks_count: 100, updated_at: new Date().toISOString() });

    expect(moreStars).toBeGreaterThan(base);
    expect(moreForks).toBeGreaterThan(base);
  });

  it("rewards recency", () => {
    const recent = popularityScore({ stargazers_count: 5, forks_count: 3, updated_at: new Date().toISOString() });
    const stale = popularityScore({ stargazers_count: 5, forks_count: 3, updated_at: "2019-01-01T00:00:00Z" });
    expect(recent).toBeGreaterThan(stale);
  });
});
