# API Documentation

This document provides comprehensive API documentation for the NameDrop application.

## Base URL

```
Production: https://yourdomain.com/api
Development: http://localhost:3000/api
```

## Authentication

All API endpoints (except public ones) require authentication via JWT token.

### Authentication Methods

1. **Bearer Token** (Recommended)
   ```http
   Authorization: Bearer <jwt-token>
   ```

2. **Cookie** (Web only)
   ```http
   Cookie: session-token=<jwt-token>
   ```

### Getting a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

## Rate Limiting

- **Limit**: 100 requests per 15 minutes
- **Headers**: 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Pagination

List endpoints support pagination:

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field (default: created_at)
- `order`: Sort order (asc/desc, default: desc)

### Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_REQUIRED` | Authentication required |
| `INVALID_CREDENTIALS` | Invalid email/password |
| `TOKEN_EXPIRED` | JWT token expired |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `INTERNAL_ERROR` | Internal server error |

---

## Authentication Endpoints

### POST /api/auth/login

Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "USER",
      "status": "ACTIVE",
      "emailVerified": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

**Errors:**
- `400`: Invalid request body
- `401`: Invalid credentials
- `429`: Rate limit exceeded

### POST /api/auth/register

Register a new user account.

**Request:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification."
}
```

**Errors:**
- `400`: Invalid request body
- `409`: Email already exists
- `422`: Validation error

### POST /api/auth/logout

Logout current user.

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /api/auth/verify-email

Verify user email address.

**Request:**
```json
{
  "token": "verification-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Errors:**
- `400`: Invalid token
- `404`: Token not found
- `409`: Email already verified

### POST /api/auth/forgot-password

Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### POST /api/auth/reset-password

Reset user password.

**Request:**
```json
{
  "token": "reset-token",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Errors:**
- `400`: Invalid token or password
- `404`: Token not found
- `422`: Password validation error

### POST /api/auth/change-password

Change user password (authenticated).

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**
- `400`: Invalid request body
- `401`: Authentication required
- `403`: Invalid current password
- `422`: Password validation error

---

## User Management Endpoints

### GET /api/users

Get list of users (admin only).

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `role`: Filter by role (USER, ADMIN)
- `status`: Filter by status (ACTIVE, INACTIVE, PENDING)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "USER",
      "status": "ACTIVE",
      "emailVerified": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Errors:**
- `401`: Authentication required
- `403`: Insufficient permissions

### GET /api/users/[id]

Get user by ID (admin only).

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "USER",
    "status": "ACTIVE",
    "emailVerified": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `401`: Authentication required
- `403`: Insufficient permissions
- `404`: User not found

### POST /api/users

Create new user (admin only).

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "role": "USER",
  "sendVerificationEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "USER",
    "status": "PENDING",
    "emailVerified": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `400`: Invalid request body
- `401`: Authentication required
- `403`: Insufficient permissions
- `409`: Email already exists
- `422`: Validation error

### PUT /api/users/[id]

Update user (admin only).

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "name": "Updated Name",
  "role": "ADMIN",
  "status": "ACTIVE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Updated Name",
    "role": "ADMIN",
    "status": "ACTIVE",
    "emailVerified": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `400`: Invalid request body
- `401`: Authentication required
- `403`: Insufficient permissions
- `404`: User not found
- `422`: Validation error

### DELETE /api/users/[id]

Delete user (admin only).

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Errors:**
- `401`: Authentication required
- `403`: Insufficient permissions
- `404`: User not found

### POST /api/users/[id]/deactivate

Deactivate user (admin only).

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

### POST /api/users/[id]/reactivate

Reactivate user (admin only).

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User reactivated successfully"
}
```

### POST /api/users/[id]/resend-verification

Resend verification email (admin only).

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

### POST /api/users/[id]/reset-password

Reset user password (admin only).

**Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "sendEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

## Health Check Endpoint

### GET /api/health

Check application health.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "services": {
    "database": "healthy",
    "email": "healthy"
  },
  "version": "1.0.0",
  "uptime": 3600
}
```

**Status Codes:**
- `200`: All services healthy
- `503`: One or more services unhealthy

---

## Webhooks

### POST /api/webhooks/events

Handle external webhook events.

**Headers:**
```http
Content-Type: application/json
X-Webhook-Signature: <signature>
```

**Request:**
```json
{
  "event": "user.created",
  "data": {
    "id": "user-id",
    "email": "user@example.com"
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

---

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @namedrop/sdk
```

```typescript
import { NameDropClient } from '@namedrop/sdk'

const client = new NameDropClient({
  baseUrl: 'https://yourdomain.com/api',
  apiKey: 'your-api-key'
})

// Login
const user = await client.auth.login({
  email: 'user@example.com',
  password: 'password123'
})

// Get users
const users = await client.users.list({
  page: 1,
  limit: 10
})
```

### Python

```bash
pip install namedrop-sdk
```

```python
from namedrop import NameDropClient

client = NameDropClient(
    base_url='https://yourdomain.com/api',
    api_key='your-api-key'
)

# Login
user = client.auth.login(
    email='user@example.com',
    password='password123'
)

# Get users
users = client.users.list(page=1, limit=10)
```

### PHP

```bash
composer require namedrop/sdk
```

```php
use NameDrop\NameDropClient;

$client = new NameDropClient([
    'base_url' => 'https://yourdomain.com/api',
    'api_key' => 'your-api-key'
]);

// Login
$user = $client->auth->login([
    'email' => 'user@example.com',
    'password' => 'password123'
]);

// Get users
$users = $client->users->list([
    'page' => 1,
    'limit' => 10
]);
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/*` | 10 requests | 15 minutes |
| `/api/users/*` | 100 requests | 15 minutes |
| `/api/health` | 1000 requests | 15 minutes |
| All others | 100 requests | 15 minutes |

## Error Handling

### Retry Logic

```typescript
const retryRequest = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      if (error.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
      } else {
        throw error
      }
    }
  }
}
```

### Exponential Backoff

```typescript
const delay = (retryCount: number) => {
  return Math.min(1000 * Math.pow(2, retryCount), 30000)
}
```

## Testing

### Postman Collection

Import the Postman collection from `docs/postman/NameDrop-API.postman_collection.json`

### cURL Examples

```bash
# Login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get users
curl -X GET https://yourdomain.com/api/users \
  -H "Authorization: Bearer <jwt-token>"

# Create user
curl -X POST https://yourdomain.com/api/users \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"User Name","email":"user@example.com","role":"USER"}'
```

---

## Changelog

### Version 1.0.0
- Initial API release
- Authentication endpoints
- User management endpoints
- Health check endpoint
- Rate limiting
- Error handling

### Version 1.1.0 (Planned)
- Webhook support
- Advanced filtering
- Bulk operations
- Audit logging

---

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/namedrop/issues)
- **Email**: api-support@yourdomain.com
- **Discord**: [Join our Discord](https://discord.gg/namedrop)

---

**API Version**: 1.0.0  
**Last Updated**: January 2025
