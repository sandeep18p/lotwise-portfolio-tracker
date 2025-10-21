const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'lotwise-backend',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
  sasl: process.env.KAFKA_SASL_USERNAME ? {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_SASL_USERNAME,
    password: process.env.KAFKA_SASL_PASSWORD,
  } : undefined,
  ssl: true,
});

const producer = kafka.producer();

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka producer connected');
  } catch (error) {
    console.error('Failed to connect Kafka producer:', error);
  }
};

const disconnectProducer = async () => {
  try {
    await producer.disconnect();
    console.log('Kafka producer disconnected');
  } catch (error) {
    console.error('Failed to disconnect Kafka producer:', error);
  }
};

const publishTrade = async (tradeData) => {
  try {
    await producer.send({
      topic: process.env.KAFKA_TOPIC || 'trades',
      messages: [{
        key: tradeData.symbol,
        value: JSON.stringify(tradeData),
        timestamp: Date.now().toString(),
      }],
    });
    console.log('Trade published to Kafka:', tradeData.symbol);
  } catch (error) {
    console.error('Failed to publish trade to Kafka:', error);
    throw error;
  }
};

module.exports = {
  connectProducer,
  disconnectProducer,
  publishTrade,
};
