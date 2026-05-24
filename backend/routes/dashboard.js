const express = require("express");
const router = express.Router();
const db = require("../db");
const sessionMiddleware = require('../middleware/session_middleware');

router.get('/session', sessionMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        
        const [user] = await db.query(
            'SELECT username, email FROM Users WHERE user_id = ?', 
            [userId]
        );

        if (!user.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            authenticated: true,
            user: user[0]
        });

    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
