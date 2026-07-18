# Contributing to This Project

Thank you for considering contributing.
From bug reports and feature requests to documentation improvements and code, we welcome all kinds of contributions.

## How to Contribute

- Report bugs via [issues](https://github.com/ironcapitaleu/frontend/issues/new)
- Propose features via [issues](https://github.com/ironcapitaleu/frontend/issues/new)
- Submit code via [pull requests](https://github.com/ironcapitaleu/frontend/pulls)

## Submitting Code via Pull Requests

By submitting a pull request, you agree that your contribution will be licensed under the same license as this project.

### Getting Started

1. **Fork** the repository and **clone** it locally:

   ```bash
   git clone https://github.com/ironcapitaleu/frontend.git
   cd frontend
   ```

2. Install dependencies and verify everything works:

   ```bash
   npm install
   npm run build
   ```

3. Create a new branch from `dev`:

   ```bash
   git checkout dev
   git checkout -b your-feature-name
   ```

### Code Guidelines

Make sure the [development guidelines](../AGENTS.md) are followed at all times.

### Pre-Push Verification

Before pushing, run the full check suite locally:

```bash
npm run format:check
npm run security:check
npm run lint:check
npm run typing:check
npm run build
npm run test:ci
```

### Submitting a Pull Request

1. Make sure your branch is up to date:

   ```bash
   git pull origin dev
   ```

2. Push your changes:

   ```bash
   git push origin your-feature-name
   ```

3. Open a Pull Request **targeting `dev`** (not `main`) with a clear title and description using the PR template.
