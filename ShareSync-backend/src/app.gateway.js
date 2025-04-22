"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppGateway = void 0;
var websockets_1 = require("@nestjs/websockets");
var AppGateway = function () {
    var _classDecorators = [(0, websockets_1.WebSocketGateway)({ cors: { origin: 'http://localhost:54693', credentials: true } })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _server_decorators;
    var _server_initializers = [];
    var _server_extraInitializers = [];
    var _handleJoinProject_decorators;
    var _handleLeaveProject_decorators;
    var _handleJoinUser_decorators;
    var AppGateway = _classThis = /** @class */ (function () {
        function AppGateway_1() {
            this.server = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _server_initializers, void 0));
            __runInitializers(this, _server_extraInitializers);
        }
        AppGateway_1.prototype.afterInit = function (server) {
            console.log('WebSocket server initialized');
        };
        AppGateway_1.prototype.handleConnection = function (client) {
            console.log("Client connected: ".concat(client.id));
        };
        AppGateway_1.prototype.handleDisconnect = function (client) {
            console.log("Client disconnected: ".concat(client.id));
        };
        AppGateway_1.prototype.handleJoinProject = function (client, data) {
            console.log("Client ".concat(client.id, " joined project ").concat(data.projectId));
            client.join(data.projectId);
            this.server.to(data.projectId).emit('userJoined', { userId: client.id });
        };
        AppGateway_1.prototype.handleLeaveProject = function (client, data) {
            console.log("Client ".concat(client.id, " left project ").concat(data.projectId));
            client.leave(data.projectId);
            this.server.to(data.projectId).emit('userLeft', { userId: client.id });
        };
        AppGateway_1.prototype.handleJoinUser = function (client, data) {
            console.log("Client ".concat(client.id, " joined user room ").concat(data.userId));
            client.join(data.userId);
        };
        AppGateway_1.prototype.emitProjectCreated = function (project) {
            this.server.emit('projectCreated', project);
        };
        AppGateway_1.prototype.emitPostCreated = function (post) {
            this.server.emit('postCreated', post);
        };
        AppGateway_1.prototype.emitNotificationCreated = function (notification) {
            this.server.to(notification.userId).emit('notificationCreated', notification);
        };
        AppGateway_1.prototype.emitTaskCompleted = function (task) {
            this.server.to(task.assignedTo).emit('taskCompleted', task);
        };
        AppGateway_1.prototype.emitTeamActivity = function (activity) {
            this.server.emit('teamActivity', activity);
        };
        return AppGateway_1;
    }());
    __setFunctionName(_classThis, "AppGateway");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _server_decorators = [(0, websockets_1.WebSocketServer)()];
        _handleJoinProject_decorators = [(0, websockets_1.SubscribeMessage)('joinProject')];
        _handleLeaveProject_decorators = [(0, websockets_1.SubscribeMessage)('leaveProject')];
        _handleJoinUser_decorators = [(0, websockets_1.SubscribeMessage)('joinUser')];
        __esDecorate(_classThis, null, _handleJoinProject_decorators, { kind: "method", name: "handleJoinProject", static: false, private: false, access: { has: function (obj) { return "handleJoinProject" in obj; }, get: function (obj) { return obj.handleJoinProject; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleLeaveProject_decorators, { kind: "method", name: "handleLeaveProject", static: false, private: false, access: { has: function (obj) { return "handleLeaveProject" in obj; }, get: function (obj) { return obj.handleLeaveProject; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleJoinUser_decorators, { kind: "method", name: "handleJoinUser", static: false, private: false, access: { has: function (obj) { return "handleJoinUser" in obj; }, get: function (obj) { return obj.handleJoinUser; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _server_decorators, { kind: "field", name: "server", static: false, private: false, access: { has: function (obj) { return "server" in obj; }, get: function (obj) { return obj.server; }, set: function (obj, value) { obj.server = value; } }, metadata: _metadata }, _server_initializers, _server_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppGateway = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppGateway = _classThis;
}();
exports.AppGateway = AppGateway;
