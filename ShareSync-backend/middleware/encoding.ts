// middleware/encoding.ts
import type { RequestHandler } from "express";

/**
 * Sets safe defaults:
 * - X-Content-Type-Options: nosniff
 * - Adds charset=utf-8 automatically to text/*, application/json, application/xml
 *   if the route sets Content-Type without a charset.
 * - Lightweight security headers that are safe for most APIs.
 */
export const encodingGuard: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Some helpful, conservative defaults:
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");

  // Wrap setHeader to auto-append charset for text-y responses
  const orig = res.setHeader.bind(res);
  res.setHeader = (name: string, value: any) => {
    if (
      typeof value === "string" &&
      name.toLowerCase() === "content-type" &&
      /^(text\/|application\/(json|xml))/.test(value) &&
      !/;\s*charset=/i.test(value)
    ) {
      value = `${value}; charset=utf-8`;
    }
    return orig(name, value);
  };

  next();
};
