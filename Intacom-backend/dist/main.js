"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
async function bootstrap() {
    const expressApp = (0, express_1.default)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressApp));
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intacom';
    await mongoose_1.default.connect(MONGODB_URI)
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('MongoDB connection error:', err));
    const server = app.getHttpServer();
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    io.on('connection', (socket) => {
        console.log('New client connected');
        socket.on('disconnect', () => console.log('Client disconnected'));
    });
    const storage = multer_1.default.diskStorage({
        destination: './uploads/',
        filename: (req, file, cb) => {
            cb(null, file.fieldname + '-' + Date.now() + path_1.default.extname(file.originalname));
        }
    });
    const upload = (0, multer_1.default)({ storage }).single('file');
    if (!fs_1.default.existsSync('./uploads')) {
        fs_1.default.mkdirSync('./uploads');
    }
    app.use('/uploads', express_1.default.static('uploads'));
    await app.listen(3000, () => console.log(`Server running on port 3000`));
}
bootstrap();
//# sourceMappingURL=main.js.map