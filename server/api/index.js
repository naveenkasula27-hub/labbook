/**
 * Entry point for Vercel's /api routes.
 *
 * The handler itself lives in src/index.js, because Vercel also builds a
 * function from that file for the root address. Keeping one handler and
 * re-exporting it means both behave the same, rather than one working and the
 * other crashing.
 */
export { default } from "../src/index.js";
