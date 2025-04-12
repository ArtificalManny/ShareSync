"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectSchema = exports.Project = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let Project = class Project {
};
exports.Project = Project;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Project.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Project.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Project.prototype, "admin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ userId: String, role: String }] }),
    __metadata("design:type", Array)
], Project.prototype, "sharedWith", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'current' }),
    __metadata("design:type", String)
], Project.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Project.prototype, "color", void 0);
__decorate([
    (0, mongoose_1.Prop)([String]),
    __metadata("design:type", Array)
], Project.prototype, "tasks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Project.prototype, "timeline", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Project.prototype, "likes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Project.prototype, "comments", void 0);
exports.Project = Project = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Project);
exports.ProjectSchema = mongoose_1.SchemaFactory.createForClass(Project);
//# sourceMappingURL=project.schema.js.map