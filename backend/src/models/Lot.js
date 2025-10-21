const pool = require('../config/database');

class Lot {
  static async create(symbol, quantity, price, tradeId) {
    const query = `
      INSERT INTO lots (symbol, quantity, price, trade_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [symbol, quantity, price, tradeId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getOpenLots(symbol) {
    const query = `
      SELECT * FROM lots 
      WHERE symbol = $1 AND quantity > 0 
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [symbol]);
    return result.rows;
  }

  static async getAllOpenLots() {
    const query = `
      SELECT symbol, SUM(quantity) as total_quantity, 
             SUM(quantity * price) / SUM(quantity) as avg_cost
      FROM lots 
      WHERE quantity > 0 
      GROUP BY symbol
      ORDER BY symbol
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async updateQuantity(id, newQuantity) {
    const query = `
      UPDATE lots 
      SET quantity = $1 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [newQuantity, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM lots WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async getLotById(id) {
    const query = 'SELECT * FROM lots WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Lot;
