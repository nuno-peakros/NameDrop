# Authentication API Contracts

## Base URL
```
https://namedrop.example.com/api/auth
```

## Authentication Headers
All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### POST /login
User login with email and password.

**Request Body:**
```typescript
{
  email: string;        // Valid email address
  password: string;     // User password
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: 'user' | 'admin';
      emailVerified: boolean;
      passwordChangedAt: string | null;
    };
    token: string;      // JWT token
    expiresAt: string;  // ISO timestamp
  };
}
```

**Response (401):**
```typescript
{
  success: false;
  error: {
    code: 'INVALID_CREDENTIALS' | 'ACCOUNT_INACTIVE' | 'EMAIL_NOT_VERIFIED';
    message: string;
  };
}
```

### POST /logout
User logout (invalidate session).

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```typescript
{
  success: true;
  message: 'Logged out successfully';
}
```

### POST /register
Create new user (admin only).

**Request Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```typescript
{
  firstName: string;    // 1-100 characters
  lastName: string;     // 1-100 characters
  email: string;        // Valid email address
  role: 'user' | 'admin';
}
```

**Response (201):**
```typescript
{
  success: true;
  data: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: 'user' | 'admin';
      isActive: boolean;
      emailVerified: boolean;
      createdAt: string;
    };
    temporaryPassword: string;  // Only returned to admin
  };
}
```

### POST /verify-email
Verify email address via token.

**Request Body:**
```typescript
{
  token: string;        // Email verification token
}
```

**Response (200):**
```typescript
{
  success: true;
  message: 'Email verified successfully';
}
```

### POST /forgot-password
Request password reset.

**Request Body:**
```typescript
{
  email: string;        // User email address
}
```

**Response (200):**
```typescript
{
  success: true;
  message: 'Password reset email sent';
}
```

### POST /reset-password
Reset password with token.

**Request Body:**
```typescript
{
  token: string;        // Password reset token
  newPassword: string;  // New password (8+ chars, complex)
}
```

**Response (200):**
```typescript
{
  success: true;
  message: 'Password reset successfully';
}
```

### POST /change-password
Change password (authenticated user).

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```typescript
{
  currentPassword: string;  // Current password
  newPassword: string;      // New password (8+ chars, complex)
}
```

**Response (200):**
```typescript
{
  success: true;
  message: 'Password changed successfully';
}
```

## Error Responses

### 400 Bad Request
```typescript
{
  success: false;
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: {
      field: string;
      message: string;
    }[];
  };
}
```

### 401 Unauthorized
```typescript
{
  success: false;
  error: {
    code: 'UNAUTHORIZED' | 'INVALID_TOKEN' | 'TOKEN_EXPIRED';
    message: string;
  };
}
```

### 403 Forbidden
```typescript
{
  success: false;
  error: {
    code: 'INSUFFICIENT_PERMISSIONS';
    message: string;
  };
}
```

### 429 Too Many Requests
```typescript
{
  success: false;
  error: {
    code: 'RATE_LIMIT_EXCEEDED';
    message: string;
    retryAfter: number;  // Seconds until retry allowed
  };
}
```

### 500 Internal Server Error
```typescript
{
  success: false;
  error: {
    code: 'INTERNAL_ERROR';
    message: 'An unexpected error occurred';
  };
}
```

## Rate Limiting

### Login Attempts
- **Limit**: 5 attempts per IP per 15 minutes
- **Reset**: Automatic after 15 minutes
- **Response**: 429 with retryAfter

### Password Reset
- **Limit**: 3 requests per email per hour
- **Reset**: Automatic after 1 hour
- **Response**: 429 with retryAfter

## Security Considerations

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters recommended

### Token Security
- JWT tokens expire after 7 days
- Password reset tokens expire after 1 hour
- All tokens are cryptographically secure
- Tokens are invalidated on logout

### Input Validation
- All inputs validated with Zod schemas
- SQL injection prevention via Prisma
- XSS prevention via input sanitization
- CSRF protection via SameSite cookies
