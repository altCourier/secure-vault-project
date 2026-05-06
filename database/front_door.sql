-- Developer 1: Front Door (Registration & Login)
-- SQL queries for Users and Credentials tables

-- 1) Check if username already exists
SELECT user_id
FROM Users
WHERE username = ?;

-- 2) Check if username OR email already exists
SELECT user_id
FROM Users
WHERE username = ? OR email = ?;

-- 3) Insert new user
INSERT INTO Users (
    username,
    email,
    first_name,
    last_name,
    account_status,
    created_at
)
VALUES (?, ?, ?, ?, 'pending', NOW());

-- 4) Insert user credentials after bcrypt hashing in backend
INSERT INTO Credentials (
    user_id,
    password_hash,
    hash_algorithm,
    failed_login_attempts,
    password_changed_at,
    created_at
)
VALUES (?, ?, 'bcrypt', 0, NOW(), NOW());

-- 5) Login query: get user and password hash
SELECT
    u.user_id,
    u.username,
    u.email,
    u.account_status,
    c.password_hash,
    c.failed_login_attempts,
    c.lock_until
FROM Users u
JOIN Credentials c ON u.user_id = c.user_id
WHERE u.username = ?;
