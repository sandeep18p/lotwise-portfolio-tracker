
const { Pool } = require('pg');
require('dotenv').config();


let dbConfig;
if (process.env.DATABASE_URL) {
  // Railway provides DATABASE_URL as a single connection string
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
} else {
  // Fallback to individual environment variables
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'lotwise_portfolio',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_HOST?.includes('supabase.co') ? { rejectUnauthorized: false } : false,
  };
}

const pool = new Pool({
  ...dbConfig,  // ✅ THIS IS THE KEY LINE!
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
