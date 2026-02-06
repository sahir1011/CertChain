/**
 * auth.js
 * -------
 * Authentication system with session management for both admins and students.
 * 
 * Admin Endpoints:
 * - POST /api/auth/login          - Authenticate admin and create session
 * - POST /api/auth/logout         - Destroy admin session
 * - GET  /api/auth/verify         - Check if admin session is valid
 * 
 * Student Endpoints:
 * - POST /api/auth/student/register  - Register new student account
 * - POST /api/auth/student/login     - Authenticate student and create session
 * - POST /api/auth/student/logout    - Destroy student session
 * - GET  /api/auth/student/verify    - Check if student session is valid
 * 
 * Middleware:
 * - requireAuth        - Protect routes that require admin authentication
 * - requireStudentAuth - Protect routes that require student authentication
 */

const express = require("express");
const crypto = require("crypto");

const router = express.Router();

// ── In-memory session stores ─────────────────────────────────────────
// NOTE: Sessions will be lost on server restart.
// For production, use Redis or database-backed sessions.
const adminSessions = new Map();
const studentSessions = new Map();

// ── In-memory student account store ──────────────────────────────────
// Stores: username → { passwordHash, salt, studentId }
const studentAccounts = new Map();

// Session expiry: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// ── Helper: Generate session token ───────────────────────────────────
function generateSessionToken() {
    return crypto.randomBytes(32).toString("hex");
}

// ── Helper: Generate salt ────────────────────────────────────────────
function generateSalt() {
    return crypto.randomBytes(16).toString("hex");
}

// ── Helper: Hash password ────────────────────────────────────────────
function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

// ── Helper: Clean expired sessions ───────────────────────────────────
function cleanExpiredSessions() {
    const now = Date.now();

    // Clean admin sessions
    for (const [token, session] of adminSessions.entries()) {
        if (now > session.expiresAt) {
            adminSessions.delete(token);
        }
    }

    // Clean student sessions
    for (const [token, session] of studentSessions.entries()) {
        if (now > session.expiresAt) {
            studentSessions.delete(token);
        }
    }
}

// Clean expired sessions every hour
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

// ══════════════════════════════════════════════════════════════════════
// ADMIN AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════

// ── ADMIN LOGIN ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        const { getPool } = require("./db");
        const pool = getPool();

        const result = await pool.query("SELECT * FROM admins WHERE username = $1", [username]);
        const admin = result.rows[0];

        if (!admin) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Verify password
        const passwordHash = hashPassword(password, admin.salt);
        if (passwordHash !== admin.password_hash) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Create session
        const sessionToken = generateSessionToken();
        const expiresAt = Date.now() + SESSION_DURATION;

        adminSessions.set(sessionToken, {
            username: admin.username,
            role: "admin",
            createdAt: Date.now(),
            expiresAt,
        });

        // Set session cookie
        res.cookie("sessionToken", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: SESSION_DURATION,
        });

        res.json({
            success: true,
            message: "Login successful.",
            user: { username: admin.username },
        });
    } catch (e) {
        console.error("[auth/login]", e);
        res.status(500).json({ message: "Login failed." });
    }
});

// ── ADMIN LOGOUT ─────────────────────────────────────────────────────
router.post("/logout", (req, res) => {
    try {
        const sessionToken = req.cookies?.sessionToken;

        if (sessionToken) {
            adminSessions.delete(sessionToken);
        }

        res.clearCookie("sessionToken");
        res.json({ success: true, message: "Logout successful." });
    } catch (e) {
        console.error("[auth/logout]", e);
        res.status(500).json({ message: "Logout failed." });
    }
});

// ── ADMIN VERIFY ─────────────────────────────────────────────────────
router.get("/verify", (req, res) => {
    try {
        const sessionToken = req.cookies?.sessionToken;

        if (!sessionToken) {
            return res.status(401).json({ authenticated: false, message: "No session found." });
        }

        const session = adminSessions.get(sessionToken);

        if (!session) {
            res.clearCookie("sessionToken");
            return res.status(401).json({ authenticated: false, message: "Invalid session." });
        }

        // Check if session expired
        if (Date.now() > session.expiresAt) {
            adminSessions.delete(sessionToken);
            res.clearCookie("sessionToken");
            return res.status(401).json({ authenticated: false, message: "Session expired." });
        }

        res.json({
            authenticated: true,
            user: { username: session.username },
        });
    } catch (e) {
        console.error("[auth/verify]", e);
        res.status(500).json({ message: "Verification failed." });
    }
});

// ══════════════════════════════════════════════════════════════════════
// STUDENT AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════

