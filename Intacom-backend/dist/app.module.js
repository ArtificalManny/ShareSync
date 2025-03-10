"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_2 = require("@nestjs/common");
const mongoose_3 = require("@nestjs/mongoose");
const auth_module_1 = require("./routes/auth.module");
const uploads_module_1 = require("./uploads/uploads.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_2.Module)({
        imports: [
            mongoose_3.MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost/intacom'),
            auth_module_1.AuthModule,
            uploads_module_1.UploadsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map