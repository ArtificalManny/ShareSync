"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logUserActivity_1 = require("../src/utils/logUserActivity");
const router = (0, express_1.Router)();
router.post('/comment', async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: 'Unauthorized' });
    const { id: userId } = req.user;
    await (0, logUserActivity_1.logUserActivity)(userId, 'comment');
    res.status(200).json({ message: 'Comment activity logged' });
});
exports.default = router;
//# sourceMappingURL=comments.js.map