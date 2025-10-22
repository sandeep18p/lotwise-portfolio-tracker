const { Pool } = require('pg');
require('dotenv').config();

// Enhanced debug logging
console.log('=== DATABASE CONFIGURATION DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
console.log('DATABASE_URL value:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Log all database-related environment variables
console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('DB_PORT:', process.env.DB_PORT || 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');

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
  
  // Railway/Supabase provides DATABASE_URL as a single connection string
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { 
      rejectUnauthorized: false,
      // Additional SSL options for better compatibility
      checkServerIdentity: () => undefined
    }
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
  connectionTimeoutMillis: 15000, // Increased timeout for Railway
  allowExitOnIdle: true,
  // Additional pool options for Railway
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Connection retry logic
let connectionAttempts = 0;
const maxAttempts = 5;
let isConnected = false;

const testConnection = async () => {
  try {
    console.log(`🔄 Attempting database connection (attempt ${connectionAttempts + 1}/${maxAttempts})...`);
    
    const client = await pool.connect();
    console.log('✅ Database connection test successful');
    console.log('Connection details:', {
      host: client.connectionParameters.host,
      port: client.connectionParameters.port,
      database: client.connectionParameters.database,
      user: client.connectionParameters.user
    });
    
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
    console.error('Error details:', {
      errno: err.errno,
      syscall: err.syscall,
      address: err.address,
      port: err.port
    });
    
    if (connectionAttempts < maxAttempts) {
      const delay = Math.min(5000 * connectionAttempts, 30000); // Exponential backoff, max 30s
      console.log(`⏳ Retrying connection in ${delay/1000} seconds...`);
      setTimeout(testConnection, delay);
    } else {
      console.error('❌ Max connection attempts reached. Server will continue without database.');
      console.error('This may cause API endpoints to fail with 503 errors.');
      isConnected = false;
    }
    return false;
  }
};

// Pool event handlers with enhanced logging
pool.on('connect', (client) => {
  console.log('✅ New client connected to PostgreSQL database');
  console.log('Active connections:', pool.totalCount);
  console.log('Idle connections:', pool.idleCount);
  console.log('Waiting clients:', pool.waitingCount);
});

pool.on('acquire', (client) => {
  console.log('🔄 Client acquired from pool');
});

pool.on('remove', (client) => {
  console.log('🗑️ Client removed from pool');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client:', err);
  console.error('Error details:', {
    code: err.code,
    message: err.message,
    errno: err.errno,
    syscall: err.syscall
  });
  
  // Don't exit on pool errors - handle gracefully
  if (err.code === 'ENETUNREACH' || err.code === 'ECONNREFUSED') {
    console.error('🔄 Network connectivity issue detected. Will retry on next request.');
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

// Export pool with additional debugging methods
module.exports = {
  ...pool,
  
  // Add debugging methods
  getConnectionStatus: () => ({
    isConnected,
    attempts: connectionAttempts,
    maxAttempts,
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount
  }),
  
  // Enhanced query method with better error handling
  query: async (text, params) => {
    const start = Date.now();
    try {
      console.log('🔄 Executing query:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log(`✅ Query executed successfully in ${duration}ms`);
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      console.error(`❌ Query failed after ${duration}ms:`, err.message);
      console.error('Query:', text);
      console.error('Parameters:', params);
      
      // Update connection status on network errors
      if (err.code === 'ENETUNREACH' || err.code === 'ECONNREFUSED') {
        isConnected = false;
        console.error('🔄 Network error detected, connection status updated');
      }
      
      throw err;
    }
  }
};
