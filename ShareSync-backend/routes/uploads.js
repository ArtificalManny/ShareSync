"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadsRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const safe_convert_1 = require("../utils/safe-convert");
const errors_1 = require("../middleware/errors");
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path_1.default.resolve(process.cwd(), "uploads");
const PUBLIC_BASE = process.env.PUBLIC_BASE || "/uploads";
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
});
async function ensureDir(p) {
    await fs_1.promises.mkdir(p, { recursive: true });
}
exports.uploadsRouter = (0, express_1.Router)();
exports.uploadsRouter.post("/", upload.single("file"), async (req, res) => {
    try {
        if (!req.file)
            return (0, errors_1.sendError)(res, 400, "NO_FILE", "No file uploaded");
        const original = req.file.buffer;
        const sniff = await (0, safe_convert_1.sniffMime)(original);
        const declared = req.file.mimetype || "application/octet-stream";
        const realMime = sniff.mime;
        if (declared.split("/")[0] !== realMime.split("/")[0]) {
            console.warn("[upload] MIME mismatch:", { declared, real: realMime });
        }
        const id = (0, crypto_1.randomUUID)();
        const day = new Date().toISOString().slice(0, 10);
        const dir = path_1.default.join(UPLOAD_ROOT, day);
        await ensureDir(dir);
        let finalBuf = original;
        let finalMime = realMime;
        let width = 0;
        let height = 0;
        if (realMime.startsWith("image/")) {
            const target = realMime === "image/jpeg" || realMime === "image/jpg" ? "jpeg" :
                realMime === "image/png" ? "png" : "webp";
            const norm = await (0, safe_convert_1.normalizeImageBuffer)(original, target);
            finalBuf = norm.buffer;
            finalMime = norm.mime;
            width = norm.width;
            height = norm.height;
        }
        const ext = finalMime === "image/jpeg" ? "jpg" :
            finalMime === "image/png" ? "png" :
                finalMime === "image/webp" ? "webp" : sniff.ext;
        const obj = `${id}.${ext}`;
        const abs = path_1.default.join(dir, obj);
        await fs_1.promises.writeFile(abs, finalBuf);
        let previewUrl = "";
        if (finalMime.startsWith("image/")) {
            const pName = `${id}.preview.webp`;
            const pAbs = path_1.default.join(dir, pName);
            const pBuf = await (0, safe_convert_1.toPreviewWebp)(finalBuf, 480, 82);
            await fs_1.promises.writeFile(pAbs, pBuf);
            previewUrl = path_1.default.posix.join(PUBLIC_BASE, day, pName);
        }
        const url = path_1.default.posix.join(PUBLIC_BASE, day, obj);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.json({
            id,
            url,
            mime: finalMime,
            size: finalBuf.length,
            width,
            height,
            hasPreview: Boolean(previewUrl),
            previewUrl,
        });
    }
    catch (e) {
        console.error("[uploads] error", e);
        return (0, errors_1.sendError)(res, 500, "UPLOAD_FAILED", (e === null || e === void 0 ? void 0 : e.message) || "Upload failed");
    }
});
//# sourceMappingURL=uploads.js.map