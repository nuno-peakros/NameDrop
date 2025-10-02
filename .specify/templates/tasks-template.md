# Tasks Template

## Feature: {FEATURE_NAME}

### Setup Tasks
- [ ] **T001**: Project initialization and dependency installation
- [ ] **T002**: Environment configuration and secrets setup
- [ ] **T003**: Linting and code quality tools configuration

### Test Tasks [P]
- [ ] **T004**: Contract test for {CONTRACT_NAME}
- [ ] **T005**: Integration test for {INTEGRATION_SCENARIO}

### Core Tasks
- [ ] **T006**: Model creation for {ENTITY_NAME}
- [ ] **T007**: Service implementation for {SERVICE_NAME}
- [ ] **T008**: Endpoint implementation for {ENDPOINT_NAME}

### Integration Tasks
- [ ] **T009**: Database connection setup
- [ ] **T010**: Middleware configuration
- [ ] **T011**: Logging implementation

### Polish Tasks [P]
- [ ] **T012**: Unit tests for {COMPONENT_NAME}
- [ ] **T013**: Performance optimization
- [ ] **T014**: Documentation updates

## Parallel Execution Examples

### Group 1: Contract Tests [P]
```bash
# These can run in parallel
Task agent: T004
Task agent: T005
```

### Group 2: Model Creation [P]
```bash
# These can run in parallel
Task agent: T006
Task agent: T007
```

## Dependencies
- T001 → T002 → T003 (Setup sequence)
- T004, T005 → T006, T007 (Tests before implementation)
- T006 → T008 (Models before endpoints)
- T008 → T009, T010, T011 (Core before integration)
- T009, T010, T011 → T012, T013, T014 (Everything before polish)