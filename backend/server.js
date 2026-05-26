// Developer 1: Front Door (Registration & Login)
// Backend API using Node.js, Express, MySQL, bcrypt, sessions, and routes

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();

const setupMfaRoutes = require("./routes/setup_mfa");
const verifyMfaRoutes = require("./routes/verify_mfa");
const verifyRecoveryRoutes = require("./routes/verfiy_recovery");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MySQLStore = require("express-mysql-session")(session);

const sessionStore = new MySQLStore({}, pool);

app.use(session({
  secret: process.env.SESSION_SECRET || "secure-vault-secret",
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: "none"
  }
}));

app.use(express.static("../frontend"));

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

// REGISTER ROUTE
app.post("/register", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { username, email, firstName, lastName, password } = req.body;

    if (!username || !email || !firstName || !lastName || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const [existingUser] = await connection.query(
      "SELECT user_id FROM Users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: "Username or email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await connection.beginTransaction();

    const [userResult] = await connection.query(
      `INSERT INTO Users
       (username, email, first_name, last_name, account_status, created_at)
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [username, email, firstName, lastName]
    );

    const userId = userResult.insertId;

    await connection.query(
      `INSERT INTO Credentials
       (user_id, password_hash, hash_algorithm, failed_login_attempts, password_changed_at, created_at)
       VALUES (?, ?, 'bcrypt', 0, NOW(), NOW())`,
      [userId, passwordHash]
    );

    await connection.query(
      `INSERT INTO Security_State (user_id, consecutive_failures, is_account_frozen)
       VALUES (?, 0, FALSE)`,
      [userId]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Registration successful.",
      userId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error." });
  } finally {
    connection.release();
  }
});

// LOGIN ROUTE
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required."
      });
    }

    const [rows] = await pool.query(
      `SELECT
          u.user_id,
          u.username,
          u.account_status,
          c.password_hash,
          c.lock_until
       FROM Users u
       JOIN Credentials c ON u.user_id = c.user_id
       WHERE u.username = ?`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password."
      });
    }

    const user = rows[0];

    if (user.account_status === "locked") {
      return res.status(403).json({
        message: "Account is locked."
      });
    }

    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      return res.status(403).json({
        message: "Account is temporarily locked."
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      await pool.query(
        "INSERT INTO Audit_Log (user_id, event_code, status, timestamp) VALUES (?, 'login_attempt', 'failure', NOW())",
        [user.user_id]
      );
      return res.status(401).json({
        message: "Invalid username or password."
      });
    }

    req.session.userId = user.user_id;
    req.session.username = user.username;

    await pool.query(
      "INSERT INTO Audit_Log (user_id, event_code, status, timestamp) VALUES (?, 'login_attempt', 'success', NOW())",
      [user.user_id]
    );

    return res.status(200).json({
      message: "Password verified. Continue to MFA setup or verification.",
      userId: user.user_id,
      username: user.username
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Server error."
    });
  }
});

// ROUTES FROM SEPARATE FILES
app.use(setupMfaRoutes);
app.use(verifyMfaRoutes);
app.use(verifyRecoveryRoutes);
app.use("/api", dashboardRoutes);

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`Server is running on ${BACKEND_URL}`);
});