// ── STUDENT REGISTER ─────────────────────────────────────────────────
router.post("/student/register", (req, res) => {
    try {
        const { username, password, studentId } = req.body;

        if (!username || !password || !studentId) {
            return res.status(400).json({ message: "Username, password, and student ID are required." });
        }

        // Validate username format (alphanumeric, 3-20 chars)
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return res.status(400).json({ message: "Username must be 3-20 alphanumeric characters." });
        }

        // Validate password strength (min 6 chars)
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long." });
        }

        // Check if username already exists
        if (studentAccounts.has(username.toLowerCase())) {
            return res.status(409).json({ message: "Username already exists." });
        }

        // Hash password
        const salt = generateSalt();
        const passwordHash = hashPassword(password, salt);

        // Store student account
        studentAccounts.set(username.toLowerCase(), {
            passwordHash,
            salt,
            studentId,
        });

        res.status(201).json({
            success: true,
            message: "Student account created successfully.",
            user: { username, studentId },
        });
    } catch (e) {
        console.error("[auth/student/register]", e);
        res.status(500).json({ message: "Registration failed." });
    }
});

// ── STUDENT LOGIN ────────────────────────────────────────────────────
router.post("/student/login", (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        // Get student account
        const account = studentAccounts.get(username.toLowerCase());

        if (!account) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Verify password
        const passwordHash = hashPassword(password, account.salt);
        if (passwordHash !== account.passwordHash) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Create session
        const sessionToken = generateSessionToken();
        const expiresAt = Date.now() + SESSION_DURATION;

        studentSessions.set(sessionToken, {
            username,
            studentId: account.studentId,
            role: "student",
            createdAt: Date.now(),
            expiresAt,
        });

        // Set session cookie (different name from admin)
        res.cookie("studentSessionToken", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: SESSION_DURATION,
        });

        res.json({
            success: true,
            message: "Login successful.",
            user: { username, studentId: account.studentId },
        });
    } catch (e) {
        console.error("[auth/student/login]", e);
        res.status(500).json({ message: "Login failed." });
    }
});

// ── STUDENT LOGOUT ───────────────────────────────────────────────────
router.post("/student/logout", (req, res) => {
    try {
        const sessionToken = req.cookies?.studentSessionToken;

        if (sessionToken) {
            studentSessions.delete(sessionToken);
        }

        res.clearCookie("studentSessionToken");
        res.json({ success: true, message: "Logout successful." });
    } catch (e) {
        console.error("[auth/student/logout]", e);
        res.status(500).json({ message: "Logout failed." });
    }
});

// ── STUDENT VERIFY ───────────────────────────────────────────────────
router.get("/student/verify", (req, res) => {
    try {
        const sessionToken = req.cookies?.studentSessionToken;

        if (!sessionToken) {
            return res.status(401).json({ authenticated: false, message: "No session found." });
        }

        const session = studentSessions.get(sessionToken);

        if (!session) {
            res.clearCookie("studentSessionToken");
            return res.status(401).json({ authenticated: false, message: "Invalid session." });
        }

        // Check if session expired
        if (Date.now() > session.expiresAt) {
            studentSessions.delete(sessionToken);
            res.clearCookie("studentSessionToken");
            return res.status(401).json({ authenticated: false, message: "Session expired." });
        }

        res.json({
            authenticated: true,
            user: { username: session.username, studentId: session.studentId },
        });
    } catch (e) {
        console.error("[auth/student/verify]", e);
        res.status(500).json({ message: "Verification failed." });
    }
});

// ══════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════

// ── MIDDLEWARE: Require Admin Authentication ────────────────────────
function requireAuth(req, res, next) {
    const sessionToken = req.cookies?.sessionToken;

    if (!sessionToken) {
        return res.status(401).json({ message: "Authentication required." });
    }

    const session = adminSessions.get(sessionToken);

    if (!session) {
        res.clearCookie("sessionToken");
        return res.status(401).json({ message: "Invalid session." });
    }

    // Check if session expired
    if (Date.now() > session.expiresAt) {
        adminSessions.delete(sessionToken);
        res.clearCookie("sessionToken");
        return res.status(401).json({ message: "Session expired." });
    }

    // Attach user info to request
    req.user = { username: session.username };
    next();
}

// ── MIDDLEWARE: Require Student Authentication ──────────────────────
function requireStudentAuth(req, res, next) {
    const sessionToken = req.cookies?.studentSessionToken;

    if (!sessionToken) {
        return res.status(401).json({ message: "Student authentication required." });
    }

    const session = studentSessions.get(sessionToken);

    if (!session) {
        res.clearCookie("studentSessionToken");
        return res.status(401).json({ message: "Invalid session." });
    }

    // Check if session expired
    if (Date.now() > session.expiresAt) {
        studentSessions.delete(sessionToken);
        res.clearCookie("studentSessionToken");
        return res.status(401).json({ message: "Session expired." });
    }

    // Attach student info to request
    req.student = { username: session.username, studentId: session.studentId };
    next();
}

module.exports = { router, requireAuth, requireStudentAuth };
