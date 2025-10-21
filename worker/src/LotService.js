const pool = require('./database');

class LotService {
  static async processTrade(symbol, quantity, price, tradeId) {
    if (quantity > 0) {
      // Buy trade - create new lot
      return await this.processBuyTrade(symbol, quantity, price, tradeId);
    } else {
      // Sell trade - apply FIFO matching
      return await this.processSellTrade(symbol, Math.abs(quantity), price, tradeId);
    }
  }

  static async processBuyTrade(symbol, quantity, price, tradeId) {
    const query = `
      INSERT INTO lots (symbol, quantity, price, trade_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [symbol, quantity, price, tradeId];
    const result = await pool.query(query, values);
    console.log(`Created new lot: ${quantity} ${symbol} @ $${price}`);
    return result.rows[0];
  }

  static async processSellTrade(symbol, sellQuantity, sellPrice, tradeId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get open lots for this symbol ordered by creation time (FIFO)
      const lotsQuery = `
        SELECT * FROM lots 
        WHERE symbol = $1 AND quantity > 0 
        ORDER BY created_at ASC
        FOR UPDATE
      `;
      const lotsResult = await client.query(lotsQuery, [symbol]);
      const openLots = lotsResult.rows;

      if (openLots.length === 0) {
        throw new Error(`No open lots found for symbol: ${symbol}`);
      }

      let remainingSellQuantity = sellQuantity;
      const realizedPnLRecords = [];

      for (const lot of openLots) {
        if (remainingSellQuantity <= 0) break;

        const quantityToClose = Math.min(remainingSellQuantity, lot.quantity);
        const realizedPnL = (sellPrice - lot.price) * quantityToClose;

        // Create realized P&L record
        const pnlQuery = `
          INSERT INTO realized_pnl (symbol, quantity_closed, avg_cost, sell_price, realized_pnl, trade_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const pnlValues = [symbol, quantityToClose, lot.price, sellPrice, realizedPnL, tradeId];
        const pnlResult = await client.query(pnlQuery, pnlValues);
        realizedPnLRecords.push(pnlResult.rows[0]);

        // Update lot quantity
        const newQuantity = lot.quantity - quantityToClose;
        if (newQuantity === 0) {
          await client.query('DELETE FROM lots WHERE id = $1', [lot.id]);
        } else {
          await client.query('UPDATE lots SET quantity = $1 WHERE id = $2', [newQuantity, lot.id]);
        }

        remainingSellQuantity -= quantityToClose;
        
        console.log(`Closed ${quantityToClose} shares from lot ${lot.id} at $${lot.price}, P&L: $${realizedPnL}`);
      }

      if (remainingSellQuantity > 0) {
        throw new Error(`Insufficient shares to sell. Requested: ${sellQuantity}, Available: ${sellQuantity - remainingSellQuantity}`);
      }

      await client.query('COMMIT');
      return realizedPnLRecords;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }



  // Missing in worker/src/LotService.js:
static async getPositions() {
  const query = `
    SELECT symbol, 
           SUM(quantity) as total_quantity,
           AVG(price) as avg_cost
    FROM lots 
    WHERE quantity > 0 
    GROUP BY symbol
  `;
  const result = await pool.query(query);
  return result.rows;
}

static async getRealizedPnL() {
  const query = `
    SELECT symbol,
           SUM(quantity_closed) as total_quantity_closed,
           SUM(realized_pnl) as total_realized_pnl,
           AVG(avg_cost) as avg_cost,
           AVG(sell_price) as avg_sell_price
    FROM realized_pnl 
    GROUP BY symbol
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

module.exports = LotService;
