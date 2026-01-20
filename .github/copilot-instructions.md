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


## Import Order Conventions

To ensure readability and consistency, all imports in this project must be grouped and ordered as follows:

1. **Standard Library Imports**  
   All imports from `Node.js` `built-in`s or standard libraries (e.g., `fs`, `path`, `crypto`) should appear first. (Less common in browser-focused projects like this one.)

2. **External Package Imports**  
   Imports from third-party crates (e.g., `react`, `vitest`, `@supabase/supabase-js`) should follow, grouped together.

3. **Internal Crate Imports**  
   Imports from within this project (e.g., `,/components/Header`, `../hooks/useAuth`) should come last.

Within each group, order imports alphabetically by module name. Separate each group with a single blank line for clarity. Prefer named imports over default where it improves clarity.

After the final line of imports, other top-level declarations (e.g., `constants`, `types`) can follow.

**Example:**
```javascript
import crypto from 'crypto';
import fs from 'fs';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import { Header } from './components/Header';
import { useAuth } from '../hooks/useAuth';
```

---
