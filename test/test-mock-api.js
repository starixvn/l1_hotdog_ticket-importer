// Test script to verify the mock API works
const crypto = require('crypto');

// Test data
const operatorKey = 'test_key_123';
const testRequest = {
    Timestamp: new Date().toISOString(),
    Seq: 'seq_test_123',
    Payload: {
        Tickets: [
            {
                playerId: 'player123',
                gameId: 456,
                roundId: 789,
                amount: 100.5,
                currency: 'USD',
            },
        ],
    },
};

// Calculate operator-sign
const body = JSON.stringify(testRequest);
const operatorSign = crypto
    .createHash('md5')
    .update(body + operatorKey)
    .digest('hex');

console.log('=== Mock API Test Data ===');
console.log('Operator Key:', operatorKey);
console.log('Request Body:', body);
console.log('Operator Sign:', operatorSign);
console.log('========================');

// Instructions
console.log('\n📋 To test the mock API:');
console.log('1. Start the mock API: cd mock-api && npm start');
console.log('2. Update your .env file:');
console.log('   API_BASE_URL=http://localhost:3001');
console.log('   API_OPERATOR_KEY=test_key_123');
console.log('3. Start your ticket importer service');
console.log('4. Check mock API logs for received requests');
console.log('5. Visit http://localhost:3001/api/stats for statistics');
