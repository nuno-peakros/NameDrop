# Deployment Guide

This guide provides comprehensive instructions for deploying NameDrop to production environments.

## 🚀 Quick Deployment

### Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Docker (optional)
- Domain name and SSL certificate
- Email service (Resend recommended)

### 1. Environment Setup

Create production environment file:

```bash
cp .env.example .env.production
```

Configure production variables:

```env
# Production Configuration
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secure-secret-key

# Database
DATABASE_URL=postgresql://username:password@host:5432/namedrop

# Email Service
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@yourdomain.com

# Security
RATE_LIMIT_ENABLED=true
HTTPS_ENABLED=true
CSRF_PROTECTION=true

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

### 2. Database Setup

#### Option A: Local PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb namedrop

# Create user
sudo -u postgres createuser --interactive
```

#### Option B: Cloud Database (Recommended)

**AWS RDS:**
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier namedrop-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password your-password \
  --allocated-storage 20
```

**Supabase:**
1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from project settings
3. Update `DATABASE_URL` in environment file

### 3. Build and Deploy

#### Option A: Vercel (Recommended)

1. **Connect Repository:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables:**
   - Go to Vercel dashboard
   - Navigate to project settings
   - Add all environment variables

3. **Configure Domain:**
   - Add custom domain in Vercel dashboard
   - Configure DNS records

#### Option B: Docker Deployment

1. **Build Docker Image:**
   ```bash
   # Build image
   docker build -t namedrop:latest .
   
   # Tag for registry
   docker tag namedrop:latest your-registry/namedrop:latest
   
   # Push to registry
   docker push your-registry/namedrop:latest
   ```

2. **Deploy with Docker Compose:**
   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   services:
     app:
       image: your-registry/namedrop:latest
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DATABASE_URL=${DATABASE_URL}
         - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
       depends_on:
         - postgres
     
     postgres:
       image: postgres:15
       environment:
         - POSTGRES_DB=namedrop
         - POSTGRES_USER=admin
         - POSTGRES_PASSWORD=password
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

3. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

#### Option C: Traditional VPS

1. **Server Setup:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Application Deployment:**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/namedrop.git
   cd namedrop
   
   # Install dependencies
   npm ci --production
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start npm --name "namedrop" -- start
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration:**
   ```nginx
   # /etc/nginx/sites-available/namedrop
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Enable Site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/namedrop /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### 4. SSL Certificate

#### Option A: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Option B: Cloudflare (Recommended)

1. Add domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS encryption
4. Configure security settings

### 5. Database Migration

```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 6. Health Check

```bash
# Check application health
curl https://yourdomain.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "services": {
    "database": "healthy",
    "email": "healthy"
  }
}
```

## 🔧 Production Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `NEXTAUTH_URL` | Application URL | Yes | - |
| `NEXTAUTH_SECRET` | JWT secret key | Yes | - |
| `DATABASE_URL` | Database connection | Yes | - |
| `RESEND_API_KEY` | Email service key | Yes | - |
| `FROM_EMAIL` | Sender email | Yes | - |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | No | `true` |
| `HTTPS_ENABLED` | Force HTTPS | No | `true` |
| `CSRF_PROTECTION` | Enable CSRF | No | `true` |

### Security Configuration

```env
# Security Headers
SECURITY_HEADERS_ENABLED=true
CSP_ENABLED=true
HSTS_ENABLED=true

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session Security
SESSION_MAX_AGE=86400000
SESSION_SECURE=true
SESSION_HTTP_ONLY=true
```

### Performance Configuration

```env
# Caching
CACHE_ENABLED=true
CACHE_TTL=3600

# Compression
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6

# Image Optimization
IMAGE_OPTIMIZATION_ENABLED=true
IMAGE_QUALITY=80
```

## 📊 Monitoring Setup

### 1. Application Monitoring

#### Sentry (Error Tracking)

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure Sentry
# sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

#### Logging

```bash
# Install Winston
npm install winston

# Configure logging
# lib/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})
```

### 2. Infrastructure Monitoring

#### Uptime Monitoring

**UptimeRobot:**
1. Create account at [uptimerobot.com](https://uptimerobot.com)
2. Add monitor for your domain
3. Configure alerting

**Pingdom:**
1. Create account at [pingdom.com](https://pingdom.com)
2. Add website monitor
3. Configure notifications

#### Performance Monitoring

**Vercel Analytics:**
```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to app
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## 🔒 Security Hardening

### 1. Server Security

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw enable
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

### 2. Application Security

```env
# Security Headers
X_FRAME_OPTIONS=DENY
X_CONTENT_TYPE_OPTIONS=nosniff
X_XSS_PROTECTION=1; mode=block
REFERRER_POLICY=strict-origin-when-cross-origin

# Content Security Policy
CSP_DEFAULT_SRC='self'
CSP_SCRIPT_SRC='self' 'unsafe-inline'
CSP_STYLE_SRC='self' 'unsafe-inline'
CSP_IMG_SRC='self' data: https:
```

### 3. Database Security

```sql
-- Create read-only user
CREATE USER namedrop_readonly WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO namedrop_readonly;

-- Create application user
CREATE USER namedrop_app WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO namedrop_app;
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check database status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U username -d namedrop

# Check logs
sudo journalctl -u postgresql
```

#### 2. Application Not Starting

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs namedrop

# Restart application
pm2 restart namedrop
```

#### 3. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL
openssl s_client -connect yourdomain.com:443
```

#### 4. Performance Issues

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check application logs
pm2 logs namedrop --lines 100
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm start

# Check specific module
DEBUG=prisma:* npm start

# Check authentication
DEBUG=nextauth:* npm start
```

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database setup and migrations run
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Monitoring setup
- [ ] Backup strategy implemented

### Post-Deployment

- [ ] Health check passes
- [ ] All functionality tested
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Logs being collected
- [ ] Backup working
- [ ] Security scan passed
- [ ] Documentation updated

### Ongoing Maintenance

- [ ] Regular security updates
- [ ] Database backups
- [ ] Log rotation
- [ ] Performance monitoring
- [ ] Security audits
- [ ] Dependency updates
- [ ] SSL certificate renewal

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:all
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - npm ci
    - npm run test:all

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - .next/
    expire_in: 1 hour

deploy:
  stage: deploy
  script:
    - echo "Deploying to production..."
  only:
    - main
```

## 📞 Support

For deployment issues:

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/namedrop/issues)
- **Email**: support@yourdomain.com
- **Discord**: [Join our Discord](https://discord.gg/namedrop)

---

**Happy Deploying! 🚀**
