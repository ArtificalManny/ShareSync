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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function connectWithRetry() {
    let retries = 5;
    while (retries > 0) {
        try {
            console.log('Environment variables loaded:');
            console.log('MONGODB_URI:', process.env.MONGODB_URI);
            console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
            console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
            console.log('EMAIL_USER:', process.env.EMAIL_USER);
            console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
            console.log('S3_BUCKET:', process.env.S3_BUCKET);
            console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
            if (!process.env.MONGODB_URI) {
                throw new Error('MONGODB_URI is not defined in the environment variables');
            }
            console.log('Connecting to MongoDB...');
            await mongoose_1.default.connect(process.env.MONGODB_URI);
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
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}
async function bootstrap() {
    mongoose_1.default.set('debug', true);
    await connectWithRetry();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    await app.listen(3000);
}
bootstrap().catch(err => {
    console.error('Failed to start the application:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map