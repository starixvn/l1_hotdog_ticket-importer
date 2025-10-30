const express = require('express');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.MOCK_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-memory storage for received requests
const receivedRequests = [];
const requestStats = {
    total: 0,
    successful: 0,
    failed: 0,
    startTime: new Date().toISOString(),
};

// Helper function to validate operator-sign
function validateOperatorSign(body, operatorKey, receivedSign) {
    const expectedSign = crypto
        .createHash('md5')
        .update(body + operatorKey)
        .digest('hex');
    return expectedSign === receivedSign;
}

// Mock API endpoint
app.post('/api/OperatorApi/ImportExtTicket', (req, res) => {
    const timestamp = new Date().toISOString();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    console.log(`\n[${timestamp}] Received request: ${requestId}`);
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Extract headers
    const operatorPwd = req.headers['operator-pwd'];
    const operatorSign = req.headers['operator-sign'];
    const contentType = req.headers['content-type'];

    // Validate required headers
    if (!operatorPwd) {
        console.log('❌ Missing operator-pwd header');
        return res.status(400).json({
            Timestamp: timestamp,
            Seq: req.body.Seq || 'unknown',
            ErrorCode: 400,
            ErrorMessage: 'Missing operator-pwd header',
        });
    }

    if (!operatorSign) {
        console.log('❌ Missing operator-sign header');
        return res.status(400).json({
            Timestamp: timestamp,
            Seq: req.body.Seq || 'unknown',
            ErrorCode: 400,
            ErrorMessage: 'Missing operator-sign header',
        });
    }

    if (contentType !== 'application/json') {
        console.log('❌ Invalid content-type header');
        return res.status(400).json({
            Timestamp: timestamp,
            Seq: req.body.Seq || 'unknown',
            ErrorCode: 400,
            ErrorMessage: 'Invalid content-type header',
        });
    }

    // Validate request body structure
    if (!req.body || !req.body.Payload || !Array.isArray(req.body.Payload.Tickets)) {
        console.log('❌ Invalid request body structure');
        return res.status(400).json({
            Timestamp: timestamp,
            Seq: req.body.Seq || 'unknown',
            ErrorCode: 400,
            ErrorMessage: 'Invalid request body structure',
        });
    }

    // Validate operator-sign (optional - for testing)
    const operatorKey = 'cem0g25u';
    const bodyString = JSON.stringify(req.body);
    const isValidSign = validateOperatorSign(bodyString, operatorKey, operatorSign);

    if (!isValidSign) {
        console.log('❌ Invalid operator-sign');
        console.log(
            'Expected:',
            crypto
                .createHash('md5')
                .update(bodyString + operatorKey)
                .digest('hex'),
        );
        console.log('Received:', operatorSign);
        return res.status(401).json({
            Timestamp: timestamp,
            Seq: req.body.Seq || 'unknown',
            ErrorCode: 401,
            ErrorMessage: 'Invalid operator-sign',
        });
    }

    // Store the request in memory
    const storedRequest = {
        id: requestId,
        timestamp: timestamp,
        headers: {
            'operator-pwd': operatorPwd,
            'operator-sign': operatorSign,
            'content-type': contentType,
        },
        body: req.body,
        ticketCount: req.body.Payload.Tickets.length,
        sequenceId: req.body.Seq,
    };

    receivedRequests.push(storedRequest);
    requestStats.total++;
    requestStats.successful++;

    console.log(`✅ Request stored successfully. Ticket count: ${storedRequest.ticketCount}`);
    console.log(`📊 Total requests: ${requestStats.total}, Successful: ${requestStats.successful}, Failed: ${requestStats.failed}`);

    // Return success response
    return res.status(200).json({
        Timestamp: timestamp,
        Seq: req.body.Seq,
        ErrorCode: 0,
        ErrorMsg: 'Success',
    });
});

// Get all received requests
app.get('/api/requests', (req, res) => {
    res.json({
        stats: requestStats,
        requests: receivedRequests,
    });
});

// Get request statistics
app.get('/api/stats', (req, res) => {
    res.json(requestStats);
});

// Clear all requests
app.delete('/api/requests', (req, res) => {
    const clearedCount = receivedRequests.length;
    receivedRequests.length = 0;
    requestStats.total = 0;
    requestStats.successful = 0;
    requestStats.failed = 0;
    requestStats.startTime = new Date().toISOString();

    console.log(`🗑️ Cleared ${clearedCount} requests from memory`);
    res.json({ message: `Cleared ${clearedCount} requests`, stats: requestStats });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        stats: requestStats,
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Mock API Server for Ticket Importer',
        endpoints: {
            'POST /api/OperatorApi/ImportExtTicket': 'Receive ticket import requests',
            'GET /api/requests': 'Get all received requests',
            'GET /api/stats': 'Get request statistics',
            'DELETE /api/requests': 'Clear all requests',
            'GET /health': 'Health check',
        },
        stats: requestStats,
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    requestStats.failed++;

    res.status(500).json({
        Timestamp: new Date().toISOString(),
        Seq: req.body?.Seq || 'unknown',
        ErrorCode: 500,
        ErrorMessage: 'Internal server error',
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Mock API Server running on port ${PORT}`);
    console.log(`📡 Endpoint: http://localhost:${PORT}/api/OperatorApi/ImportExtTicket`);
    console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
    console.log(`🔍 Requests: http://localhost:${PORT}/api/requests`);
    console.log(`❤️ Health: http://localhost:${PORT}/health`);
    console.log(`\nEnvironment variables:`);
    console.log(`  - OPERATOR_KEY: ${process.env.OPERATOR_KEY || 'test_key (default)'}`);
    console.log(`  - MOCK_API_PORT: ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Mock API Server...');
    console.log(`📊 Final stats:`, requestStats);
    process.exit(0);
});
