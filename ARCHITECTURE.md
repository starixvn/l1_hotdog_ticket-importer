# Ticket Importer Service - Architecture Documentation

## Overview

The Ticket Importer Service is a NestJS application that periodically queries MongoDB for ticket data and sends it to an external API. The service follows NestJS best practices with a modular, scalable architecture.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        NestJS Application                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Health Module │  │  Importer Module│  │  Ticket Module  │ │
│  │                 │  │                 │  │                 │ │
│  │ • Health Check  │  │ • Scheduled     │  │ • MongoDB Query │ │
│  │ • Status API    │  │   Processing    │  │ • Data Retrieval│ │
│  │ • Monitoring    │  │ • Batch Logic   │  │ • Time Tracking │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Database Module │  │  API Client     │  │ Data Transformer│ │
│  │                 │  │                 │  │                 │ │
│  │ • MongoDB       │  │ • HTTP Client  │  │ • Format        │ │
│  │ • Schemas       │  │ • Retry Logic  │  │   Conversion    │ │
│  │ • Connections   │  │ • Auth Headers │  │ • Validation    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    External Dependencies                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │    MongoDB      │  │   External API │  │   Scheduler     │ │
│  │                 │  │                 │  │                 │ │
│  │ • ticket_silos │  │ • POST /inbox   │  │ • Cron Jobs     │ │
│  │ • Collections  │  │ • Authentication│  │ • Every 5 min   │ │
│  │ • Indexes      │  │ • Rate Limiting │  │ • Error Handling│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Module Structure

### 1. App Module (`src/app.module.ts`)
- **Purpose**: Main application module that orchestrates all other modules
- **Responsibilities**: 
  - Configuration management
  - MongoDB connection setup
  - Module imports and dependency injection

### 2. Database Module (`src/database/`)
- **Purpose**: Manages MongoDB connections and schemas
- **Components**:
  - `database.module.ts`: Module configuration
  - `schemas/ticket-silo.schema.ts`: Ticket data schema
  - `schemas/last-processed-time.schema.ts`: Processing state tracking

### 3. Ticket Module (`src/ticket/`)
- **Purpose**: Handles ticket data retrieval and processing state
- **Components**:
  - `ticket.service.ts`: MongoDB queries and time tracking
  - `ticket.module.ts`: Module configuration

### 4. Importer Module (`src/importer/`)
- **Purpose**: Core business logic for data processing and API communication
- **Components**:
  - `importer.service.ts`: Main processing logic and scheduling
  - `api-client.service.ts`: HTTP client with retry mechanism
  - `data-transformer.service.ts`: Data format conversion
  - `importer.module.ts`: Module configuration

### 5. Health Module (`src/health/`)
- **Purpose**: Application monitoring and health checks
- **Components**:
  - `health.controller.ts`: Health check endpoints
  - `health.service.ts`: Health status logic
  - `health.module.ts`: Module configuration

## Data Flow

### 1. Scheduled Processing
```
Cron Job (Every 5 minutes)
    ↓
ImporterService.processTickets()
    ↓
TicketService.getTicketsFromLastProcessed()
    ↓
MongoDB Query (ticket_silos collection)
```

### 2. Data Transformation
```
Raw MongoDB Tickets
    ↓
DataTransformerService.transformTickets()
    ↓
API Format Tickets
    ↓
Batch Processing (100 tickets per batch)
```

### 3. API Communication
```
Batch of Tickets
    ↓
ApiClientService.sendTickets()
    ↓
HTTP POST Request
    ↓
Retry Logic (if failed)
    ↓
Update Last Processed Time
```

## Configuration Management

### Environment Variables
- **MONGODB_URI**: MongoDB connection string
- **API_BASE_URL**: Target API endpoint
- **API_OPERATOR_PWD**: API authentication password
- **API_OPERATOR_SIGN**: API authentication signature
- **BATCH_SIZE**: Number of tickets per request (default: 100)
- **REQUEST_DELAY_MS**: Delay between requests (default: 10000ms)
- **MAX_RETRY_ATTEMPTS**: Maximum retry attempts (default: 5)
- **RETRY_BASE_DELAY_MS**: Base delay for exponential backoff (default: 1000ms)

### Configuration Service
- Centralized configuration management
- Type-safe configuration access
- Environment-specific settings

## Error Handling Strategy

### 1. Database Errors
- Connection retry logic
- Graceful degradation
- Comprehensive logging

### 2. API Errors
- Exponential backoff retry
- Request timeout handling
- Authentication error handling

### 3. Data Processing Errors
- Validation errors
- Transformation errors
- Batch processing errors

## Performance Considerations

### 1. Database Optimization
- Indexed queries on time, gameId, playerId
- Connection pooling
- Query optimization

### 2. API Rate Limiting
- Configurable batch sizes
- Request delays
- Retry mechanisms

### 3. Memory Management
- Streaming large datasets
- Garbage collection optimization
- Memory leak prevention

## Monitoring and Logging

### 1. Health Endpoints
- `/health`: Basic health check
- `/health/detailed`: Comprehensive status

### 2. Logging Levels
- **Info**: Processing status and batch information
- **Error**: Failed requests and retry attempts
- **Debug**: Detailed request/response data

### 3. Metrics
- Processing time tracking
- Success/failure rates
- Memory usage monitoring

## Security Considerations

### 1. API Authentication
- MD5 hash-based authentication
- Secure header management
- Credential protection

### 2. Data Validation
- Input sanitization
- Type checking
- Format validation

### 3. Error Information
- Sanitized error messages
- No sensitive data exposure
- Secure logging

## Deployment Options

### 1. Development
```bash
npm run start:dev
```

### 2. Production
```bash
npm run build
npm run start:prod
```

### 3. Docker
```bash
docker-compose up -d
```

### 4. Kubernetes
- Helm charts available
- Configurable scaling
- Health check integration

## Testing Strategy

### 1. Unit Tests
- Service layer testing
- Mock dependencies
- Isolated testing

### 2. Integration Tests
- Database integration
- API client testing
- End-to-end scenarios

### 3. E2E Tests
- Full application testing
- Real database connections
- API integration testing

## Maintenance and Operations

### 1. Log Rotation
- Automated log management
- Retention policies
- Storage optimization

### 2. Database Maintenance
- Index optimization
- Collection cleanup
- Performance monitoring

### 3. Application Updates
- Zero-downtime deployments
- Configuration management
- Rollback procedures

## Troubleshooting Guide

### 1. Common Issues
- Database connection failures
- API authentication errors
- Memory leaks
- Performance degradation

### 2. Debugging Steps
- Check health endpoints
- Review application logs
- Monitor database performance
- Verify API connectivity

### 3. Recovery Procedures
- Service restart procedures
- Database recovery
- Configuration restoration
- Data consistency checks




