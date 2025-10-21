# Backend API Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lotwise_portfolio
DB_USER=postgres
DB_PASSWORD=your_password

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=lotwise-backend
KAFKA_TOPIC=trades

# Security
JWT_SECRET=your_jwt_secret_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Database Setup

1. Install PostgreSQL
2. Create database: `CREATE DATABASE lotwise_portfolio;`
3. Run migrations: `npm run migrate`
4. Seed demo data: `npm run seed`

## Kafka Setup

For local development, you can use:
- Redpanda (recommended): `docker run -d -p 9092:9092 redpandadata/redpanda:latest`
- Or Apache Kafka with Zookeeper

## Running the Backend

```bash
npm install
npm run dev
```

The API will be available at `http://localhost:3001`
