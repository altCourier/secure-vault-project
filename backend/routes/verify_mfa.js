const express = require("express");
const router = express.Router();
const db = require("../db");
const speakeasy = require("speakeasy");
const bcrypt = require("bcrypt");

router.post('/verify-mfa', async (req, res) => {
    const { token } = req.body;
    const userId = req.session.userId;

    // Check for unverified record first (setup flow)
    let [rows] = await db.query(
        `SELECT factor_id, AES_DECRYPT(secret_data, ?) as secret, is_enabled
        FROM User_MFA_Factors
        WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 1`, [process.env.AES_KEY, userId]
    );

    if (!rows.length) {
        return res.status(404).json({ error: 'Couldn\'t find any MFA record' });
    }

    if (!rows[0].secret) {
        return res.status(500).json({ error: 'Failed to decrypt MFA secret' });
    }

    const secret = Buffer.from(rows[0].secret).toString('utf8');
    const factorId = rows[0].factor_id;
    const isSetupFlow = rows[0].is_enabled === 0;

    const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1
    });

    if (!verified) {
        return res.status(400).json({ error: 'Invalid Code' });
    }

    // Setup flow — activate MFA and return recovery codes
    if (isSetupFlow) {
        await db.query(
            `UPDATE User_MFA_Factors SET is_enabled = TRUE, verified_at = NOW() WHERE factor_id = ?`,
            [factorId]
        );

        const codes = [];
        for (let i = 0; i < 10; i++) {
            const rawcode = Math.random().toString(36).substring(2, 10).toUpperCase();
            const hashed = await bcrypt.hash(rawcode, 10);
            await db.query(
                `INSERT INTO Recovery_Codes(user_id, code_hash, is_used, created_at) VALUES(?, ?, FALSE, NOW())`,
                [userId, hashed]
            );
            codes.push(rawcode);
        }

        return res.json({ success: true, recoveryCodes: codes });
    }

    // Login flow — just confirm verification
    return res.json({ success: true });
});

module.exports = router;