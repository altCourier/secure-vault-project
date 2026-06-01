const express = require("express");
const router = express.Router();
const db = require("../db");
const speakeasy = require("speakeasy");
const bcrypt = require("bcrypt");

router.post('/verify-mfa', async (req, res) => {
    const { token } = req.body; // token is the 6-digit code that the user has entered
    const userId = req.session.userId;

    const [rows] = await db.query(
        `SELECT factor_id, AES_DECRYPT(secret_data, ?) as secret
        FROM User_MFA_Factors
        WHERE user_id = ? AND is_enabled = FALSE`, [process.env.AES_KEY, userId]
    ); // we're creating a list for taking the encrypted password and we solve it

    if (!rows.length) { // if there is nothing in the rows, then return an error
        return res.status(404).json({ error: 'Couldn\'t find any MFA record' });
    }

    if (!rows[0].secret) {
        return res.status(500).json({ error: 'Failed to decrypt MFA secret' });
    }

    const secret = rows[0].secret.toString();
    
    const factorId = rows[0].factor_id; 

    const verified = speakeasy.totp.verify({ // we should verify the totp code with verify function
        secret,
        encoding: 'base32',
        token,
        window: 1
    });

    if (!verified) {
        return res.status(400).json({ error: 'Invalid Code' });
    }

    await db.query(
        `UPDATE User_MFA_Factors
        SET is_enabled = TRUE, verified_at = NOW()
        WHERE factor_id = ?`, [factorId]
    ); // we have activated the mfa factor if verified is True.

    const codes = [];
    for (let i = 0; i < 10; i++) {
        const rawcode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const hashed = await bcrypt.hash(rawcode, 10);
        await db.query(
            `INSERT INTO Recovery_Codes(user_id,code_hash,is_used,created_at)
            VALUES(?,?,FALSE,NOW())`, [userId, hashed]
        );
        codes.push(rawcode);
    }

    res.json({
        success: true,
        recoveryCodes: codes
    });
});

module.exports = router;
