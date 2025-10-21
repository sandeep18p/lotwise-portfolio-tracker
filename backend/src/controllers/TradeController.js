const Trade = require('../models/Trade');
const LotService = require('../services/LotService');
const { publishTrade } = require('../config/kafka');

class TradeController {
  static async createTrade(req, res) {
    try {
      const { symbol, quantity, price, timestamp } = req.body;

      // Validate input
      if (!symbol || !quantity || !price) {
        return res.status(400).json({
          error: 'Missing required fields: symbol, quantity, price'
        });
      }

      if (quantity === 0) {
        return res.status(400).json({
          error: 'Quantity cannot be zero'
        });
      }

      // Create trade record
      const trade = await Trade.create(
        symbol.toUpperCase(),
        quantity,
        price,
        timestamp || new Date()
      );

      // Publish to Kafka for worker processing
      await publishTrade({
        id: trade.id,
        symbol: trade.symbol,
        quantity: trade.quantity,
        price: trade.price,
        timestamp: trade.timestamp
      });

      res.status(201).json({
        message: 'Trade created successfully',
        trade
      });
    } catch (error) {
      console.error('Error creating trade:', error);
      res.status(500).json({
        error: 'Failed to create trade',
        details: error.message
      });
    }
  }

  static async getAllTrades(req, res) {
    try {
      const trades = await Trade.getAll();
      res.json({ trades });
    } catch (error) {
      console.error('Error fetching trades:', error);
      res.status(500).json({
        error: 'Failed to fetch trades',
        details: error.message
      });
    }
  }
}

module.exports = TradeController;
