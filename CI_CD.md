# CI/CD Pipeline Documentation

## Overview
Automated testing and quality checks run on every push and pull request.

## Pipeline Jobs

### 1. Frontend Tests
- **Runs on**: Node 18.x, 20.x
- **Tests**: 88 unit tests (Vitest)
- **Coverage**: Uploaded to Codecov
- **Time**: ~2 minutes

### 2. Backend Tests
- **Runs on**: Node 18.x, 20.x
- **Unit Tests**: Service layer tests
- **Integration Tests**: 23 API/DB/Auth tests
- **Coverage**: Uploaded to Codecov
- **Time**: ~3 minutes

### 3. Code Quality (Lint)
- **Frontend**: ESLint checks
- **Backend**: ESLint checks
- **Time**: ~1 minute

### 4. Build Check
- **Frontend**: Vite production build
- **Backend**: TypeScript compilation
- **Runs after**: All tests pass
- **Time**: ~2 minutes

## Workflow Triggers

### Push Events
- `main` branch
- `master` branch
- `develop` branch

### Pull Request Events
- Targeting `main`, `master`, or `develop`

## Status Badges

Add to your README.md:
```markdown
![CI Pipeline](https://github.com/ArtificalManny/ShareSync/workflows/CI%20Pipeline/badge.svg)
[![codecov](https://codecov.io/gh/ArtificalManny/ShareSync/branch/main/graph/badge.svg)](https://codecov.io/gh/ArtificalManny/ShareSync)
```

## Local Testing

Test what CI will run:
```bash
# Frontend
cd ShareSync-frontend
npm test -- --coverage --watchAll=false
npm run build

# Backend
cd ShareSync-backend
npm test -- --coverage --watchAll=false
npm run test:integration -- --forceExit
npm run build
```

## Required Secrets

Add to GitHub Settings → Secrets:

| Secret | Description | Required |
|--------|-------------|----------|
| CODECOV_TOKEN | Code coverage reporting | Optional |

## Troubleshooting

### Tests fail in CI but pass locally
- Check Node version matches (use nvm)
- Ensure all dependencies in package.json
- Check for environment-specific code

### Build fails
- Run `npm run build` locally first
- Check TypeScript errors
- Verify all imports are correct

### Integration tests timeout
- MongoDB connection issues
- Increase timeout in jest config
- Check for hanging async operations

## Performance

**Average Pipeline Time**: ~8 minutes
- Parallel jobs speed up execution
- Caching reduces dependency install time
- Matrix strategy ensures compatibility

## Future Enhancements

- [ ] Deployment to staging on develop branch
- [ ] Deployment to production on main branch
- [ ] E2E tests with Cypress/Playwright
- [ ] Performance regression testing
- [ ] Security scanning (Snyk/Dependabot)
- [ ] Docker image building
