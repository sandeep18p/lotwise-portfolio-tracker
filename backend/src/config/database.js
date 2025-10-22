const { Pool } = require('pg');
require('dotenv').config();

// Enhanced debug logging
console.log('=== DATABASE CONFIGURATION DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);

// Handle Railway's DATABASE_URL format or individual variables
let dbConfig;
if (process.env.DATABASE_URL) {
  console.log('✅ Using DATABASE_URL for connection');
  
  // Parse the connection string to extract components for debugging
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('Parsed DATABASE_URL components:');
    console.log('- Protocol:', url.protocol);
    console.log('- Host:', url.hostname);
    console.log('- Port:', url.port);
    console.log('- Database:', url.pathname.substring(1));
    console.log('- Username:', url.username);
    console.log('- Password:', url.password ? 'SET' : 'NOT SET');
  } catch (parseError) {
    console.error('❌ Error parsing DATABASE_URL:', parseError.message);
  }
  
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { 
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined
    }
  };
} else {
  console.log('⚠️ Using individual DB variables for connection');
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'lotwise_portfolio',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_HOST?.includes('supabase.co') ? { 
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined
    } : false,
  };
}

console.log('Final dbConfig:', JSON.stringify(dbConfig, null, 2));
console.log('=====================================');

// Create pool with enhanced configuration
const pool = new Pool({
  ...dbConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  allowExitOnIdle: true,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Connection status tracking
let connectionAttempts = 0;
const maxAttempts = 3;
let isConnected = false;

const testConnection = async () => {
  try {
    console.log(`🔄 Attempting database connection (attempt ${connectionAttempts + 1}/${maxAttempts})...`);
    
    const client = await pool.connect();
    console.log('✅ Database connection test successful');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database query test successful:', result.rows[0]);
    
    client.release();
    isConnected = true;
    return true;
  } catch (err) {
    connectionAttempts++;
    console.error(`❌ Database connection test failed (attempt ${connectionAttempts}/${maxAttempts}):`);
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    
    if (connectionAttempts < maxAttempts) {
      const delay = Math.min(5000 * connectionAttempts, 30000);
      console.log(`⏳ Retrying connection in ${delay/1000} seconds...`);
      setTimeout(testConnection, delay);
    } else {
      console.error('❌ Max connection attempts reached. Server will continue without database.');
      console.error('API endpoints will return 503 errors for database operations.');
      isConnected = false;
    }
    return false;
  }
};

// Pool event handlers
pool.on('connect', (client) => {
  console.log('✅ New client connected to PostgreSQL database');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err);
  
  if (err.code === 'ENETUNREACH' || err.code === 'ECONNREFUSED') {
    console.error('🔄 Network connectivity issue detected.');
    isConnected = false;
  }
});

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('🔄 Gracefully shutting down database pool...');
  try {
    await pool.end();
    console.log('✅ Database pool closed successfully');
  } catch (err) {
    console.error('❌ Error closing database pool:', err);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Test connection with retry
testConnection();

// Export pool with enhanced error handling
module.exports = {
  ...pool,
  
  // Enhanced query method with better error handling
  query: async (text, params) => {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (err) {
      console.error(`❌ Query failed:`, err.message);
      console.error('Query:', text);
      
      // Update connection status on network errors
      if (err.code === 'ENETUNREACH' || err.code === 'ECONNREFUSED') {
        isConnected = false;
        console.error('🔄 Network error detected, connection status updated');
      }
      
      throw err;
    }
  },
  
  // Get connection status
  getConnectionStatus: () => ({
    isConnected,
    attempts: connectionAttempts,
    maxAttempts
  })
};
