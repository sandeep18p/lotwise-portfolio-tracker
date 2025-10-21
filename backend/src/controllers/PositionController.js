const LotService = require('../services/LotService');

class PositionController {
  static async getPositions(req, res) {
    try {
      const positions = await LotService.getPositions();
      
      res.json({
        positions: positions.map(pos => ({
          symbol: pos.symbol,
          quantity: parseInt(pos.total_quantity),
          averageCost: parseFloat(pos.avg_cost),
          totalValue: parseFloat(pos.total_quantity) * parseFloat(pos.avg_cost)
        }))
      });
    } catch (error) {
      console.error('Error fetching positions:', error);
      res.status(500).json({
        error: 'Failed to fetch positions',
        details: error.message
      });
    }
  }
}

module.exports = PositionController;
