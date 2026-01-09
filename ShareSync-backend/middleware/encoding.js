"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodingGuard = void 0;
const encodingGuard = (_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-site");
    const orig = res.setHeader.bind(res);
    res.setHeader = (name, value) => {
        if (typeof value === "string" &&
            name.toLowerCase() === "content-type" &&
            /^(text\/|application\/(json|xml))/.test(value) &&
            !/;\s*charset=/i.test(value)) {
            value = `${value}; charset=utf-8`;
            if (!res.getHeader("Cache-Control")) {
                orig("Cache-Control", "no-store, must-revalidate");
                orig("Pragma", "no-cache");
            }
        }
        return orig(name, value);
    };
    next();
};
exports.encodingGuard = encodingGuard;
//# sourceMappingURL=encoding.js.map