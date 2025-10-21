const pool = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create trades table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create lots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lots (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        trade_id INTEGER REFERENCES trades(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create realized_pnl table
    await client.query(`
      CREATE TABLE IF NOT EXISTS realized_pnl (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL,
        quantity_closed INTEGER NOT NULL,
        avg_cost DECIMAL(10,2) NOT NULL,
        sell_price DECIMAL(10,2) NOT NULL,
        realized_pnl DECIMAL(10,2) NOT NULL,
        trade_id INTEGER REFERENCES trades(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
      CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp);
      CREATE INDEX IF NOT EXISTS idx_lots_symbol ON lots(symbol);
      CREATE INDEX IF NOT EXISTS idx_lots_created_at ON lots(created_at);
      CREATE INDEX IF NOT EXISTS idx_realized_pnl_symbol ON realized_pnl(symbol);
    `);

    await client.query('COMMIT');
    console.log('Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

const dropTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query('DROP TABLE IF EXISTS realized_pnl CASCADE');
    await client.query('DROP TABLE IF EXISTS lots CASCADE');
    await client.query('DROP TABLE IF EXISTS trades CASCADE');
    
    await client.query('COMMIT');
    console.log('Database tables dropped successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error dropping tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'up') {
    createTables()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  } else if (command === 'down') {
    dropTables()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  } else {
    console.log('Usage: node migrate.js [up|down]');
    process.exit(1);
  }
}

module.exports = { createTables, dropTables };
