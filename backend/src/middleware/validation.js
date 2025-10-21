const Joi = require('joi');

const validateTrade = (req, res, next) => {
  const schema = Joi.object({
    symbol: Joi.string().min(1).max(10).required(),
    quantity: Joi.number().integer().not(0).required(),
    price: Joi.number().positive().precision(2).required(),
    timestamp: Joi.date().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.details[0].message
    });
  }

  next();
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
};

module.exports = {
  validateTrade,
  errorHandler,
  notFound
};
