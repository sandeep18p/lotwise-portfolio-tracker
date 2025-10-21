# Worker Environment Variables

Create a `.env` file in the worker directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lotwise_portfolio
DB_USER=postgres
DB_PASSWORD=your_password

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=lotwise-worker
KAFKA_GROUP_ID=lotwise-worker-group
KAFKA_TOPIC=trades

# Worker Configuration
WORKER_INTERVAL=1000
BATCH_SIZE=10
```

## Running the Worker

```bash
npm install
npm run dev
```

The worker will consume trade events from Kafka and process them using FIFO logic.
