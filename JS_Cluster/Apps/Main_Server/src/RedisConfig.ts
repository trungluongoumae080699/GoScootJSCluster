import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

/**
 * Environment variables (in your .env file):
 * 
 * REDIS_HOST=127.0.0.1
 * REDIS_PORT=6379
 * REDIS_PASSWORD=yourpassword  # optional
 */

const redisUrl = `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASS}@${process.env.REDIS_HOST ?? "127.0.0.1"}:${process.env.REDIS_PORT ?? 6379}`;

export const redisClient = createClient({
  url: redisUrl,
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    reconnectStrategy: (retries) => {
      console.warn(`🔁 Redis reconnect attempt #${retries}`);
      return Math.min(retries * 100, 3000); // backoff up to 3s
    },
  },
});

// Handle connection events
redisClient.on("connect", () => console.log("🧩 Redis: connecting..."));
redisClient.on("ready",   () => console.log("✅ Redis: connected and ready"));
redisClient.on("error",   (err) => console.error("❌ Redis error:", err));
redisClient.on("end",     () => console.warn("⚠️ Redis connection closed"));

/** Connect once at startup */
export async function initRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}