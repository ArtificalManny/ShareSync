"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sniffMime = sniffMime;
exports.normalizeImageBuffer = normalizeImageBuffer;
exports.toPreviewWebp = toPreviewWebp;
const sharp_1 = __importDefault(require("sharp"));
const file_type_1 = require("file-type");
async function sniffMime(buf) {
    const ft = await (0, file_type_1.fileTypeFromBuffer)(buf);
    return {
        mime: (ft === null || ft === void 0 ? void 0 : ft.mime) || "application/octet-stream",
        ext: (ft === null || ft === void 0 ? void 0 : ft.ext) || "bin",
    };
}
async function normalizeImageBuffer(buf, target) {
    const s = (0, sharp_1.default)(buf, { failOn: "none" }).rotate();
    const meta = await s.metadata();
    let out = s;
    switch (target) {
        case "jpeg":
            out = out.jpeg({ mozjpeg: true, quality: 84 });
            break;
        case "png":
            out = out.png({ compressionLevel: 9 });
            break;
        case "webp":
        default:
            out = out.webp({ quality: 84 });
            break;
    }
    const buffer = await out.toBuffer();
    const mime = target === "jpeg" ? "image/jpeg" :
        target === "png" ? "image/png" :
            "image/webp";
    return { buffer, mime, width: meta.width || 0, height: meta.height || 0 };
}
async function toPreviewWebp(buf, width = 480, quality = 82) {
    return (0, sharp_1.default)(buf).resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
}
//# sourceMappingURL=safe-convert.js.map