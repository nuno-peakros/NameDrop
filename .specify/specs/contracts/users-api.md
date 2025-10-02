# User Management API Contracts

## Base URL
```
https://namedrop.example.com/api/users
```

## Authentication
All endpoints require admin authentication:
```
Authorization: Bearer <admin_jwt_token>
```

## Endpoints

### GET /users
List all users with pagination and filtering.

**Query Parameters:**
```typescript
{
  page?: number;        // Page number (default: 1)
  limit?: number;       // Items per page (default: 20, max: 100)
  search?: string;      // Search by name or email
  role?: 'user' | 'admin';  // Filter by role
  isActive?: boolean;   // Filter by active status
  emailVerified?: boolean;  // Filter by email verification
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    users: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: 'user' | 'admin';
      isActive: boolean;
      emailVerified: boolean;
      createdAt: string;
      updatedAt: string;
    }[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}
```

### POST /users
Create new user (admin only).

**Request Body:**
```typescript
{
  firstName: string;    // 1-100 characters, required
  lastName: string;     // 1-100 characters, required
  email: string;        // Valid email, unique, required
  role: 'user' | 'admin';  // Required
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
    temporaryPassword: string;  // Generated temporary password
  };
}
```

### GET /users/[id]
Get user details by ID.

**Path Parameters:**
- `id`: User UUID

**Response (200):**
```typescript
{
  success: true;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'user' | 'admin';
    isActive: boolean;
    emailVerified: boolean;
    passwordChangedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Response (404):**
```typescript
{
  success: false;
  error: {
    code: 'USER_NOT_FOUND';
    message: 'User not found';
  };
}
```

### PUT /users/[id]
Update user information.

**Path Parameters:**
- `id`: User UUID

**Request Body:**
```typescript
{
  firstName?: string;   // 1-100 characters
  lastName?: string;    // 1-100 characters
  email?: string;       // Valid email, unique
  role?: 'user' | 'admin';
  isActive?: boolean;
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'user' | 'admin';
    isActive: boolean;
    emailVerified: boolean;
    updatedAt: string;
  };
}
```

### DELETE /users/[id]
Deactivate user account (soft delete).

**Path Parameters:**
- `id`: User UUID

**Response (200):**
```typescript
{
  success: true;
  message: 'User deactivated successfully';
}
```

### POST /users/[id]/reactivate
Reactivate user account.

**Path Parameters:**
- `id`: User UUID

**Response (200):**
```typescript
{
  success: true;
  message: 'User reactivated successfully';
}
```

### POST /users/[id]/resend-verification
Resend email verification to user.

**Path Parameters:**
- `id`: User UUID

**Response (200):**
```typescript
{
  success: true;
  message: 'Verification email sent';
}
```

### POST /users/[id]/reset-password
Reset user password (admin action).

**Path Parameters:**
- `id`: User UUID

**Response (200):**
```typescript
{
  success: true;
  data: {
    temporaryPassword: string;  // New temporary password
  };
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
    message: 'Admin access required';
  };
}
```

### 404 Not Found
```typescript
{
  success: false;
  error: {
    code: 'USER_NOT_FOUND';
    message: 'User not found';
  };
}
```

### 409 Conflict
```typescript
{
  success: false;
  error: {
    code: 'EMAIL_EXISTS';
    message: 'Email address already exists';
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

## Validation Rules

### User Creation/Update
- **firstName**: Required, 1-100 characters, letters and spaces only
- **lastName**: Required, 1-100 characters, letters and spaces only
- **email**: Required, valid email format, unique across system
- **role**: Required, must be 'user' or 'admin'

### Search and Filtering
- **search**: Searches both firstName, lastName, and email fields
- **page**: Must be positive integer, defaults to 1
- **limit**: Must be between 1-100, defaults to 20
- **isActive**: Boolean filter for active/inactive users
- **emailVerified**: Boolean filter for verified/unverified users

## Pagination

### Default Behavior
- **Page Size**: 20 items per page
- **Maximum Page Size**: 100 items per page
- **Sorting**: Created date (newest first)

### Response Format
```typescript
{
  pagination: {
    page: number;        // Current page (1-based)
    limit: number;       // Items per page
    total: number;       // Total items
    totalPages: number;  // Total pages
    hasNext: boolean;    // Has next page
    hasPrev: boolean;    // Has previous page
  };
}
```

## Security Considerations

### Access Control
- All endpoints require admin authentication
- JWT token validation on every request
- Role-based access control enforced

### Data Protection
- No sensitive data (passwords) in responses
- Input validation and sanitization
- SQL injection prevention via Prisma
- XSS prevention via proper encoding

### Audit Logging
- All user management operations logged
- Track who made changes and when
- Log user creation, updates, and deactivations
