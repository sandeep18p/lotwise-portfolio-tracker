const LotService = require('../services/LotService');

class PnLController {
  static async getRealizedPnL(req, res) {
    try {
      const realizedPnL = await LotService.getRealizedPnL();
      const totalRealizedPnL = await LotService.getTotalRealizedPnL();
      
      res.json({
        realizedPnL: realizedPnL.map(pnl => ({
          symbol: pnl.symbol,
          totalQuantityClosed: parseInt(pnl.total_quantity_closed),
          totalRealizedPnL: parseFloat(pnl.total_realized_pnl),
          averageCost: parseFloat(pnl.avg_cost),
          averageSellPrice: parseFloat(pnl.avg_sell_price)
        })),
        totalRealizedPnL: parseFloat(totalRealizedPnL)
      });
    } catch (error) {
      console.error('Error fetching realized P&L:', error);
      res.status(500).json({
        error: 'Failed to fetch realized P&L',
        details: error.message
      });
    }
  }
}

module.exports = PnLController;
