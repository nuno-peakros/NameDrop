<!--
Sync Impact Report:
- Version change: 1.0.0 → 2.0.0
- Modified principles: Enhanced TDD requirements, added deployment principles
- Added sections: Deployment Standards, CI/CD Requirements, Next.js 15.5.4 Specifics
- Removed sections: None
- Templates requiring updates: ✅ updated constitution.md, ⚠ pending plan-template.md, ⚠ pending tasks-template.md
- Follow-up TODOs: Update templates to reflect new deployment and testing requirements
-->

# NameDrop Constitution

## Core Principles

### I. Single Responsibility Principle
Every function, component, and file MUST have a single, clear purpose. Functions should do ONE thing well, files should be under 200 lines when possible, and components should handle one specific concern. Complex logic MUST be extracted into focused utility functions.

### II. TypeScript Excellence (NON-NEGOTIABLE)
Strict TypeScript configurations are mandatory. ALL functions MUST have proper interfaces and types defined. The use of `any` types is PROHIBITED without explicit justification. Discriminated unions MUST be used for complex state management.

### III. Comprehensive Documentation (MANDATORY)
Every public function MUST have JSDoc comments with parameter types, return types, examples, and error conditions. Documentation must explain the "why" not just the "what". README files MUST be kept updated with architecture decisions.

### IV. Test-First Development (NON-NEGOTIABLE)
TDD is mandatory: Tests written → User approved → Tests fail → Then implement. Red-Green-Refactor cycle strictly enforced. Unit tests for pure functions, integration tests for APIs, and comprehensive error handling validation required. All tests MUST pass before any code is committed. Test coverage MUST be maintained above 80% for all new code.

### V. Error Handling Mastery
ALL operations that can fail MUST use Result/Either patterns for better error handling. Errors MUST be handled gracefully with proper context logging. Meaningful error messages MUST be provided to users.

### VI. Framework-First Approach
Existing project frameworks and libraries MUST be used before introducing new ones. Zod for validation, TanStack Query for data fetching, Shadcn/ui for components, and established patterns MUST be leveraged. New dependencies require explicit justification.

### VII. Deployment Excellence (MANDATORY)
All deployments MUST be automated through GitHub Actions. Code MUST be tested, built, and deployed to Google Cloud VM using Docker containers. Zero-downtime deployments are required with proper health checks and rollback capabilities.

### VIII. Security-First Development
Security considerations MUST be integrated into every development phase. All inputs MUST be validated, authentication MUST be implemented properly, and secrets MUST be managed securely through environment variables and GitHub Secrets.

## Code Quality Standards

### File Organization
- Maximum file size: 200 lines (excluding imports and comments)
- Single responsibility per file with clear purpose
- Composition over inheritance patterns
- Small, focused modules with clear interfaces

### Type Safety Rules
- NO `any` types without explicit justification
- Proper interfaces for all data structures
- Discriminated unions for complex state
- Strict TypeScript configuration enforcement

### Documentation Requirements
- JSDoc comments for ALL public functions
- Parameter types, return types, and examples required
- Error conditions and side effects documented
- Architecture decisions documented in README

## Technology Stack

### Core Technologies
- **Frontend**: Next.js 15.5.4 with React 19.1.0
- **Styling**: Tailwind CSS 4 with PostCSS
- **Type Safety**: TypeScript 5+ with strict mode
- **Validation**: Zod schemas for runtime validation
- **Data Fetching**: TanStack Query for server state
- **UI Components**: Shadcn/ui + Lucide React icons
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context + useState/useReducer

### Development Tools
- **Package Manager**: npm with package-lock.json
- **Linting**: ESLint 9+ with Next.js config
- **Testing**: Vitest + Testing Library + Playwright
- **Build**: Next.js with Turbopack for development
- **Deployment**: Docker + Nginx + Google Cloud VM
- **CI/CD**: GitHub Actions with automated testing and deployment

