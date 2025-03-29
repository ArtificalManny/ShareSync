"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        await app.listen(3006);
        console.log('Server running on port 3006');
    }
    catch (error) {
        console.error('Error starting the server:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map