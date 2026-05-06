// Developer 1: Front Door (Registration & Login)
// Backend API using Node.js, Express, MySQL, and bcrypt

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

app.use(cors());
app.use(express.json());
app.use(express.static("../frontend"));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mfa_system",
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
      return res.status(400).json({ message: "Username and password are required." });
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
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const user = rows[0];

    if (user.account_status === "locked") {
      return res.status(403).json({ message: "Account is locked." });
    }

    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      return res.status(403).json({ message: "Account is temporarily locked." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    return res.status(200).json({
      message: "Password verified. Continue to MFA setup or verification.",
      userId: user.user_id,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
