# Mock API Server for Ticket Importer

This is a mock API server that simulates the external API endpoint for testing the ticket importer service.

## Features

- ✅ Receives POST requests at `/api/OperatorApi/ImportExtTicket`
- ✅ Validates request headers (`operator-pwd`, `operator-sign`, `content-type`)
- ✅ Validates request body structure
- ✅ Validates operator-sign using MD5(body + operatorKey)
- ✅ Stores all requests in memory
- ✅ Provides statistics and request history
- ✅ CORS enabled for cross-origin requests

## Installation

```bash
cd mock-api
npm install
```

## Usage

### Start the server

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

### Environment Variables

```env
OPERATOR_KEY=your_operator_key_here
MOCK_API_PORT=3001
```

## API Endpoints

### POST /api/OperatorApi/ImportExtTicket

Receives ticket import requests from the importer service.

**Headers:**

- `Content-Type: application/json`
- `operator-pwd: your_password`
- `operator-sign: md5_hash_of_body_plus_operator_key`

**Request Body:**

```json
{
    "Timestamp": "2025-10-14T06:56:04.000Z",
    "Seq": "seq_1234567890_abc123",
    "Payload": {
        "Tickets": [
            {
                "playerId": "player123",
                "gameId": 456,
                "roundId": 789
                // ... other ticket data
            }
        ]
    }
}
```

**Response:**

```json
{
    "Timestamp": "2025-10-14T06:56:04.000Z",
    "Seq": "seq_1234567890_abc123",
    "ErrorCode": 0,
    "ErrorMessage": "Success"
}
```

### GET /api/requests

Get all received requests with full details.

### GET /api/stats

Get request statistics.

### DELETE /api/requests

Clear all stored requests from memory.

### GET /health

Health check endpoint.

### GET /

Root endpoint with API information.

## Testing

1. Start the mock API server:

    ```bash
    cd mock-api
    npm start
    ```

2. Update your main application's `.env` file:

    ```env
    API_BASE_URL=http://localhost:3001
    API_OPERATOR_KEY=your_operator_key_here
    ```

3. Start your ticket importer service and watch the mock API logs.

## Example Output

```
🚀 Mock API Server running on port 3001
📡 Endpoint: http://localhost:3001/api/OperatorApi/ImportExtTicket
📊 Stats: http://localhost:3001/api/stats
🔍 Requests: http://localhost:3001/api/requests
❤️ Health: http://localhost:3001/health

[2025-10-14T06:56:04.000Z] Received request: req_1697123456789_abc123
Headers: {
  'content-type': 'application/json',
  'operator-pwd': 'rmt727hm',
  'operator-sign': 'a1b2c3d4e5f6...'
}
Body: {
  "Timestamp": "2025-10-14T06:56:04.000Z",
  "Seq": "seq_1234567890_abc123",
  "Payload": {
    "Tickets": [...]
  }
}
✅ Request stored successfully. Ticket count: 50
📊 Total requests: 1, Successful: 1, Failed: 0
```

## Error Handling

The mock API validates:

- Required headers presence
- Content-Type header
- Request body structure
- Operator-sign validation
- JSON parsing

All validation errors return appropriate HTTP status codes and error messages.
