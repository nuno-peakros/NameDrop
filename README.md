# NameDrop

A modern, secure, and accessible user management system built with Next.js, TypeScript, and Prisma.

## 🚀 Features

- **Authentication & Authorization**: Secure JWT-based authentication with role-based access control
- **User Management**: Complete CRUD operations for user accounts with admin dashboard
- **Email Verification**: Automated email verification and password reset functionality
- **Security**: Comprehensive security measures including CSRF protection, rate limiting, and input validation
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Performance**: Optimized for speed with bundle analysis and performance monitoring
- **Testing**: Comprehensive test suite with unit tests, integration tests, and E2E tests
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS and shadcn/ui

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Testing**: Vitest, Playwright, Testing Library
- **Email**: Resend
- **Deployment**: Docker with Nginx

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Docker (optional)
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/namedrop.git
cd namedrop
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/namedrop"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"

# App Configuration
NODE_ENV="development"
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
namedrop/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── dashboard/         # Admin dashboard
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility libraries
│   ├── auth.ts            # Authentication configuration
│   ├── db.ts              # Database connection
│   ├── security-utils.ts  # Security utilities
│   └── utils.ts           # General utilities
├── prisma/                # Database schema and migrations
├── __tests__/             # Test files
├── tests/                 # E2E tests
├── docs/                  # Documentation
└── public/                # Static assets
```

## 🔧 Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
```

### Testing
```bash
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage
npm run test:e2e     # Run E2E tests
npm run test:all     # Run all tests
```

### Security
```bash
npm run security:test    # Run security tests
npm run security:e2e     # Run security E2E tests
npm run security:audit   # Run security audit
npm run security:scan    # Run complete security scan
```

### Performance
```bash
npm run analyze          # Analyze bundle size
npm run analyze:server   # Analyze server bundle
npm run analyze:browser  # Analyze browser bundle
npm run performance:test # Run performance tests
```

### Accessibility
```bash
npm run accessibility:test  # Run accessibility tests
npm run accessibility:e2e   # Run accessibility E2E tests
npm run accessibility:audit # Run accessibility audit
```

## 🔐 Security Features

- **Authentication**: JWT-based authentication with secure token handling
- **Authorization**: Role-based access control (RBAC)
- **CSRF Protection**: Cross-site request forgery protection
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input sanitization and validation
- **XSS Prevention**: Cross-site scripting protection
- **SQL Injection Prevention**: Parameterized queries with Prisma
- **Security Headers**: Comprehensive security headers
- **Password Security**: Strong password policies and hashing
- **Session Management**: Secure session handling

## ♿ Accessibility Features

- **WCAG 2.1 AA Compliance**: Meets accessibility standards
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Color Contrast**: WCAG compliant color combinations
- **Focus Management**: Proper focus indicators and management
- **Responsive Design**: Accessible across all device sizes

## 🚀 Performance Features

- **Bundle Optimization**: Code splitting and tree shaking
- **Image Optimization**: Next.js image optimization
- **Caching**: Browser and CDN caching strategies
- **Performance Monitoring**: Real-time performance metrics
- **Bundle Analysis**: Webpack bundle analyzer integration

## 🧪 Testing

### Unit Tests
- **Coverage**: 95%+ code coverage
- **Frameworks**: Vitest, Testing Library
- **Scope**: All utilities, components, and API routes

### Integration Tests
- **Database**: Prisma integration tests
- **API**: End-to-end API testing
- **Authentication**: Auth flow testing

### E2E Tests
- **Framework**: Playwright
- **Browsers**: Chrome, Firefox, Safari
- **Scenarios**: Critical user flows

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login with email and password.

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
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "USER"
  },
  "token": "jwt-token"
}
```

#### POST /api/auth/register
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
  "message": "User registered successfully"
}
```

### User Management Endpoints

#### GET /api/users
Get list of users (admin only).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `role`: Filter by role
- `status`: Filter by status

#### POST /api/users
Create a new user (admin only).

**Request:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "role": "USER"
}
```

## 🐳 Docker Deployment

### Using Docker Compose

1. **Clone and setup:**
```bash
git clone https://github.com/your-username/namedrop.git
cd namedrop
```

2. **Configure environment:**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. **Start services:**
```bash
docker-compose up -d
```

4. **Run migrations:**
```bash
docker-compose exec app npm run db:migrate
```

5. **Seed database:**
```bash
docker-compose exec app npm run db:seed
```

### Manual Docker Build

```bash
# Build image
docker build -t namedrop .

# Run container
docker run -p 3000:3000 --env-file .env.local namedrop
```

## 🌐 Production Deployment

### Environment Variables

```env
# Production Configuration
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret

# Database
DATABASE_URL=postgresql://user:pass@host:5432/namedrop

# Email
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@yourdomain.com

# Security
RATE_LIMIT_ENABLED=true
HTTPS_ENABLED=true
```

### Deployment Checklist

- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Set up SSL certificate
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring and logging
- [ ] Run security audit
- [ ] Test all functionality
- [ ] Set up backups

## 📊 Monitoring

### Performance Monitoring
- Real-time performance metrics
- Bundle size analysis
- Core Web Vitals tracking
- Performance score calculation

### Security Monitoring
- Security event logging
- Threat detection
- Vulnerability scanning
- Incident response

### Application Monitoring
- Error tracking
- User analytics
- Database performance
- API response times

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests:**
   ```bash
   npm run test:all
   ```
5. **Commit your changes:**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Follow accessibility guidelines
- Ensure security best practices
- Document your code
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/namedrop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/namedrop/discussions)
- **Email**: support@yourdomain.com

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - Database toolkit
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Resend](https://resend.com/) - Email service

## 📈 Roadmap

### Version 1.1
- [ ] Advanced user roles and permissions
- [ ] Audit logging
- [ ] API rate limiting dashboard
- [ ] Advanced security features

### Version 1.2
- [ ] Multi-tenant support
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Webhook system

### Version 2.0
- [ ] Microservices architecture
- [ ] Advanced AI features
- [ ] Enterprise SSO
- [ ] Advanced reporting

---

**Built with ❤️ by the NameDrop Team**# Deployment trigger Fri Oct  3 11:25:59 BST 2025
