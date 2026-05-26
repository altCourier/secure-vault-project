
-- 1)Users table
-- All other tables reference this table.
CREATE TABLE IF NOT EXISTS Users (
    user_id        INT          PRIMARY KEY AUTO_INCREMENT,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    email          VARCHAR(100) NOT NULL UNIQUE,
    first_name     VARCHAR(50)  NOT NULL,
    last_name      VARCHAR(50)  NOT NULL,
    account_status ENUM('active', 'locked', 'pending') NOT NULL DEFAULT 'pending',
    created_at     DATETIME     NOT NULL DEFAULT NOW(),
    updated_at     DATETIME     NULL,
    last_login_at  DATETIME     NULL
);

-- 2) Credentials table
CREATE TABLE IF NOT EXISTS Credentials (
    credential_id        INT          PRIMARY KEY AUTO_INCREMENT,
    user_id              INT          NOT NULL UNIQUE,
    password_hash        VARCHAR(255) NOT NULL,
    hash_algorithm       VARCHAR(20)  NOT NULL,
    failed_login_attempts INT         NOT NULL DEFAULT 0,
    lock_until           DATETIME     NULL,
    password_changed_at  DATETIME     NULL,
    created_at           DATETIME     NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 3) MFA_Methods table
CREATE TABLE IF NOT EXISTS MFA_Methods (
    method_id   INT          PRIMARY KEY AUTO_INCREMENT,
    method_name VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL DEFAULT NOW()
);

-- Seeding the supported MFA types so INSERT queries in mfa_queries.sql
INSERT IGNORE INTO MFA_Methods (method_name, description, is_active)
VALUES
    ('TOTP',        'Time-based One-Time Password (e.g. Google Authenticator)', TRUE),
    ('SMS',         'One-time code delivered via SMS',                          TRUE),
    ('EMAIL',       'One-time code delivered via e-mail',                       TRUE),
    ('BACKUP_CODE', 'Single-use emergency recovery code',                       TRUE);

-- 4) User_MFA_Factors
CREATE TABLE IF NOT EXISTS User_MFA_Factors (
    factor_id   INT          PRIMARY KEY AUTO_INCREMENT,
    user_id     INT          NOT NULL,
    method_id   INT          NOT NULL,
    secret_data VARCHAR(512) NULL,          -- AES encrypted, set by backend
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    is_enabled  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  DATETIME     NOT NULL DEFAULT NOW(),
    verified_at DATETIME     NULL,

    FOREIGN KEY (user_id)   REFERENCES Users(user_id)       ON DELETE CASCADE,
    FOREIGN KEY (method_id) REFERENCES MFA_Methods(method_id) ON DELETE RESTRICT
);

-- 5) Recovery_Codes
CREATE TABLE IF NOT EXISTS Recovery_Codes (
    code_id    INT          PRIMARY KEY AUTO_INCREMENT,
    user_id    INT          NOT NULL,
    code_hash  VARCHAR(255) NOT NULL,
    is_used    BOOLEAN      NOT NULL DEFAULT FALSE,
    used_at    DATETIME     NULL,
    created_at DATETIME     NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);