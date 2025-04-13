"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const cookieParser = require("cookie-parser");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: 'http://localhost:54693',
        credentials: true,
    });
    app.use(cookieParser());
    await app.listen(3001);
    console.log('Backend server running on http://localhost:3001');
}
bootstrap();
//# sourceMappingURL=main.js.map