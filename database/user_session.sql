
-- Audit Log Table
CREATE TABLE IF NOT EXISTS Audit_Log (
    log_id INT PRIMARY KEY AUTO_INCREMENT, 
    user_id INT NOT NULL,
    event_code VARCHAR(50) NOT NULL, 
    status  ENUM('success','failure','warning') NOT NULL, 
    ip_address VARCHAR(45) NULL, 
    user_agent VARCHAR(255) NULL, 
    timestamp DATETIME NOT NULL DEFAULT NOW(), 
    details TEXT NULL,

    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE

);

-- User Session Table
CREATE TABLE IF NOT EXISTS User_Session (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    ip_address VARCHAR(45) NULL,
    is_mfa_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    expires_at DATETIME NOT NULL,
    last_activity DATETIME NULL,

    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Security State Table
CREATE TABLE IF NOT EXISTS Security_State (
    user_id INT PRIMARY KEY,
    consecutive_failures INT NOT NULL DEFAULT 0,
    last_failed_at DATETIME NULL,
    lockout_until DATETIME NULL,
    is_account_frozen BOOLEAN NOT NULL DEFAULT FALSE,

    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);