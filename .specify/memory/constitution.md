# NameDrop Development Constitution

## Core Principles

### 1. User-Centric Design
- Every feature must solve a real user problem
- UI/UX decisions prioritize user experience over developer convenience
- Accessibility is not optional - all interfaces must be WCAG 2.1 AA compliant

### 2. Code Quality Standards
- **Single Responsibility**: Each function, component, and file has one clear purpose
- **TypeScript Excellence**: Strict typing, no `any` types without explicit justification
- **Comprehensive Documentation**: JSDoc for all public APIs with examples
- **Error Handling**: Graceful error handling with meaningful user feedback

### 3. Security First
- All user data must be encrypted in transit and at rest
- Authentication and authorization are non-negotiable
- Input validation using Zod schemas
- No secrets in code - environment variables only

### 4. Performance Standards
- Page load times < 2 seconds
- API response times < 500ms
- Mobile-first responsive design
- Optimized images and lazy loading

### 5. Technology Stack Alignment
- **UI Framework**: shadcn/ui + Radix UI primitives
- **Data Fetching**: TanStack Query for server state management
- **Email Service**: Resend for transactional emails
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT tokens

### 6. Development Workflow
- Feature branches follow pattern: `001-feature-name`
- Comprehensive testing before deployment
- Code review required for all changes
- Documentation updated with every feature

### 7. Scalability Considerations
- Support up to 100 concurrent users initially
- Database queries optimized with proper indexing
- Component architecture supports future growth
- API design follows RESTful principles

## Prohibited Practices

❌ **NEVER** use `any` type without explicit justification  
❌ **NEVER** hardcode configuration values  
❌ **NEVER** skip error handling  
❌ **NEVER** ignore TypeScript errors  
❌ **NEVER** create files over 300 lines without splitting  
❌ **NEVER** skip accessibility testing  
❌ **NEVER** commit code without tests  
❌ **NEVER** use `console.log` in production  

## Required Artifacts

Every feature must include:
- [ ] Feature specification with clarifications
- [ ] Implementation plan with phases
- [ ] Data model documentation
- [ ] API contracts
- [ ] Task breakdown
- [ ] Test strategy
- [ ] Deployment considerations