require("dotenv").config();
const { Pool } = require("pg");
const crypto = require("crypto");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

function generateSalt() {
    return crypto.randomBytes(16).toString("hex");
}

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

async function seedAdmin() {
    try {
        const username = process.env.ADMIN_USERNAME || "admin";
        const password = process.env.ADMIN_PASSWORD || "admin123";

        const client = await pool.connect();
        try {
            // Check if admin already exists
            const res = await client.query("SELECT * FROM admins WHERE username = $1", [username]);
            if (res.rows.length > 0) {
                console.log(`Admin user '${username}' already exists.`);
                return;
            }

            const salt = generateSalt();
            const passwordHash = hashPassword(password, salt);

            await client.query(
                "INSERT INTO admins (username, password_hash, salt) VALUES ($1, $2, $3)",
                [username, passwordHash, salt]
            );

            console.log(`Admin user '${username}' created successfully.`);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error seeding admin:", err);
    } finally {
        await pool.end();
    }
}

seedAdmin();
