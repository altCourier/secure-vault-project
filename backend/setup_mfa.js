const speakeasy = require('speakeasy'); // this is the library for generating one time password
const QRCode = require('qrcode'); // this is the library for generating qr code images

app.post('/setup-mfa', requireAuth, async (req, res) => {
  const userId = req.session.userId; // this is the id of the user
  const secret = speakeasy.generateSecret({name: `MFASystem (${req.session.username})`}); // here it generates a secret key

  // we're storing the secret key as encrypted in database 
  await db.query(
    `INSERT INTO User_MFA_Factors (user_id, method_id, secret_data, is_primary, is_enabled, created_at)
     VALUES (?, 1, AES_ENCRYPT(?, ?), TRUE, FALSE, NOW())`,
    [userId, secret.base32, process.env.AES_KEY] 
  ); 
  // we shouldn't write the password directly to the code, we're gonna hide it inside env file with process.env.AES_KEY.

  //in this part, we're gonna generate the qr code, and we're gonna send them to frontend
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
  res.json({
    secret: secret.base32,   // secret.base32 is the password created, the user can enter it manually 
    qrCode: qrCodeUrl        // we can make the QR CODE shown on frontend so the user can scan it
  });
});