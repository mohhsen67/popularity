import { jest, describe, it, expect, afterEach } from "@jest/globals";
import request from "supertest";
import { createApp } from "../src/app.js";
import { HttpStatusCodes } from "../src/constants/http-status-codes.js";

jest.mock("../src/lib/cache.js", () => ({
  cacheWithLock: jest.fn(async (_key, _ttl, work) => work()),
}));

afterEach(() => {
  jest.restoreAllMocks();
});

describe("GET /repos/popularity (happy path)", () => {
  it("returns scored repos and basic shape; hits GitHub once", async () => {
    const app = createApp();

    const mockItems = [
      {
        id: 1,
        name: "repo-a",
        full_name: "acme/repo-a",
        html_url: "https://github.com/acme/repo-a",
        description: "A",
        language: "TypeScript",
        topics: ["cli"],
        stargazers_count: 10,
        forks_count: 2,
        updated_at: new Date().toISOString(),
        created_at: "2025-01-01T00:00:00Z",
        watchers_count: 10,
        open_issues_count: 0
      },
      {
        id: 2,
        name: "repo-b",
        full_name: "acme/repo-b",
        html_url: "https://github.com/acme/repo-b",
        description: "B",
        language: "TypeScript",
        topics: [],
        stargazers_count: 1,
        forks_count: 0,
        updated_at: new Date().toISOString(),
        created_at: "2025-01-02T00:00:00Z",
        watchers_count: 1,
        open_issues_count: 0
      }
    ];

    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ items: mockItems }), {
          status: HttpStatusCodes.OK,
          headers: { "Content-Type": "application/json" }
        })
      );

    const qs = { language: "TypeScript", created_after: "2024-01-01", per_page: 5, page: 1 };
    const res = await request(app).get("/repos/popularity").query(qs).expect(HttpStatusCodes.OK);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(res.body).toHaveProperty("items");
    expect(res.body.result_count).toBe(res.body.items.length);
    expect(res.body.items[0]).toHaveProperty("score");

    const scores = res.body.items.map(it => it.score);
    const isDesc = scores.every((s, i, arr) => i === 0 || s <= arr[i - 1]);
    expect(isDesc).toBe(true);
  });
});
