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
const mongoose_3 = require("@nestjs/mongoose");
let Project = class Project {
    constructor() {
        this.name = '';
        this.description = '';
        this.admin = '';
        this.members = [];
        this.administrators = [];
    }
};
exports.Project = Project;
__decorate([
    (0, mongoose_3.Prop)({ required: true }),
    __metadata("design:type", String)
], Project.prototype, "name", void 0);
__decorate([
    (0, mongoose_3.Prop)({ required: true }),
    __metadata("design:type", String)
], Project.prototype, "description", void 0);
__decorate([
    (0, mongoose_3.Prop)({ required: true }),
    __metadata("design:type", String)
], Project.prototype, "admin", void 0);
__decorate([
    (0, mongoose_3.Prop)(),
    __metadata("design:type", String)
], Project.prototype, "color", void 0);
__decorate([
    (0, mongoose_3.Prop)(),
    __metadata("design:type", Array)
], Project.prototype, "members", void 0);
__decorate([
    (0, mongoose_3.Prop)(),
    __metadata("design:type", Array)
], Project.prototype, "administrators", void 0);
exports.Project = Project = __decorate([
    (0, mongoose_3.Schema)()
], Project);
exports.ProjectSchema = mongoose_3.SchemaFactory.createForClass(Project);
//# sourceMappingURL=project.model.js.map