"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const dotenv = __importStar(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = require("path");
dotenv.config();
async function connectWithRetry() {
    let retries = 5;
    while (retries > 0) {
        try {
            console.log('Connecting to MongoDB...');
            await mongoose_1.default.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('MongoDB connection successful');
            break;
        }
        catch (err) {
            console.error(`MongoDB connection attempt ${6 - retries} failed:`, err);
            retries -= 1;
            if (retries === 0) {
                throw err;
            }
            console.log('Retrying in 5 seconds...');
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
}
async function bootstrap() {
    console.log('Environment variables loaded:');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
    console.log('S3_BUCKET:', process.env.S3_BUCKET);
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets((0, path_1.join)(__dirname, '..', '..', 'Intacom-frontend', 'dist'), {
        index: 'index.html',
        prefix: '/',
    });
    app.use((req, res, next) => {
        console.log('Backend: Request received:', req.method, req.url, 'from origin:', req.headers.origin);
        console.log('Backend: Response headers:', res.getHeaders());
        next();
    });
    app.setGlobalPrefix('auth');
    await connectWithRetry();
    await app.listen(3000);
    console.log('Backend server running on http://localhost:3000');
    console.log('Serving frontend from:', (0, path_1.join)(__dirname, '..', '..', 'Intacom-frontend', 'dist'));
}
bootstrap().catch((err) => {
    console.error('Failed to start the application:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map