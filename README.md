# Ticket Importer Service

A NestJS service that periodically imports tickets from MongoDB and sends them to an external API.

## Features

- **Scheduled Processing**: Automatically processes tickets every 5 minutes
- **MongoDB Integration**: Connects to MongoDB and queries the `ticket_silos` collection
- **Batch Processing**: Sends tickets in configurable batches (default: 100 tickets per request)
- **Retry Mechanism**: Implements exponential backoff for failed requests
- **Data Transformation**: Converts MongoDB ticket format to API format
- **Rate Limiting**: Configurable delays between requests
- **Comprehensive Logging**: Detailed logging for monitoring and debugging

## Architecture

The service follows NestJS best practices with a modular structure:

- **Database Module**: MongoDB schemas and connection management
- **Ticket Module**: Service for querying ticket data
- **Importer Module**: Main business logic for data processing and API communication
- **Scheduled Tasks**: Automated processing using NestJS cron jobs

## Configuration

Copy `env.example` to `.env` and configure the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ticket_importer

# API Configuration
API_BASE_URL=https://api.example.com
API_OPERATOR_PWD=your_operator_password
API_OPERATOR_SIGN=your_operator_sign

# Import Configuration
BATCH_SIZE=100
REQUEST_DELAY_MS=10000
MAX_RETRY_ATTEMPTS=5
RETRY_BASE_DELAY_MS=1000

# Application Configuration
PORT=3000
NODE_ENV=development
```

## Installation

```bash
# Install dependencies
npm install

# Start the application
npm run start:dev
```

## API Request Format

The service transforms MongoDB tickets to the following API format:

```json
{
  "Timestamp": "2023-10-06T09:34:26.966Z",
  "Seq": "string",
  "Payload": {
    "Tickets": [
      {
        "GameId": "1001",
        "CustId": "118213672",
        "CustName": "blph1lgind",
        "GameRoundId": "3010800",
        "TransDate": "2024-03-27T03:45:46.000Z",
        "SettleDate": "2024-03-27T03:46:46.000Z",
        "Stake": 100.0000,
        "ActualStake": 100.0000,
        "NetStake": 100.0000,
        "Payout": 197.0000,
        "Status": 1,
        "CurrencyIso": "INR",
        "JackpotContributionAmount": 10.0000
      }
    ]
  }
}
```

## Data Processing Logic

1. **Time Range**: Queries tickets from the last processed time to current time minus 10 minutes
2. **Batch Size**: Processes tickets in configurable batches (default: 100)
3. **Rate Limiting**: Waits 10 seconds between requests (configurable)
4. **Retry Logic**: Uses exponential backoff for failed requests
5. **Status Mapping**: Maps win/loss data to appropriate status codes (1: Win, 2: Lose, 3: Draw)

## Monitoring

The service provides comprehensive logging at different levels:

- **Info**: Processing status and batch information
- **Error**: Failed requests and retry attempts
- **Debug**: Detailed request/response data

## Development

```bash
# Run in development mode
npm run start:dev

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Format code
npm run format

# Lint code
npm run lint
```

## Production

```bash
# Build the application
npm run build

# Start in production mode
npm run start:prod
```

## Error Handling

The service implements robust error handling:

- **Database Errors**: Graceful handling of MongoDB connection issues
- **API Errors**: Retry mechanism with exponential backoff
- **Data Validation**: Proper validation of ticket data before transformation
- **Logging**: Comprehensive error logging for debugging

## Performance Considerations

- **Batch Processing**: Reduces API load by processing tickets in batches
- **Rate Limiting**: Prevents overwhelming the target API
- **Connection Pooling**: Efficient MongoDB connection management
- **Memory Management**: Processes large datasets without memory issues




