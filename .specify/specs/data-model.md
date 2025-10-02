# NameDrop Data Model

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  password_changed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### User Roles Enum
```sql
CREATE TYPE user_role AS ENUM ('user', 'admin');
```

#### Password Reset Tokens
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### User Sessions
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Entity Relationships

### User Lifecycle States
- **New User**: `is_active=true`, `email_verified=false` (must verify before first login)
- **Verified User**: `is_active=true`, `email_verified=true` (can login normally)
- **Deactivated User**: `is_active=false` (cannot login regardless of email_verified status)

### Relationships
- **Users → Password Reset Tokens**: One-to-many (one user can have multiple reset tokens)
- **Users → User Sessions**: One-to-many (one user can have multiple active sessions)

## Prisma Schema

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  user
  admin
}

model User {
  id                String    @id @default(uuid())
  firstName         String    @map("first_name")
  lastName          String    @map("last_name")
  email             String    @unique
  passwordHash      String    @map("password_hash")
  role              UserRole  @default(user)
  isActive          Boolean   @default(true) @map("is_active")
  emailVerified     Boolean   @default(false) @map("email_verified")
  passwordChangedAt DateTime? @map("password_changed_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  // Relations
  passwordResetTokens PasswordResetToken[]
  sessions           UserSession[]

  @@map("users")
}

model PasswordResetToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("password_reset_tokens")
}

model UserSession {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  sessionToken String   @unique @map("session_token")
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_sessions")
}
```

## Indexes and Constraints

### Performance Indexes
```sql
-- Email lookup (most common query)
CREATE INDEX idx_users_email ON users(email);

-- Active users lookup
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Email verification lookup
CREATE INDEX idx_users_email_verified ON users(email_verified) WHERE email_verified = false;

-- Session token lookup
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);

-- Password reset token lookup
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Expired tokens cleanup
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
```

### Constraints
- **Email Uniqueness**: Enforced at database level
- **Token Uniqueness**: Password reset tokens and session tokens are unique
- **Foreign Key Constraints**: Proper cascade deletion for related records
- **Check Constraints**: Role validation, email format validation

## Data Validation Rules

### User Creation
- **First Name**: Required, 1-100 characters, letters and spaces only
- **Last Name**: Required, 1-100 characters, letters and spaces only
- **Email**: Required, valid email format, unique across system
- **Role**: Must be 'user' or 'admin'

### Password Requirements
- **Minimum Length**: 8 characters
- **Complexity**: At least one uppercase, one lowercase, one number
- **Hashing**: bcrypt with salt rounds ≥ 12

### Session Management
- **Token Length**: 32 characters (hex)
- **Expiration**: 7 days for regular sessions, 1 hour for password reset
- **Cleanup**: Automatic cleanup of expired tokens

## Migration Strategy

### Initial Migration
1. Create database and user
2. Run Prisma migration to create tables
3. Create indexes for performance
4. Seed initial admin user

### Future Migrations
- Use Prisma migration system
- Test migrations on staging environment
- Backup database before major changes
- Rollback plan for failed migrations

## Security Considerations

### Data Protection
- **Encryption at Rest**: Database-level encryption
- **Encryption in Transit**: TLS 1.3 for all connections
- **Password Security**: bcrypt hashing with high salt rounds
- **Token Security**: Cryptographically secure random tokens

### Access Control
- **Database Access**: Limited to application user only
- **API Access**: JWT token validation for all endpoints
- **Admin Operations**: Role-based access control
- **Audit Logging**: Track all user management operations

## Performance Considerations

### Query Optimization
- **Indexed Lookups**: All common queries use indexes
- **Connection Pooling**: Prisma connection pooling
- **Query Caching**: TanStack Query for client-side caching
- **Pagination**: Implemented for user lists

### Scalability
- **Read Replicas**: Future consideration for read-heavy operations
- **Partitioning**: Not needed for initial scale (< 1,000 users)
- **Caching**: Redis for session storage (future enhancement)
