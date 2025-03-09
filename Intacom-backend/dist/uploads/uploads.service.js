"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_2 = require("@nestjs/common");
const multer_1 = require("multer");
const aws_sdk_1 = require("aws-sdk");
let UploadService = class UploadService {
    constructor() {
        this.upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
    }
    uploadFile(req, res) {
        this.upload.single('file')(req, res, (err) => {
            if (err) {
                console.error(err);
                return res.status(400).json({ error: 'Upload failed' });
            }
            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const s3 = new aws_sdk_1.S3({
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: process.env.AWS_REGION,
            });
            const fileName = `${Date.now()}-${file.originalname}`;
            const params = {
                Bucket: process.env.S3_BUCKET,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            };
            s3.upload(params, (error, data) => {
                if (error) {
                    return res.status(500).json({ error: 'Upload to S3 failed' });
                }
                res.json(data.Location);
            });
        });
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_2.Injectable)()
], UploadService);
//# sourceMappingURL=uploads.service.js.map