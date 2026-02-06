const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function initDb() {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        certificate_hash VARCHAR(66) PRIMARY KEY,
        student_id VARCHAR(255) NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        institution_name VARCHAR(255) NOT NULL,
        issuance_date VARCHAR(50) NOT NULL,
        expiry_date VARCHAR(50),
        grade VARCHAR(50),
        issuer_address VARCHAR(42),
        is_valid BOOLEAN DEFAULT TRUE,
        tx_hash VARCHAR(66),
        block_number BIGINT,
        timestamp BIGINT,
        ipfs_cid VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        salt VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("[db] Initialized successfully");
    } catch (err) {
        console.error("[db] Initialization failed:", err);
    } finally {
        client.release();
    }
}

function getPool() {
    return pool;
}

module.exports = { initDb, getPool };
