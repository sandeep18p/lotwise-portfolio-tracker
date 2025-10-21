const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'lotwise-worker',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  sasl: process.env.KAFKA_SASL_USERNAME ? {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_SASL_USERNAME,
    password: process.env.KAFKA_SASL_PASSWORD,
  } : undefined,
  ssl: true,
});

const consumer = kafka.consumer({ 
  groupId: process.env.KAFKA_GROUP_ID || 'lotwise-worker-group' 
});

const connectConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected');
  } catch (error) {
    console.error('Failed to connect Kafka consumer:', error);
    throw error;
  }
};

const disconnectConsumer = async () => {
  try {
    await consumer.disconnect();
    console.log('Kafka consumer disconnected');
  } catch (error) {
    console.error('Failed to disconnect Kafka consumer:', error);
  }
};

const subscribeToTrades = async (messageHandler) => {
  try {
    await consumer.subscribe({ 
      topic: process.env.KAFKA_TOPIC || 'trades',
      fromBeginning: false 
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const tradeData = JSON.parse(message.value.toString());
          console.log(`Processing trade: ${tradeData.symbol} ${tradeData.quantity} @ $${tradeData.price}`);
          
          await messageHandler(tradeData);
          
          console.log(`Successfully processed trade ${tradeData.id}`);
        } catch (error) {
          console.error('Error processing message:', error);
          // In production, you might want to send to a dead letter queue
        }
      },
    });

    console.log(`Subscribed to topic: ${process.env.KAFKA_TOPIC || 'trades'}`);
  } catch (error) {
    console.error('Failed to subscribe to trades:', error);
    throw error;
  }
};

module.exports = {
  connectConsumer,
  disconnectConsumer,
  subscribeToTrades,
};
