# Copilot Instructions – Development Guidelines for Rust Projects

> Use this file to guide GitHub Copilot and developers to follow consistent, high-quality practices when writing or updating code in this project.

---

## General Rules (For All Code)

### Code Quality
- The code is **properly formatted** (`npm run format:check`).
- Dependencies must be **free of known security vulnerabilities** (`npm run security:check`).
- Code **compiles without errors** and passes:
  - Linting (`npm run lint:check`)
  - Unit tests (`npm run test:ci`)
  - Integration tests
  - Type checking (`npm run typing:check`)

### Documentation
- Public items in libraries **must include JSDoc comments** (`/** */`).
- All implementation changes must be **reflected in documentation**, including:
  - JSDoc comments
  - Design documents (if applicable, e.g., mermaid diagrams)
- **Documentation must be version controlled**.
