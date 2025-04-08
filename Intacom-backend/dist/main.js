"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const mongoose_1 = __importDefault(require("mongoose"));
async function connectWithRetry() {
    let retries = 5;
    while (retries > 0) {
        try {
            console.log('MONGODB_URI in main.ts:', process.env.MONGODB_URI);
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