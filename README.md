# Lotwise Portfolio Tracker

A comprehensive portfolio tracking system that manages trades using a lot-based FIFO (First In, First Out) system for accurate P&L calculation.

## 🏗️ Architecture

This project consists of three main components:

1. **Backend API** - Node.js + Express + PostgreSQL
2. **Kafka Worker** - Node.js consumer for processing trade events
3. **Frontend** - Next.js application with three main pages

## 📁 Project Structure

```
FundTec/
├── backend/          # Node.js API server
│   ├── src/
│   │   ├── config/   # Database and Kafka configuration
│   │   ├── controllers/ # API route handlers
│   │   ├── middleware/ # Validation and error handling
│   │   ├── models/    # Database models
│   │   ├── routes/    # API routes
│   │   ├── services/  # Business logic (FIFO matching)
│   │   ├── migrations/ # Database schema
│   │   └── seeders/   # Demo data
│   └── package.json
├── worker/           # Kafka consumer worker
│   ├── src/
│   │   ├── kafka.js  # Kafka consumer setup
│   │   ├── database.js # Database connection
│   │   ├── LotService.js # FIFO logic
│   │   ├── TradeProcessor.js # Trade processing
│   │   └── worker.js # Main worker file
│   └── package.json
├── frontend/         # Next.js frontend application
│   ├── src/
│   │   ├── app/      # Next.js app router pages
│   │   ├── components/ # React components
│   │   └── lib/      # API client
│   └── package.json
├── docker-compose.yml # Local development setup
└── README.md
```

## 🗄️ Data Model

### Tables

1. **trades** - Raw trade data
   - `id` (primary key)
   - `symbol` (string)
   - `quantity` (integer, positive for buy, negative for sell)
   - `price` (decimal)
   - `timestamp` (datetime)
   - `created_at` (datetime)

2. **lots** - Open position lots
   - `id` (primary key)
   - `symbol` (string)
   - `quantity` (integer)
   - `price` (decimal)
   - `trade_id` (foreign key to trades)
   - `created_at` (datetime)

3. **realized_pnl** - Closed position P&L records
   - `id` (primary key)
   - `symbol` (string)
   - `quantity_closed` (integer)
   - `avg_cost` (decimal)
   - `sell_price` (decimal)
   - `realized_pnl` (decimal)
   - `trade_id` (foreign key to trades)
   - `created_at` (datetime)

## 🔄 FIFO Matching Logic

When a sell trade occurs:
1. Find all open lots for the symbol ordered by creation time (FIFO)
2. Match the sell quantity against open lots
3. Calculate realized P&L for each closed lot: `(sell_price - lot_price) * quantity_closed`
4. Update remaining lot quantities
5. Remove lots with zero quantity
6. Record realized P&L entries

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Kafka (or Redpanda)

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FundTec
   ```

2. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Run database migrations**
   ```bash
   cd backend
   npm run migrate up
   ```

4. **Seed demo data**
   ```bash
   npm run seed
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Kafka: localhost:9092

### Option 2: Manual Setup

1. **Install dependencies for each component**
   ```bash
   cd backend && npm install
   cd ../worker && npm install
   cd ../frontend && npm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env` in each directory
   - Update database and Kafka connection details

3. **Set up PostgreSQL**
   ```sql
   CREATE DATABASE lotwise_portfolio;
   ```

4. **Set up Kafka/Redpanda**
   ```bash
   # Using Redpanda (recommended)
   docker run -d -p 9092:9092 redpandadata/redpanda:latest
   ```

5. **Start services**
   ```bash
   # Terminal 1: Backend API
   cd backend && npm run dev
   
   # Terminal 2: Worker
   cd worker && npm run dev
   
   # Terminal 3: Frontend
   cd frontend && npm run dev
   ```

## 📡 API Endpoints

### Backend API (http://localhost:3001/api)

- `POST /trades` - Add a new trade
  ```json
  {
    "symbol": "AAPL",
    "quantity": 100,
    "price": 150.00,
    "timestamp": "2024-01-01T10:00:00Z"
  }
  ```

- `GET /trades` - Get all trades
- `GET /positions` - Get open positions with average cost
- `GET /pnl` - Get realized P&L summary
- `GET /health` - Health check

## 🧪 Test Scenario

1. Buy 100 AAPL @ $150
2. Buy 50 AAPL @ $160
3. Sell 80 AAPL @ $170

**Expected Results:**
- Remaining open lots: 70 AAPL (20 from first lot, 50 from second lot)
- Realized P&L: $1,600 (80 shares × $20 profit per share)

## 🌐 Frontend Pages

1. **Add Trade** (`/`) - Form to input new trades
2. **Positions** (`/positions`) - View open positions with average cost
3. **P&L** (`/pnl`) - View realized gains and losses

## 🚀 Deployment

### Free Tier Services

| Component | Service | Free Tier |
|-----------|---------|-----------|
| Frontend | Vercel / Netlify | ✅ |
| Backend API | Render / Railway | ✅ |
| Worker | Render / Railway | ✅ |
| Database | Supabase / Railway Postgres | ✅ |
| Kafka | Redpanda Cloud / Confluent Cloud | ✅ |

### Deployment Steps

1. **Frontend (Vercel)**
   ```bash
   cd frontend
   vercel --prod
   ```

2. **Backend & Worker (Railway)**
   ```bash
   # Deploy backend
   cd backend
   railway login
   railway init
   railway up
   
   # Deploy worker
   cd ../worker
   railway init
   railway up
   ```

3. **Database (Supabase)**
   - Create new project
   - Run migrations
   - Update connection strings

4. **Kafka (Redpanda Cloud)**
   - Create free cluster
   - Update broker URLs

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=production
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=lotwise_portfolio
DB_USER=your-db-user
DB_PASSWORD=your-db-password
KAFKA_BROKERS=your-kafka-brokers
KAFKA_CLIENT_ID=lotwise-backend
KAFKA_TOPIC=trades
```

### Worker (.env)
```env
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=lotwise_portfolio
DB_USER=your-db-user
DB_PASSWORD=your-db-password
KAFKA_BROKERS=your-kafka-brokers
KAFKA_CLIENT_ID=lotwise-worker
KAFKA_GROUP_ID=lotwise-worker-group
KAFKA_TOPIC=trades
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
```

## 📋 Assumptions

1. All trades are for whole shares (no fractional shares)
2. FIFO matching is applied per symbol independently
3. Trade timestamps are provided by the client
4. Prices are stored with appropriate decimal precision
5. Kafka events are processed in order (single partition per symbol)
6. Database transactions ensure data consistency
7. Worker processes trades asynchronously for better performance

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify connection credentials
   - Ensure database exists

2. **Kafka Connection Error**
   - Check Kafka/Redpanda is running
   - Verify broker URLs
   - Check network connectivity

3. **Frontend API Errors**
   - Verify backend is running
   - Check CORS settings
   - Update API URL in environment variables

## 📈 Performance Considerations

- Database indexes on frequently queried columns
- Kafka partitioning for parallel processing
- Connection pooling for database connections
- Rate limiting on API endpoints
- Error handling and retry logic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details