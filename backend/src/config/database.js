const { Pool } = require('pg');
require('dotenv').config();

// Debug logging
console.log('=== DATABASE CONFIGURATION DEBUG ===');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL value:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Handle Railway's DATABASE_URL format or individual variables
let dbConfig;
if (process.env.DATABASE_URL) {
  console.log('✅ Using DATABASE_URL for connection');
  // Railway/Supabase provides DATABASE_URL as a single connection string
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
} else {
  console.log('⚠️ Using individual DB variables for connection');
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

console.log('Final dbConfig:', JSON.stringify(dbConfig, null, 2));
console.log('=====================================');

const pool = new Pool({
  ...dbConfig,
  max: 10, // Reduced from 20
  idleTimeoutMillis: 10000, // Reduced from 30000
  connectionTimeoutMillis: 5000, // Increased from 2000
  allowExitOnIdle: true, // Allow process to exit when idle
});

// Test the connection
pool.on('connect', (client) => {
  console.log('✅ Connected to PostgreSQL database');
  console.log('Connection details:', client.connectionParameters);
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection immediately
pool.connect()
  .then(client => {
    console.log('✅ Database connection test successful');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection test failed:', err);
    process.exit(-1);
  });

module.exports = pool;