### Next.js 15.5.4 Specific Requirements
- **App Router**: MUST use App Router (not Pages Router)
- **Server Components**: Prefer Server Components for data fetching
- **Client Components**: Use "use client" directive only when necessary
- **Middleware**: Implement proper middleware for authentication and routing
- **API Routes**: Use Route Handlers in app/api directory
- **Static Generation**: Leverage Static Site Generation (SSG) where possible
- **Image Optimization**: Use next/image for all images
- **Font Optimization**: Use next/font for custom fonts

## Development Workflow

### Code Review Process
1. MCP Documentation Checked - Use appropriate MCP server for technical queries
2. Single Responsibility verified
3. Comprehensive documentation added
4. Proper TypeScript types (no `any`)
5. Error handling implemented
6. Tests written and passing
7. Performance considerations addressed
8. Security validation completed
9. Logging added with proper context
10. Dependencies minimized and justified
11. Framework usage verified (existing tools preferred)
12. No duplication of existing functionality

### Prohibited Practices
- NEVER use `any` type without explicit justification
- NEVER create files over 300 lines without splitting
- NEVER hardcode configuration values
- NEVER skip error handling
- NEVER commit code without tests
- NEVER ignore TypeScript errors
- NEVER use `console.log` in production
- NEVER mutate props or external state
- NEVER create deeply nested components (max 3 levels)
- NEVER skip documentation for public APIs
- NEVER introduce new frameworks when existing ones suffice
- NEVER duplicate existing functionality without checking codebase

## Deployment Standards

### Google Cloud VM Requirements
- **VM Configuration**: Minimum 2 vCPUs, 4GB RAM, 20GB SSD
- **Operating System**: Ubuntu 22.04 LTS or newer
- **Docker**: Latest stable version with Docker Compose
- **Nginx**: Latest stable version for reverse proxy
- **SSL**: Let's Encrypt certificates with auto-renewal
- **Firewall**: Ports 22 (SSH), 80 (HTTP), 443 (HTTPS) open

### Docker Requirements
- **Multi-stage builds**: MUST use multi-stage Dockerfile for optimization
- **Security**: Run as non-root user (nextjs:nodejs)
- **Health checks**: Implement proper health check endpoints
- **Environment**: Use environment variables for configuration
- **Image size**: Optimize for minimal image size using Alpine base

### Nginx Configuration
- **SSL termination**: Handle HTTPS with proper certificates
- **Static files**: Serve static assets efficiently
- **Compression**: Enable gzip compression
- **Security headers**: Implement security headers (HSTS, CSP, etc.)
- **Rate limiting**: Implement rate limiting for API endpoints

## CI/CD Requirements

### GitHub Actions Workflow
- **Triggers**: Push to main/master, pull requests
- **Testing**: Run linting, type checking, and tests before deployment
- **Building**: Build Docker image and test locally
- **Deployment**: Deploy to Google Cloud VM only on main branch
- **Rollback**: Implement automatic rollback on health check failure

### Required Secrets
- `VM_HOST`: Google Cloud VM external IP address
- `VM_USER`: SSH username for VM access
- `VM_SSH_KEY`: Private SSH key for VM access
- `DOCKER_REGISTRY`: Container registry (optional)
- `NODE_ENV`: Environment configuration

### Deployment Process
1. **Code Push**: Developer pushes to main branch
2. **Automated Testing**: GitHub Actions runs full test suite
3. **Build**: Docker image built and tested
4. **Deploy**: Code deployed to VM via SSH
5. **Health Check**: Application health verified
6. **Rollback**: Automatic rollback if health check fails

### Quality Gates
- All tests MUST pass before deployment
- Code coverage MUST be above 80%
- No TypeScript errors allowed
- No ESLint errors allowed
- Docker build MUST succeed
- Health check MUST pass within 30 seconds

## Governance

This constitution supersedes all other development practices. Amendments require documentation, approval, and migration plan. All PRs and reviews MUST verify compliance with these principles. Complexity MUST be justified with clear rationale. Use existing project patterns and frameworks before introducing new dependencies.

**Version**: 2.0.0 | **Ratified**: 2024-10-02 | **Last Amended**: 2024-12-19