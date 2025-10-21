const { connectConsumer, disconnectConsumer, subscribeToTrades } = require('./kafka');
const TradeProcessor = require('./TradeProcessor');

class Worker {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    try {
      console.log('Starting Lotwise Portfolio Worker...');
      
      // Connect to Kafka
      await connectConsumer();
      
      // Subscribe to trade events
      await subscribeToTrades(this.handleTradeMessage.bind(this));
      
      this.isRunning = true;
      console.log('Worker started successfully');
      
      // Keep the process alive
      process.on('SIGINT', this.gracefulShutdown.bind(this));
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      
    } catch (error) {
      console.error('Failed to start worker:', error);
      process.exit(1);
    }
  }

  async handleTradeMessage(tradeData) {
    try {
      await TradeProcessor.processTradeEvent(tradeData);
    } catch (error) {
      console.error('Error handling trade message:', error);
      // In production, you might want to implement retry logic or dead letter queue
    }
  }

  async gracefulShutdown() {
    if (!this.isRunning) return;
    
    console.log('Received shutdown signal, closing worker gracefully...');
    this.isRunning = false;
    
    try {
      await disconnectConsumer();
      console.log('Worker shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start worker if called directly
if (require.main === module) {
  const worker = new Worker();
  worker.start().catch((error) => {
    console.error('Worker failed to start:', error);
    process.exit(1);
  });
}

module.exports = Worker;
