// backend/src/routes/auth.js
const jwt = require('jsonwebtoken'); // Make sure this is at the top
const JWT_SECRET = process.env.JWT_SECRET; // Load your real secret

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
        const token = jwt.sign(
            { sub: user._id, email: user.email }, // payload
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('userToken', JSON.stringify({ username: user.username, profilePic: user.profilePic }), {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
        });
        res.json({ user, token }); // Send the real token back
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});
module.exports = router;