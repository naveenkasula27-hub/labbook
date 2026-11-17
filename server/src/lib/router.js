import express from "express";
export const asyncHandler = (fn) => function (req, res, next) {
  try { Promise.resolve(fn(req, res, next)).catch(next); } catch (err) { next(err); }
};
export function createRouter() {
  const router = express.Router();
  for (const method of ["use", "get", "post", "put", "patch", "delete"]) {
    const original = router[method].bind(router);
    router[method] = (...args) => original(...args.map(function wrap(arg) {
      if (Array.isArray(arg)) return arg.map(wrap);
      return typeof arg === "function" && arg.length < 4 ? asyncHandler(arg) : arg;
    }));
  }
  return router;
}
