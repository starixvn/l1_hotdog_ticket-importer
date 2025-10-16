# Testing Guide

This document provides comprehensive information about testing the Ticket Importer Service.

## 🧪 Test Structure

The project includes comprehensive unit tests and end-to-end tests:

### Unit Tests

- **ConfigLoaderService** - Configuration loading and management
- **DataTransformerService** - Ticket data transformation logic
- **ApiClientService** - External API communication
- **TicketService** - Database operations and ticket management
- **SentryService** - Error tracking and monitoring
- **CurrencyService** - Currency mapping functionality
- **HealthService** - Health check and monitoring
- **Configuration** - Configuration module integration
- **ImporterService** - Main import orchestration

### End-to-End Tests

- **App E2E** - Full application integration tests

## 🚀 Running Tests

### All Tests

```bash
npm run test:all
```

### Unit Tests Only

```bash
npm run test:unit
```

### E2E Tests Only

```bash
npm run test:e2e
```

### Watch Mode (Development)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:cov
```

### Debug Mode

```bash
npm run test:debug
```

## 📊 Test Coverage

The test suite covers:

- ✅ **Configuration Management** - JSON config loading, validation, and fallbacks
- ✅ **Data Transformation** - Ticket format conversion, currency mapping, status determination
- ✅ **API Communication** - HTTP requests, retry logic, error handling, authentication
- ✅ **Database Operations** - MongoDB queries, batch processing, state management
- ✅ **Error Handling** - Sentry integration, exception capture, graceful degradation
- ✅ **Health Monitoring** - System health checks, memory usage, database connectivity
- ✅ **Business Logic** - Import scheduling, batch processing, data validation

## 🔧 Test Configuration

### Test Environment

- **Database**: `mongodb://localhost:27017/ticket_importer_test`
- **API**: Mock endpoints for external API testing
- **Configuration**: `config.test.json` for test-specific settings

### Mock Services

- **MongoDB Models** - Mocked with Jest
- **HTTP Client** - Mocked with Jest
- **File System** - Mocked for config file operations
- **Crypto** - Mocked for hash generation
- **Sentry** - Mocked for error tracking

## 📝 Test Files

```
src/
├── config/
│   ├── config-loader.service.spec.ts
│   ├── configuration.spec.ts
│   └── currency.service.spec.ts
├── importer/
│   ├── importer.service.spec.ts
│   ├── data-transformer.service.spec.ts
│   └── api-client.service.spec.ts
├── ticket/
│   └── ticket.service.spec.ts
├── common/services/
│   └── sentry.service.spec.ts
├── health/
│   └── health.service.spec.ts
└── test/
    └── setup.ts
```

## 🎯 Test Scenarios

### Configuration Tests

- ✅ Load configuration from JSON file
- ✅ Handle missing configuration files
- ✅ Validate configuration structure
- ✅ Handle malformed JSON
- ✅ Currency mapping functionality

### Data Transformation Tests

- ✅ Transform winning tickets
- ✅ Transform losing tickets
- ✅ Transform draw tickets
- ✅ Transform refund tickets
- ✅ Handle edge cases (null values, large numbers)
- ✅ Currency conversion
- ✅ Date formatting

### API Client Tests

- ✅ Successful API requests
- ✅ Retry logic with exponential backoff
- ✅ Error handling and Sentry integration
- ✅ Request/response storage
- ✅ Authentication (operator sign generation)
- ✅ Batch processing

### Database Tests

- ✅ Ticket retrieval with time ranges
- ✅ Exclude already processed tickets
- ✅ Batch processing and state management
- ✅ Error handling and recovery
- ✅ First-run scenarios (no processed batches)

### Health Service Tests

- ✅ Basic health status
- ✅ Detailed health information
- ✅ Database connectivity checks
- ✅ Memory usage monitoring
- ✅ Last processed batch information

## 🐛 Debugging Tests

### Common Issues

1. **MongoDB Connection**

    ```bash
    # Ensure MongoDB is running
    mongod --dbpath /path/to/data
    ```

2. **Port Conflicts**

    ```bash
    # Check if port 3001 is available
    lsof -i :3001
    ```

3. **File Permissions**
    ```bash
    # Ensure test files are readable
    chmod 644 config.test.json
    ```

### Test Debugging

1. **Run specific test file**

    ```bash
    npm test -- --testPathPattern=config-loader.service.spec.ts
    ```

2. **Run tests with verbose output**

    ```bash
    npm test -- --verbose
    ```

3. **Debug specific test**
    ```bash
    npm run test:debug -- --testNamePattern="should load configuration"
    ```

## 📈 Coverage Goals

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## 🔄 Continuous Integration

The test suite is designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
      npm ci
      npm run test:cov
      npm run test:e2e
```

## 📚 Best Practices

1. **Test Isolation** - Each test is independent and can run in any order
2. **Mock External Dependencies** - All external services are mocked
3. **Comprehensive Coverage** - Tests cover happy paths, edge cases, and error scenarios
4. **Clear Test Names** - Test descriptions clearly indicate what is being tested
5. **Arrange-Act-Assert** - Tests follow the AAA pattern for clarity
6. **Async Testing** - Proper handling of asynchronous operations
7. **Error Scenarios** - Tests verify error handling and recovery

## 🚨 Test Maintenance

- Update tests when adding new features
- Ensure tests reflect actual business requirements
- Keep mock data realistic and up-to-date
- Review and update test coverage regularly
- Remove obsolete tests when features are deprecated

## 📞 Support

For test-related issues:

1. Check the test logs for specific error messages
2. Verify all dependencies are installed
3. Ensure test environment is properly configured
4. Review the test setup in `src/test/setup.ts`
