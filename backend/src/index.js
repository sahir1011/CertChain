/**
 * index.js  –  Express server entry point
 *
 * Starts the API on PORT (default 3001).
 * On boot it initialises the ethers provider + contract and
 * syncs any previously-issued certificates from the chain
 * into the in-memory store (only the hashes; full metadata
 * must have been cached at issue time).
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const blockchain = require("./blockchain");
const routes = require("./routes");
const { router: authRouter } = require("./auth");

const app = express();
const PORT = process.env.PORT || 3001;

// ── middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(morgan("dev"));
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true, // Allow cookies
}));
app.use(express.json());
app.use(cookieParser()); // Parse cookies

// ── routes ──────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api", routes);

// ── 404 catch-all ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// ── global error handler ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ message: "Internal server error" });
});

// ── bootstrap ───────────────────────────────────────────────
async function bootstrap() {
  console.log("━".repeat(50));
  console.log(" CertChain  –  Backend API");
  console.log("━".repeat(50));

  // Initialise database
  const { initDb } = require("./db");
  await initDb();

  // Load system configuration
  const config = require("./config");
  await config.loadConfig();

  // Initialise ethers connection
  blockchain.init();

  // Quick connectivity check
  try {
    const block = await blockchain.getLatestBlockNumber();
    console.log(`[boot] Sepolia latest block: ${block}`);
  } catch (e) {
    console.error("[boot] ⚠️  Could not reach Sepolia RPC –", e.message);
    console.log("       The server will still start but on-chain calls will fail.");
  }

  app.listen(PORT, () => {
    console.log(`\n✅  Server listening on http://localhost:${PORT}`);
    console.log("    Health  → GET  /api/health");
    console.log("    Login   → POST /api/auth/login");
    console.log("    Logout  → POST /api/auth/logout");
    console.log("    Verify  → GET  /api/auth/verify");
    console.log("    Student Register → POST /api/auth/student/register");
    console.log("    Student Login    → POST /api/auth/student/login");
    console.log("    Student Logout   → POST /api/auth/student/logout");
    console.log("    Student Verify   → GET  /api/auth/student/verify");
    console.log("    Issue   → POST /api/certificates/issue (🔒 admin)");
    console.log("    My Certs → GET  /api/certificates/my-certificates (🔒 student)");
    console.log("    Verify  → GET  /api/certificates/verify/:hash");
    console.log("    List    → GET  /api/certificates");
    console.log("    Student → GET  /api/certificates/student/:id");
    console.log("    Revoke  → POST /api/certificates/revoke\n");
  });
}

bootstrap().catch((e) => {
  console.error("Fatal bootstrap error:", e);
  process.exit(1);
});

module.exports = app;
