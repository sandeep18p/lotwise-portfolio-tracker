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
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000, // Increased timeout
  allowExitOnIdle: true,
});

// Test the connection with retry logic
let connectionAttempts = 0;
const maxAttempts = 5;

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection test successful');
    client.release();
    return true;
  } catch (err) {
    connectionAttempts++;
    console.error(`❌ Database connection test failed (attempt ${connectionAttempts}/${maxAttempts}):`, err.message);
    
    if (connectionAttempts < maxAttempts) {
      console.log(`⏳ Retrying connection in 5 seconds...`);
      setTimeout(testConnection, 5000);
    } else {
      console.error('❌ Max connection attempts reached. Server will continue without database.');
      // Don't exit - let the server start and handle DB errors gracefully
    }
    return false;
  }
};

// Test connection with retry
testConnection();

pool.on('connect', (client) => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  // Don't exit on pool errors - handle gracefully
});

module.exports = pool;
