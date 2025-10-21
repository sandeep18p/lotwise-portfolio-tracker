const pool = require('../config/database');

class RealizedPnL {
  static async create(symbol, quantityClosed, avgCost, sellPrice, realizedPnL, tradeId) {
    const query = `
      INSERT INTO realized_pnl (symbol, quantity_closed, avg_cost, sell_price, realized_pnl, trade_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [symbol, quantityClosed, avgCost, sellPrice, realizedPnL, tradeId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getAll() {
    const query = 'SELECT * FROM realized_pnl ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async getBySymbol(symbol) {
    const query = 'SELECT * FROM realized_pnl WHERE symbol = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [symbol]);
    return result.rows;
  }

  static async getSummary() {
    const query = `
      SELECT 
        symbol,
        SUM(quantity_closed) as total_quantity_closed,
        SUM(realized_pnl) as total_realized_pnl,
        AVG(avg_cost) as avg_cost,
        AVG(sell_price) as avg_sell_price
      FROM realized_pnl 
      GROUP BY symbol
      ORDER BY total_realized_pnl DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getTotalRealizedPnL() {
    const query = 'SELECT SUM(realized_pnl) as total FROM realized_pnl';
    const result = await pool.query(query);
    return result.rows[0].total || 0;
  }
}

module.exports = RealizedPnL;
