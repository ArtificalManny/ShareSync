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
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const mongoose = __importStar(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function bootstrap() {
    console.log('MONGODB_URI in main.ts:', process.env.MONGODB_URI);
    console.log('Connecting to MongoDB...');
    mongoose.set('debug', true);
    const connectWithRetry = async (retries = 5, delay = 5000) => {
        for (let i = 0; i < retries; i++) {
            try {
                if (!process.env.MONGODB_URI) {
                    throw new Error('MONGODB_URI is not defined in environment variables');
                }
                await mongoose.connect(process.env.MONGODB_URI, {
                    serverSelectionTimeoutMS: 5000,
                });
                console.log('MongoDB connection successful');
                break;
            }
            catch (err) {
                console.error(`MongoDB connection attempt ${i + 1} failed:`, err);
                if (i < retries - 1) {
                    console.log(`Retrying in ${delay / 1000} seconds...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
                else {
                    throw err;
                }
            }
        }
    };
    try {
        await connectWithRetry();
    }
    catch (err) {
        console.error('Failed to connect to MongoDB after retries:', err);
        process.exit(1);
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map