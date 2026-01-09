"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuthOptional = requireAuthOptional;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getToken(req) {
    var _a, _b;
    const h = (((_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization) || ((_b = req.headers) === null || _b === void 0 ? void 0 : _b.Authorization));
    if (h && typeof h === "string" && h.startsWith("Bearer "))
        return h.slice(7).trim();
    const cookies = req.cookies || {};
    return cookies["access_token"] || cookies["token"] || cookies["id_token"] || null;
}
function tryDecodeJWT(token) {
    if (!token)
        return undefined;
    const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
    try {
        const payload = secret
            ? jsonwebtoken_1.default.verify(token, secret)
            : jsonwebtoken_1.default.decode(token);
        if (!payload)
            return undefined;
        const id = payload.sub || payload._id || payload.id;
        if (!id)
            return undefined;
        const user = Object.assign({ _id: String(id), username: payload.username || payload.preferred_username, roles: Array.isArray(payload.roles) ? payload.roles : undefined }, payload);
        return user;
    }
    catch (_a) {
        return undefined;
    }
}
function requireAuthOptional(req, _res, next) {
    try {
        if (typeof req.user !== "undefined")
            return next();
        const token = getToken(req);
        const user = tryDecodeJWT(token);
        req.user = user;
    }
    catch (_a) {
        req.user = undefined;
    }
    next();
}
function requireAuth(req, res, next) {
    try {
        if (typeof req.user === "undefined") {
            const token = getToken(req);
            req.user = tryDecodeJWT(token);
        }
        if (!req.user) {
            return res.status(401).json({ error: "unauthorized" });
        }
        next();
    }
    catch (e) {
        return res.status(401).json({ error: "unauthorized", message: String((e === null || e === void 0 ? void 0 : e.message) || e) });
    }
}
//# sourceMappingURL=auth.js.map