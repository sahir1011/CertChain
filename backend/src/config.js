
const { getPool } = require("./db");

let configCache = {};
let isLoaded = false;

async function loadConfig() {
    const pool = getPool();
    try {
        const res = await pool.query("SELECT key, value FROM system_settings");
        res.rows.forEach(row => {
            configCache[row.key] = row.value;
        });
        isLoaded = true;
        console.log("[config] Configuration loaded from database.");
        return configCache;
    } catch (error) {
        console.error("[config] Failed to load configuration from database:", error);
        throw error;
    }
}

function get(key) {
    if (!isLoaded) {
        console.warn(`[config] Warning: Accessing config key '${key}' before dynamic load. fallback to cache/env.`);
    }
    return configCache[key];
}

module.exports = { loadConfig, get };
