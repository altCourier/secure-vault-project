-- first we have to insert a new mfa_factor for the user
-- we're sending the real values on backend so question marks are just placeholder, in case of a sql injection

INSERT INTO User_MFA_Factors (user_id, method_id, secret_data, is_primary, is_enabled, created_at)
VALUES (?, (SELECT method_id FROM MFA_Methods WHERE method_name = 'TOTP'), AES_ENCRYPT(?, 'aes_key'), TRUE, FALSE, NOW());

-- after verification, we have to activate the mfa factor
UPDATE User_MFA_Factors
SET is_enabled = TRUE, verified_at = NOW()
WHERE factor_id = ? AND user_id = ?;

-- we're selecting user's mfa factor
SELECT umf.factor_id, mm.method_name, umf.is_primary, umf.verified_at
FROM User_MFA_Factors umf
JOIN MFA_Methods mm ON umf.method_id = mm.method_id
WHERE umf.user_id = ? AND umf.is_enabled = TRUE;

-- now we're adding a recovery code
INSERT INTO Recovery_Codes (user_id, code_hash, is_used, created_at)
VALUES (?, ?, FALSE, NOW());

-- we should mark it when recovery code is used
UPDATE Recovery_Codes
SET is_used = TRUE, used_at = NOW()
WHERE code_id = ? AND user_id = ? AND is_used = FALSE;

-- select the number of recovery codes the user has not used
-- we have to count them so that we can give a flag like last 3 recovery codes etc.
SELECT COUNT(*) as unused_codes
FROM Recovery_Codes
WHERE user_id = ? AND is_used = FALSE;

