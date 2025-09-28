import { jest, describe, it, expect } from "@jest/globals";
import request from "supertest";
import { createApp } from "../src/app.js";
import { HttpStatusCodes } from "../src/constants/http-status-codes.js";

jest.mock("../src/lib/cache.js", () => ({
  cacheWithLock: jest.fn(async (_key, _ttl, work) => work()),
}));

describe("GET /repos/popularity - validation errors", () => {
  it(`${HttpStatusCodes.BAD_REQUEST} when language is missing or empty`, async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const res = await request(createApp())
      .get("/repos/popularity")
      .query({ created_after: "2024-01-01" })
      .expect(HttpStatusCodes.BAD_REQUEST);
    expect(res.body.error).toBe("Invalid query");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it(`${HttpStatusCodes.BAD_REQUEST} when created_after is not a valid ISO date`, async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const res = await request(createApp())
      .get("/repos/popularity")
      .query({ language: "TypeScript", created_after: "not-a-date" })
      .expect(HttpStatusCodes.BAD_REQUEST);
    expect(res.body.error).toBe("Invalid query");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it(`${HttpStatusCodes.BAD_REQUEST} when per_page is out of range`, async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const res = await request(createApp())
      .get("/repos/popularity")
      .query({
        language: "TypeScript",
        created_after: "2024-01-01",
        per_page: 1000,
      })
      .expect(HttpStatusCodes.BAD_REQUEST);
    expect(res.body.error).toBe("Invalid query");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
