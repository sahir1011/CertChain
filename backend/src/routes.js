const express = require("express");
const { ethers } = require("ethers");
const crypto = require("crypto");

const blockchain = require("./blockchain");
const store = require("./store");
const { uploadToIPFS } = require("./ipfs");
const { requireAuth, requireStudentAuth } = require("./auth");

const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────────────
function sha256(payload) {
  return "0x" + crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function toBytes32(hexHash) {
  // Ensure the hash is exactly 32 bytes (64 hex chars) with 0x prefix
  return ethers.dataSlice(hexHash, 0, 32);
}

// ── HEALTH ───────────────────────────────────────────────────────────────
router.get("/health", async (req, res) => {
  try {
    const blockNumber = await blockchain.getLatestBlockNumber();
    res.json({
      status: "ok",
      contractAddress: process.env.CONTRACT_ADDRESS,
      network: "sepolia",
      blockNumber,
    });
  } catch (e) {
    res.status(503).json({ status: "error", message: e.message });
  }
});

// ── ISSUE ────────────────────────────────────────────────────────────────
// 🔒 PROTECTED: Requires admin authentication
router.post("/certificates/issue", requireAuth, async (req, res) => {
  try {
    const { studentName, studentId, courseName, institutionName, issuanceDate, expiryDate, grade, issuerAddress } = req.body;

    // Validate required fields
    if (!studentName || !studentId || !courseName || !institutionName || !issuanceDate) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Build canonical payload (deterministic key order)
    const payload = {
      studentName,
      studentId,
      courseName,
      institutionName,
      issuanceDate,
      expiryDate: expiryDate || "",
      grade: grade || "",
    };

    // SHA-256 → bytes32
    const certHash = sha256(payload);
    const certHashBytes32 = toBytes32(certHash);

    // Check duplicate in local cache
    const existing = await store.get(certHash);
    if (existing) {
      return res.status(409).json({ message: "A certificate with this exact payload already exists." });
    }

    // ── IPFS Upload ──
    const ipfsCid = await uploadToIPFS(payload);

    // ── On-chain transaction ──
    const { txHash, blockNumber, issuedAt } = await blockchain.issueCertOnChain(certHashBytes32, studentId, ipfsCid);

    // ── Save to DB ──
    const record = {
      certificateHash: certHash,
      studentName,
      studentId,
      courseName,
      institutionName,
      issuanceDate,
      expiryDate: expiryDate || "",
      grade: grade || "",
      isValid: true,
      issuerAddress: issuerAddress || (await blockchain.getSigner()).address,
      txHash,
      blockNumber,
      timestamp: issuedAt,
      ipfsCid,
    };

    await store.set(certHash, record);

    res.status(201).json(record);
  } catch (e) {
    console.error("[issue]", e);
    res.status(500).json({ message: e.message || "Failed to issue certificate." });
  }
});

// ── VERIFY ───────────────────────────────────────────────────────────────
router.get("/certificates/verify/:hash", async (req, res) => {
  try {
    let hash = req.params.hash.trim();

    // Normalise: accept with or without 0x
    if (!hash.startsWith("0x")) hash = "0x" + hash;

    const certHashBytes32 = toBytes32(hash);

    // ── On-chain check ──
    const onChain = await blockchain.verifyCertOnChain(certHashBytes32);

    if (!onChain.exists) {
      return res.json({
        isValid: false,
        certificate: null,
        message: "Certificate hash not found on-chain.",
      });
    }

    // ── Merge with local DB for the full record ──
    let cached = await store.get(hash);

    // Sync validity from chain
    if (cached) {
      if (cached.isValid !== onChain.isValid) {
        cached.isValid = onChain.isValid;
        // In a real app we might update DB here, but lazy validation is okay too
      }
    } else {
      // Reconstruct partial record if specific to this node is lost
      // (We won't have the student name etc. unless we fetch from IPFS here, 
      // but for now return minimal info)
      cached = {
        certificateHash: hash,
        isValid: onChain.isValid,
        issuerAddress: onChain.issuer,
        timestamp: onChain.issuedAt,
        ipfsCid: onChain.ipfsCid,
        studentName: "Unknown (Missing Local Data)",
        courseName: "Unknown",
        institutionName: "Unknown",
        issuanceDate: new Date(onChain.issuedAt * 1000).toISOString().split("T")[0],
      };
    }

    res.json({
      isValid: onChain.isValid,
      certificate: cached,
      message: onChain.isValid ? "Certificate is valid." : "Certificate has been revoked.",
    });
  } catch (e) {
    console.error("[verify]", e);
    res.status(500).json({ message: e.message || "Verification failed." });
  }
});

// ── BY STUDENT ───────────────────────────────────────────────────────────
router.get("/certificates/student/:studentId", async (req, res) => {
  try {
    const results = await store.getByStudent(req.params.studentId);
    res.json(results);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── MY CERTIFICATES (Student Protected) ──────────────────────────────────
// 🔒 PROTECTED: Requires student authentication
router.get("/certificates/my-certificates", requireStudentAuth, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    const certificates = await store.getByStudent(studentId);
    res.json(certificates);
  } catch (e) {
    console.error("[my-certificates]", e);
    res.status(500).json({ message: e.message || "Failed to fetch certificates." });
  }
});

// ── LIST ALL ─────────────────────────────────────────────────────────────
router.get("/certificates", async (req, res) => {
  try {
    res.json(await store.getAll());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── REVOKE ───────────────────────────────────────────────────────────────
router.post("/certificates/revoke", async (req, res) => {
  try {
    const { certificateHash } = req.body;
    if (!certificateHash) {
      return res.status(400).json({ message: "certificateHash is required." });
    }

    let hash = certificateHash.trim();
    if (!hash.startsWith("0x")) hash = "0x" + hash;

    const certHashBytes32 = toBytes32(hash);

    // On-chain revoke
    const { txHash } = await blockchain.revokeCertOnChain(certHashBytes32);

    // Update local cache
    const cached = await store.get(hash);
    if (cached) {
      // We'd ideally update validity in DB here
      // For now, let verify() handle it on read or implement update
      // For completeness let's do a simple DB update if we had an update function
      // Since we don't, we rely on verify() or re-set
      cached.isValid = false;
      await store.set(hash, cached);
    }

    res.json({ txHash, message: "Certificate revoked." });
  } catch (e) {
    console.error("[revoke]", e);
    res.status(500).json({ message: e.message || "Revocation failed." });
  }
});

module.exports = router;
