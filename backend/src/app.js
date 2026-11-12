'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const batchRoutes = require('./routes/batchRoutes');
const transferRoutes = require('./routes/transferRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const explorerRoutes = require('./routes/explorerRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Security & Utility Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'MediChain Backend API',
        timestamp: new Date().toISOString()
    });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/explorer', explorerRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.url} not found.`
    });
});

// Central Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

module.exports = app;

