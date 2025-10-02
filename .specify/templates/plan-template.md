# Implementation Plan Template

## Execution Flow (Main Function)

### Phase 0: Research & Analysis
**Objective**: Understand the feature requirements and gather technical context

#### Step 1: Load Feature Specification
- Read and analyze the feature specification
- Identify key requirements, user stories, and acceptance criteria
- Note any technical constraints or dependencies

#### Step 2: Technical Context Analysis
- Review user-provided technical details
- Identify technology stack requirements
- Note any specific implementation preferences

#### Step 3: Generate Research Document
- Create `research.md` in specs directory
- Document findings and technical decisions
- Include technology recommendations and rationale

### Phase 1: Architecture & Design
**Objective**: Design the system architecture and data models

#### Step 4: Data Model Design
- Create `data-model.md` with database schema
- Define entity relationships and constraints
- Include migration strategies

#### Step 5: API Contract Definition
- Create `contracts/` directory
- Define REST API endpoints
- Document request/response schemas
- Include authentication requirements

#### Step 6: Quick Start Guide
- Create `quickstart.md` for developers
- Include setup instructions
- Document key concepts and patterns

### Phase 2: Implementation Planning
**Objective**: Break down implementation into manageable tasks

#### Step 7: Task Breakdown
- Create `tasks.md` with detailed implementation tasks
- Organize by phases and priorities
- Include time estimates and dependencies
- Define acceptance criteria for each task

#### Step 8: Progress Tracking
- Update progress tracking section
- Mark completed phases
- Note any blockers or issues

#### Step 9: Validation
- Verify all required artifacts are generated
- Check for completeness and consistency
- Ensure no ERROR states remain

## Progress Tracking

- [ ] Phase 0: Research & Analysis
- [ ] Phase 1: Architecture & Design  
- [ ] Phase 2: Implementation Planning
- [ ] All artifacts generated
- [ ] No ERROR states

## Error Handling

If any step fails:
1. Log the error with context
2. Attempt to continue with next step
3. Mark phase as ERROR in progress tracking
4. Provide clear error message in final report

## Gate Checks

Before proceeding to next phase:
- [ ] Current phase artifacts are complete
- [ ] No critical errors or missing information
- [ ] User requirements are clearly understood
- [ ] Technical decisions are documented