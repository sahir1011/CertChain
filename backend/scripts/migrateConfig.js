require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const SETTINGS_TO_MIGRATE = [
    { key: "SEPOLIA_RPC_URL", desc: "RPC URL for Sepolia testnet" },
    { key: "PRIVATE_KEY", desc: "Wallet private key for transactions" },
    { key: "CONTRACT_ADDRESS", desc: "Deployed smart contract address" },
    { key: "PINATA_API_KEY", desc: "Pinata IPFS API Key" },
    { key: "PINATA_SECRET_KEY", desc: "Pinata IPFS Secret Key" },
];

async function migrateConfig() {
    try {
        const client = await pool.connect();
        try {
            console.log("Migrating configuration to database...");

            for (const setting of SETTINGS_TO_MIGRATE) {
                const value = process.env[setting.key];

                if (!value) {
                    console.warn(`[SKIP] ${setting.key} not found in .env`);
                    continue;
                }

                // Upsert logic
                await client.query(
                    `INSERT INTO system_settings (key, value, description, updated_at) 
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (key) 
           DO UPDATE SET value = $2, updated_at = NOW()`,
                    [setting.key, value, setting.desc]
                );

                console.log(`[OK] Migrated ${setting.key}`);
            }

            console.log("Migration complete.");
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrateConfig();
