const Lot = require('../models/Lot');
const RealizedPnL = require('../models/RealizedPnL');

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
    const lot = await Lot.create(symbol, quantity, price, tradeId);
    console.log(`Created new lot: ${quantity} ${symbol} @ $${price}`);
    return lot;
  }

  static async processSellTrade(symbol, sellQuantity, sellPrice, tradeId) {
    const openLots = await Lot.getOpenLots(symbol);
    
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
      const pnlRecord = await RealizedPnL.create(
        symbol,
        quantityToClose,
        lot.price,
        sellPrice,
        realizedPnL,
        tradeId
      );
      realizedPnLRecords.push(pnlRecord);

      // Update lot quantity
      const newQuantity = lot.quantity - quantityToClose;
      if (newQuantity === 0) {
        await Lot.delete(lot.id);
      } else {
        await Lot.updateQuantity(lot.id, newQuantity);
      }

      remainingSellQuantity -= quantityToClose;
      
      console.log(`Closed ${quantityToClose} shares from lot ${lot.id} at $${lot.price}, P&L: $${realizedPnL}`);
    }

    if (remainingSellQuantity > 0) {
      throw new Error(`Insufficient shares to sell. Requested: ${sellQuantity}, Available: ${sellQuantity - remainingSellQuantity}`);
    }

    return realizedPnLRecords;
  }

  static async getPositions() {
    return await Lot.getAllOpenLots();
  }

  static async getRealizedPnL() {
    return await RealizedPnL.getSummary();
  }

  static async getTotalRealizedPnL() {
    return await RealizedPnL.getTotalRealizedPnL();
  }
}

module.exports = LotService;
