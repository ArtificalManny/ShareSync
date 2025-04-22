"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserDto = void 0;
var class_validator_1 = require("class-validator");
var UpdateUserDto = function () {
    var _a;
    var _firstName_decorators;
    var _firstName_initializers = [];
    var _firstName_extraInitializers = [];
    var _lastName_decorators;
    var _lastName_initializers = [];
    var _lastName_extraInitializers = [];
    var _username_decorators;
    var _username_initializers = [];
    var _username_extraInitializers = [];
    var _email_decorators;
    var _email_initializers = [];
    var _email_extraInitializers = [];
    var _bio_decorators;
    var _bio_initializers = [];
    var _bio_extraInitializers = [];
    var _hobbies_decorators;
    var _hobbies_initializers = [];
    var _hobbies_extraInitializers = [];
    var _skills_decorators;
    var _skills_initializers = [];
    var _skills_extraInitializers = [];
    var _experience_decorators;
    var _experience_initializers = [];
    var _experience_extraInitializers = [];
    var _endorsements_decorators;
    var _endorsements_initializers = [];
    var _endorsements_extraInitializers = [];
    var _following_decorators;
    var _following_initializers = [];
    var _following_extraInitializers = [];
    var _followers_decorators;
    var _followers_initializers = [];
    var _followers_extraInitializers = [];
    var _points_decorators;
    var _points_initializers = [];
    var _points_extraInitializers = [];
    var _badges_decorators;
    var _badges_initializers = [];
    var _badges_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateUserDto() {
                this.firstName = __runInitializers(this, _firstName_initializers, void 0);
                this.lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, void 0));
                this.username = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _username_initializers, void 0));
                this.email = (__runInitializers(this, _username_extraInitializers), __runInitializers(this, _email_initializers, void 0));
                this.bio = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _bio_initializers, void 0));
                this.hobbies = (__runInitializers(this, _bio_extraInitializers), __runInitializers(this, _hobbies_initializers, void 0));
                this.skills = (__runInitializers(this, _hobbies_extraInitializers), __runInitializers(this, _skills_initializers, void 0));
                this.experience = (__runInitializers(this, _skills_extraInitializers), __runInitializers(this, _experience_initializers, void 0));
                this.endorsements = (__runInitializers(this, _experience_extraInitializers), __runInitializers(this, _endorsements_initializers, void 0));
                this.following = (__runInitializers(this, _endorsements_extraInitializers), __runInitializers(this, _following_initializers, void 0));
                this.followers = (__runInitializers(this, _following_extraInitializers), __runInitializers(this, _followers_initializers, void 0));
                this.points = (__runInitializers(this, _followers_extraInitializers), __runInitializers(this, _points_initializers, void 0));
                this.badges = (__runInitializers(this, _points_extraInitializers), __runInitializers(this, _badges_initializers, void 0));
                __runInitializers(this, _badges_extraInitializers);
            }
            return UpdateUserDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _firstName_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _lastName_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _username_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _email_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEmail)()];
            _bio_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _hobbies_decorators = [(0, class_validator_1.IsOptional)()];
            _skills_decorators = [(0, class_validator_1.IsOptional)()];
            _experience_decorators = [(0, class_validator_1.IsOptional)()];
            _endorsements_decorators = [(0, class_validator_1.IsOptional)()];
            _following_decorators = [(0, class_validator_1.IsOptional)()];
            _followers_decorators = [(0, class_validator_1.IsOptional)()];
            _points_decorators = [(0, class_validator_1.IsOptional)()];
            _badges_decorators = [(0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: function (obj) { return "firstName" in obj; }, get: function (obj) { return obj.firstName; }, set: function (obj, value) { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
            __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: function (obj) { return "lastName" in obj; }, get: function (obj) { return obj.lastName; }, set: function (obj, value) { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
            __esDecorate(null, null, _username_decorators, { kind: "field", name: "username", static: false, private: false, access: { has: function (obj) { return "username" in obj; }, get: function (obj) { return obj.username; }, set: function (obj, value) { obj.username = value; } }, metadata: _metadata }, _username_initializers, _username_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: function (obj) { return "email" in obj; }, get: function (obj) { return obj.email; }, set: function (obj, value) { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _bio_decorators, { kind: "field", name: "bio", static: false, private: false, access: { has: function (obj) { return "bio" in obj; }, get: function (obj) { return obj.bio; }, set: function (obj, value) { obj.bio = value; } }, metadata: _metadata }, _bio_initializers, _bio_extraInitializers);
            __esDecorate(null, null, _hobbies_decorators, { kind: "field", name: "hobbies", static: false, private: false, access: { has: function (obj) { return "hobbies" in obj; }, get: function (obj) { return obj.hobbies; }, set: function (obj, value) { obj.hobbies = value; } }, metadata: _metadata }, _hobbies_initializers, _hobbies_extraInitializers);
            __esDecorate(null, null, _skills_decorators, { kind: "field", name: "skills", static: false, private: false, access: { has: function (obj) { return "skills" in obj; }, get: function (obj) { return obj.skills; }, set: function (obj, value) { obj.skills = value; } }, metadata: _metadata }, _skills_initializers, _skills_extraInitializers);
            __esDecorate(null, null, _experience_decorators, { kind: "field", name: "experience", static: false, private: false, access: { has: function (obj) { return "experience" in obj; }, get: function (obj) { return obj.experience; }, set: function (obj, value) { obj.experience = value; } }, metadata: _metadata }, _experience_initializers, _experience_extraInitializers);
            __esDecorate(null, null, _endorsements_decorators, { kind: "field", name: "endorsements", static: false, private: false, access: { has: function (obj) { return "endorsements" in obj; }, get: function (obj) { return obj.endorsements; }, set: function (obj, value) { obj.endorsements = value; } }, metadata: _metadata }, _endorsements_initializers, _endorsements_extraInitializers);
            __esDecorate(null, null, _following_decorators, { kind: "field", name: "following", static: false, private: false, access: { has: function (obj) { return "following" in obj; }, get: function (obj) { return obj.following; }, set: function (obj, value) { obj.following = value; } }, metadata: _metadata }, _following_initializers, _following_extraInitializers);
            __esDecorate(null, null, _followers_decorators, { kind: "field", name: "followers", static: false, private: false, access: { has: function (obj) { return "followers" in obj; }, get: function (obj) { return obj.followers; }, set: function (obj, value) { obj.followers = value; } }, metadata: _metadata }, _followers_initializers, _followers_extraInitializers);
            __esDecorate(null, null, _points_decorators, { kind: "field", name: "points", static: false, private: false, access: { has: function (obj) { return "points" in obj; }, get: function (obj) { return obj.points; }, set: function (obj, value) { obj.points = value; } }, metadata: _metadata }, _points_initializers, _points_extraInitializers);
            __esDecorate(null, null, _badges_decorators, { kind: "field", name: "badges", static: false, private: false, access: { has: function (obj) { return "badges" in obj; }, get: function (obj) { return obj.badges; }, set: function (obj, value) { obj.badges = value; } }, metadata: _metadata }, _badges_initializers, _badges_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateUserDto = UpdateUserDto;
