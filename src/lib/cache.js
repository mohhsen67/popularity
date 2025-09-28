import { createClient } from "redis";
import { env } from "../config/env.js";

let client;
async function getRedis() {
  if (!client) {
    client = createClient({ url: env.REDIS_URL });
    client.on("error", (err) => console.error("[redis] error:", err));
    await client.connect();
  }
  return client;
}

/**
 * Get a cached JSON value, or compute it once across all instances using a Redis lock.
 * Flow: try GET → on MISS, first caller acquires SET NX lock for `lockMs`, runs `work`,
 * stores JSON with TTL `ttlSeconds`, releases lock; others poll every `pollMs` until value appears,
 * then return it. If lock expires with no value, it retries the whole flow.
 *
 * @template T
 * @param {string} key            Cache key (stable/deterministic).
 * @param {number} ttlSeconds     TTL for the cached value, in seconds.
 * @param {() => Promise<T>} work Async producer to compute the value on cache miss.
 * @param {number} [lockMs=10000] Lock lifetime in milliseconds (>= worst-case `work()` time).
 * @param {number} [pollMs=100]   Follower poll interval in milliseconds while waiting.
 * @returns {Promise<T>}          The cached or newly computed value.
 */
export async function cacheWithLock(
  key,
  ttlSeconds,
  work,
  lockMs = 10_000,
  pollMs = 100
) {
  const redis = await getRedis();

  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit);

  const lockKey = `lock:${key}`;
  const ok = await redis.set(lockKey, "1", { NX: true, PX: lockMs });

  if (ok === "OK") {
    try {
      const value = await work();
      await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return value;
    } finally {
      await redis.del(lockKey);
    }
  }

  const deadline = Date.now() + lockMs;
  while (Date.now() < deadline) {
    const raw = await redis.get(key);
    if (raw) return JSON.parse(raw);
    await new Promise((res) => setTimeout(res, pollMs));
  }

  return cacheWithLock(key, ttlSeconds, work, lockMs, pollMs);
}
