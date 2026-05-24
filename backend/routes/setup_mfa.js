const express = require("express");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const db = require("../db");
//const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.post("/setup-mfa", async (req, res) => {
  try {
    const userId = req.session.userId;
    const username = req.session.username;

    const secret = speakeasy.generateSecret({
      name: `MFASystem (${username})`
    });

    await db.query(
      `INSERT INTO User_MFA_Factors 
       (user_id, method_id, secret_data, is_primary, is_enabled, created_at)
       VALUES (?, 1, AES_ENCRYPT(?, ?), TRUE, FALSE, NOW())`,
      [userId, secret.base32, process.env.AES_KEY]
    );

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    console.error("Setup MFA error:", error);
    return res.status(500).json({
      message: "Server error while setting up MFA."
    });
  }
});

module.exports = router;
