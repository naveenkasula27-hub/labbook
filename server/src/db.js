import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDb(uri = config.mongoUri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("MongoDB connected");
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

/**
 * The same thing, but safe to call on every request.
 *
 * On a normal server you connect once at startup. On Vercel the code runs as a
 * function that may be started and stopped at any time, so every request has
 * to check whether a connection already exists.
 *
 * The promise is cached on globalThis rather than in a module variable because
 * a serverless runtime can reload modules while keeping the process alive. The
 * cache holds the promise, not the connection, so ten requests arriving at once
 * share one connection attempt instead of opening ten.
 */
const CACHE_KEY = Symbol.for("labbook.mongoose.connection");

export function cachedConnect(uri = config.mongoUri) {
  if (!globalThis[CACHE_KEY]) {
    mongoose.set("strictQuery", true);
    globalThis[CACHE_KEY] = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        // Keep the pool small: many function instances each holding a big pool
        // is what exhausts a free Atlas cluster's connection limit.
        maxPoolSize: 5,
        minPoolSize: 0,
      })
      .then((m) => {
        console.log("MongoDB connected");
        return m;
      })
      .catch((err) => {
        // Clear the cache so the next request tries again rather than
        // returning the same failed promise forever.
        globalThis[CACHE_KEY] = null;
        throw err;
      });
  }
  return globalThis[CACHE_KEY];
}
