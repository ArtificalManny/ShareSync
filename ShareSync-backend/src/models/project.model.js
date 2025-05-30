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
const mongoose_2 = require("mongoose");
let Project = class Project extends mongoose_2.Document {
    constructor() {
        super(...arguments);
        this.name = '';
        this.description = '';
        this.admin = '';
        this.sharedWith = [];
        this.announcements = [];
        this.tasks = [];
    }
};
exports.Project = Project;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Project.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Project.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Project.prototype, "admin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Project.prototype, "sharedWith", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                id: String,
                content: String,
                media: String,
                user: String,
                likes: Number,
                comments: [{ user: String, text: String }],
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Project.prototype, "announcements", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                id: String,
                title: String,
                assignee: String,
                dueDate: Date,
                status: String,
                user: String,
                comments: [{ user: String, text: String }],
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Project.prototype, "tasks", void 0);
exports.Project = Project = __decorate([
    (0, mongoose_1.Schema)()
], Project);
exports.ProjectSchema = mongoose_1.SchemaFactory.createForClass(Project);
