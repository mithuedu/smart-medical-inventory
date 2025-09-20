const { Pool } = require("pg");
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
    // Use the full DATABASE_URL (for remote databases like yours)
    console.log('🌐 Using remote database connection');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Required for remote databases
        }
    });
} else {
    // Fallback to individual environment variables (for local)
    console.log('🏠 Using local database connection');
    pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'medical_inventory',
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    });
}

// Test connection on startup
pool.on('connect', (client) => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err, client) => {
    console.error('❌ Database connection error:', err);
});

module.exports = pool;
