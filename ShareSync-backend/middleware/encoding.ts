// middleware/encoding.ts
import type { RequestHandler } from "express";

/**
 * Safe defaults:
 * - X-Content-Type-Options: nosniff
 * - Referrer/CORP/COOP basics
 * - Auto-append "; charset=utf-8" for text/*, application/json, application/xml
 * - Conservative cache headers for API-style responses (no-store) if not set
 */
export const encodingGuard: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");

  const orig = res.setHeader.bind(res);
  res.setHeader = (name: string, value: any) => {
    if (
      typeof value === "string" &&
      name.toLowerCase() === "content-type" &&
      /^(text\/|application\/(json|xml))/.test(value) &&
      !/;\s*charset=/i.test(value)
    ) {
      value = `${value}; charset=utf-8`;
      // Set conservative cache headers for API/text responses if not present
      if (!res.getHeader("Cache-Control")) {
        orig("Cache-Control", "no-store, must-revalidate");
        orig("Pragma", "no-cache");
      }
    }
    return orig(name, value);
  };

  next();
};
