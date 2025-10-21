const express = require('express');
const TradeController = require('../controllers/TradeController');
const PositionController = require('../controllers/PositionController');
const PnLController = require('../controllers/PnLController');
const { validateTrade } = require('../middleware/validation');

const router = express.Router();

// Trade routes
router.post('/trades', validateTrade, TradeController.createTrade);
router.get('/trades', TradeController.getAllTrades);

// Position routes
router.get('/positions', PositionController.getPositions);

// P&L routes
router.get('/pnl', PnLController.getRealizedPnL);

module.exports = router;
