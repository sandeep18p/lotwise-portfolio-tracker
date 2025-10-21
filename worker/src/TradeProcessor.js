const LotService = require('./LotService');

class TradeProcessor {
  static async processTradeEvent(tradeData) {
    try {
      console.log(`Processing trade event: ${tradeData.symbol} ${tradeData.quantity} @ $${tradeData.price}`);
      
      const result = await LotService.processTrade(
        tradeData.symbol,
        tradeData.quantity,
        tradeData.price,
        tradeData.id
      );

      console.log(`Successfully processed trade ${tradeData.id}`);
      return result;
    } catch (error) {
      console.error(`Error processing trade ${tradeData.id}:`, error);
      throw error;
    }
  }
}

module.exports = TradeProcessor;
