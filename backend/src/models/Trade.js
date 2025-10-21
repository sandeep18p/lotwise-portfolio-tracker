const pool = require('../config/database');

class Trade {
  static async create(symbol, quantity, price, timestamp) {
    const query = `
      INSERT INTO trades (symbol, quantity, price, timestamp)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [symbol, quantity, price, timestamp];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getAll() {
    const query = 'SELECT * FROM trades ORDER BY timestamp DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async getById(id) {
    const query = 'SELECT * FROM trades WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getBySymbol(symbol) {
    const query = 'SELECT * FROM trades WHERE symbol = $1 ORDER BY timestamp ASC';
    const result = await pool.query(query, [symbol]);
    return result.rows;
  }
}

module.exports = Trade;
