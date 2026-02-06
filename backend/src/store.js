/**
 * store.js
 * --------
 * PostgreSQL-based persistence layer.
 * Replaces the in-memory Map.
 */

const { getPool } = require("./db");

async function set(certHash, record) {
  const pool = getPool();

  // Convert IPFS CID if present, handle new fields
  const {
    studentId, studentName, courseName, institutionName,
    issuanceDate, expiryDate, grade, issuerAddress,
    isValid, txHash, blockNumber, timestamp, ipfsCid
  } = record;

  const query = `
    INSERT INTO certificates (
      certificate_hash, student_id, student_name, course_name, 
      institution_name, issuance_date, expiry_date, grade, 
      issuer_address, is_valid, tx_hash, block_number, timestamp, ipfs_cid
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (certificate_hash) DO UPDATE SET
      is_valid = EXCLUDED.is_valid,
      tx_hash = EXCLUDED.tx_hash,
      block_number = EXCLUDED.block_number,
      timestamp = EXCLUDED.timestamp,
      ipfs_cid = EXCLUDED.ipfs_cid
    RETURNING *;
  `;

  const values = [
    certHash, studentId, studentName, courseName,
    institutionName, issuanceDate, expiryDate, grade,
    issuerAddress, isValid, txHash, blockNumber, timestamp, ipfsCid
  ];

  await pool.query(query, values);
}

async function get(certHash) {
  const pool = getPool();
  const res = await pool.query("SELECT * FROM certificates WHERE certificate_hash = $1", [certHash]);
  if (res.rows.length === 0) return null;
  return toRecord(res.rows[0]);
}

async function getAll() {
  const pool = getPool();
  const res = await pool.query("SELECT * FROM certificates ORDER BY created_at DESC");
  return res.rows.map(toRecord);
}

async function getByStudent(studentId) {
  const pool = getPool();
  // Case-insensitive search for student ID
  const res = await pool.query("SELECT * FROM certificates WHERE LOWER(student_id) = LOWER($1) ORDER BY created_at DESC", [studentId]);
  return res.rows.map(toRecord);
}

async function size() {
  const pool = getPool();
  const res = await pool.query("SELECT COUNT(*) FROM certificates");
  return parseInt(res.rows[0].count);
}

async function clear() {
  const pool = getPool();
  await pool.query("DELETE FROM certificates");
}

// Helper to convert snake_case DB row to camelCase JS object
function toRecord(row) {
  return {
    certificateHash: row.certificate_hash,
    studentId: row.student_id,
    studentName: row.student_name,
    courseName: row.course_name,
    institutionName: row.institution_name,
    issuanceDate: row.issuance_date,
    expiryDate: row.expiry_date,
    grade: row.grade,
    issuerAddress: row.issuer_address,
    isValid: row.is_valid,
    txHash: row.tx_hash,
    blockNumber: parseInt(row.block_number),
    timestamp: parseInt(row.timestamp),
    ipfsCid: row.ipfs_cid,
  };
}

module.exports = { set, get, getAll, getByStudent, size, clear };
