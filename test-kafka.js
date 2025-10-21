const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'test-client',
  brokers: [process.env.KAFKA_BROKERS],
  sasl: {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_SASL_USERNAME,
    password: process.env.KAFKA_SASL_PASSWORD,
  },
  ssl: true,
});

async function testConnection() {
  const producer = kafka.producer();
  
  try {
    await producer.connect();
    console.log('✅ Successfully connected to Redpanda Cloud!');
    
    // Send a test message
    await producer.send({
      topic: 'trades',
      messages: [{
        key: 'test',
        value: JSON.stringify({ test: 'message', timestamp: Date.now() }),
      }],
    });
    
    console.log('✅ Test message sent successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await producer.disconnect();
  }
}

testConnection();