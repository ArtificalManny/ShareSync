"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const logUserActivity_1 = require("../src/utils/logUserActivity");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.post('/:id/complete', async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const taskId = req.params.id;
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                completed: true,
                completedById: userId,
                completedAt: new Date()
            }
        });
        await (0, logUserActivity_1.logUserActivity)(userId, 'COMPLETE_TASK', taskId);
        return res.json(updatedTask);
    }
    catch (err) {
        console.error('[POST /tasks/:id/complete]', err);
        return res.status(500).json({ message: 'Error completing task' });
    }
});
router.post('/:id/assign', async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const taskId = req.params.id;
        const { assigneeId } = req.body;
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                assignedToId: assigneeId
            }
        });
        await (0, logUserActivity_1.logUserActivity)(userId, 'ASSIGN_TASK', taskId);
        return res.json(updatedTask);
    }
    catch (err) {
        console.error('[POST /tasks/:id/assign]', err);
        return res.status(500).json({ message: 'Error assigning task' });
    }
});
router.post('/', async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { title, description, projectId } = req.body;
        const newTask = await prisma.task.create({
            data: {
                title,
                description,
                projectId,
                createdById: userId
            }
        });
        await (0, logUserActivity_1.logUserActivity)(userId, 'CREATE_TASK', newTask.id);
        return res.status(201).json(newTask);
    }
    catch (err) {
        console.error('[POST /tasks]', err);
        return res.status(500).json({ message: 'Error creating task' });
    }
});
exports.default = router;
//# sourceMappingURL=tasks.js.map