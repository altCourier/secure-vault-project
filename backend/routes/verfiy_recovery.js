// if there is not any MFA device, then recovery codes will be used 

app.post('/verify-recovery', requireAuth, async (req, res) => {
  const { code } = req.body;
  const userId = req.session.userId; 

  const [rows] = await db.query(
    `SELECT code_id, code_hash FROM Recovery_Codes
     WHERE user_id = ? AND is_used = FALSE`,[userId]
  );

  let matched = null; // we're checking them with the code_hash that are present in the database
  for (const a of rows) {
    const ismatch = await bcrypt.compare(code, a.code_hash);
    if (ismatch) {
        matched = a; 
    }
    else{
        break;
    }
  }

  if (!matched){
    return res.status(400).json({ error: 'Invalid Recovery Code' });
  }

  await db.query(
    `UPDATE Recovery_Codes SET is_used = TRUE, used_at = NOW()
     WHERE code_id = ?`,[matched.code_id]
  );
  res.json({ success: true });
});