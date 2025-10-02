# NameDrop Quick Start Guide

## Overview
NameDrop is an Ad Naming Generator with a modern dark-themed UI and comprehensive user authentication system. This guide will help you get started with development and deployment.

## Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Google Cloud SQL)
- Resend API account for email functionality
- Git for version control

## Technology Stack
- **Frontend**: Next.js 14+ with TypeScript
- **UI Components**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT tokens
- **Email**: Resend API
- **State Management**: TanStack Query (if needed)

## Quick Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd namedrop
npm install
```

### 2. Environment Configuration
Create `.env.local` file:
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Resend API
RESEND_API_KEY="re_your_api_key"

# App Configuration
NODE_ENV="development"
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed initial admin user
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
namedrop/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── users/         # User management endpoints
│   │   └── health/        # Health check endpoint
│   ├── (auth)/            # Auth pages (login, etc.)
│   ├── dashboard/         # Admin dashboard
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication components
│   └── dashboard/        # Dashboard components
├── lib/                  # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Database connection
│   ├── email.ts          # Email utilities
│   └── utils.ts          # General utilities
├── prisma/               # Database schema
│   ├── schema.prisma     # Prisma schema
│   └── seed.ts           # Database seeding
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## Key Concepts

### Authentication Flow
1. **User Creation**: Admin creates user with email
2. **Email Verification**: User receives verification email
3. **Temporary Password**: User receives temporary password
4. **First Login**: User must change password on first login
5. **Normal Login**: User can login with email/password

### User Roles
- **User**: Basic access to the application
- **Admin**: Can create and manage other users

### UI/UX Principles
- **Dark Theme**: Professional dark theme throughout
- **Responsive**: Mobile-first design approach
- **Accessible**: WCAG 2.1 AA compliance
- **Modern**: Clean, professional interface

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b 001-feature-name

# Make changes
# ... implement feature ...

# Test changes
npm run test
npm run lint

# Commit changes
git add .
git commit -m "feat: add feature description"
```

### 2. Database Changes
```bash
# Update Prisma schema
# Edit prisma/schema.prisma

# Generate migration
npx prisma migrate dev --name description

# Update types
npx prisma generate
```

### 3. Component Development
```bash
# Add new shadcn/ui component
npx shadcn@latest add component-name

# Create custom component
# Add to components/ui/ or appropriate directory
```

## API Usage

### Authentication
```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Get current user
const user = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### User Management (Admin)
```typescript
// Create user
const newUser = await fetch('/api/users', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({ firstName, lastName, email, role })
});

// List users
const users = await fetch('/api/users?page=1&limit=20', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

## Testing

### Unit Tests
```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Integration Tests
```bash
# Run API tests
npm run test:api

# Run E2E tests
npm run test:e2e
```

## Deployment

### Environment Setup
1. **Production Database**: Set up PostgreSQL on Google Cloud
2. **Environment Variables**: Configure production secrets
3. **Domain**: Set up custom domain and SSL
4. **Email**: Configure Resend for production

### Build and Deploy
```bash
# Build for production
npm run build

# Start production server
npm start

# Or deploy to Vercel
vercel --prod
```

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database connection
npx prisma db pull

# Reset database
npx prisma migrate reset
```

#### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure JWT tokens are valid

#### Email Issues
- Verify `RESEND_API_KEY` is correct
- Check email domain is verified in Resend
- Test email sending in development

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Prisma debug
DEBUG=prisma:* npm run dev
```

## Getting Help

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)

### Support
- Check existing issues in repository
- Create new issue with detailed description
- Include error logs and environment details

## Next Steps

1. **Explore the Codebase**: Familiarize yourself with the project structure
2. **Set Up Development Environment**: Follow the setup instructions
3. **Read the API Documentation**: Understand the available endpoints
4. **Start Building**: Begin implementing new features
5. **Test Thoroughly**: Ensure all changes are properly tested

Happy coding! 🚀
