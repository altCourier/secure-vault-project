const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

router.post('/verify-recovery', async (req, res) => {
    const { recoveryCode } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized. Please log in first.' });
    }

    try {
        const [codes] = await db.query(
            `SELECT code_id, code_hash FROM Recovery_Codes WHERE user_id = ? AND is_used = FALSE`,
            [userId]
        );

        let validCodeId = null;

        for (const code of codes) {
            const match = await bcrypt.compare(recoveryCode, code.code_hash);
            if (match) {
                validCodeId = code.code_id;
                break;
            }
        }

        if (!validCodeId) {
            return res.status(400).json({ error: 'Invalid recovery code' });
        }

        await db.query(
            `UPDATE Recovery_Codes SET is_used = TRUE, used_at = NOW() WHERE code_id = ?`,
            [validCodeId]
        );

        res.json({
            success: true,
            message: 'Recovery code verified successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
