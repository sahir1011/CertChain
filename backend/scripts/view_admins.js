require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function listAdmins() {
    try {
        const client = await pool.connect();
        try {
            const res = await client.query("SELECT id, username, created_at FROM admins");
            console.log("\nRegistered Admins:");
            console.log(JSON.stringify(res.rows, null, 2));
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error connecting to database:", err);
    } finally {
        await pool.end();
    }
}

listAdmins();
