const Trade = require('../models/Trade');
const LotService = require('../services/LotService');

const seedDemoData = async () => {
  try {
    console.log('Seeding demo data...');

    // Test scenario trades
    const demoTrades = [
      { symbol: 'AAPL', quantity: 100, price: 150.00, timestamp: new Date('2024-01-01T10:00:00Z') },
      { symbol: 'AAPL', quantity: 50, price: 160.00, timestamp: new Date('2024-01-02T10:00:00Z') },
      { symbol: 'AAPL', quantity: -80, price: 170.00, timestamp: new Date('2024-01-03T10:00:00Z') },
      { symbol: 'GOOGL', quantity: 25, price: 2800.00, timestamp: new Date('2024-01-04T10:00:00Z') },
      { symbol: 'MSFT', quantity: 75, price: 400.00, timestamp: new Date('2024-01-05T10:00:00Z') },
      { symbol: 'MSFT', quantity: -25, price: 420.00, timestamp: new Date('2024-01-06T10:00:00Z') },
    ];

    for (const tradeData of demoTrades) {
      const trade = await Trade.create(
        tradeData.symbol,
        tradeData.quantity,
        tradeData.price,
        tradeData.timestamp
      );

      // Process the trade through lot service
      await LotService.processTrade(
        trade.symbol,
        trade.quantity,
        trade.price,
        trade.id
      );

      console.log(`Processed trade: ${trade.quantity} ${trade.symbol} @ $${trade.price}`);
    }

    console.log('Demo data seeded successfully!');
    console.log('\nExpected results:');
    console.log('- AAPL: 70 shares remaining (20 from first lot, 50 from second lot)');
    console.log('- AAPL: $1,600 realized P&L (80 shares × $20 profit)');
    console.log('- GOOGL: 25 shares');
    console.log('- MSFT: 50 shares, $500 realized P&L (25 shares × $20 profit)');

  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDemoData };
