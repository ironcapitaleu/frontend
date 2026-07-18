---
name: linear
description: >
  This skill should be used when the user asks to "create a linear issue", "add a ticket",
  "make a linear ticket", "create a SPIKE", "create a FEATURE ticket", "list my issues",
  "search linear", "update a ticket", or needs to interact with Linear in any way
  (creating, reading, updating, or searching issues).
version: 0.1.0
argument-hint: "[create|list|search|get|update] [details]"
allowed-tools: [Read, Write, Edit, Bash, AskUserQuestion, mcp__linear__create_issue, mcp__linear__get_issue, mcp__linear__list_issues, mcp__linear__list_teams, mcp__linear__list_projects, mcp__linear__search_issues, mcp__linear__update_issue]
---

# Linear Issue Management Skill

## Purpose

Create, read, update, and search Linear issues for the State-machine team. All issues follow
a consistent template structure with typed labels, user stories, and definition-of-done checklists.

## Team & Workspace

- **Team:** State-machine
- **Team ID:** `2f641ff7-6c29-4aa7-9bc5-659ff838e4ad`
- **Team Key:** STA

## Issue Type Philosophy

Each issue type exists for a specific reason in the development workflow:

| Type | Purpose | Preconditions | Outputs |
| --- | --- | --- | --- |
| **SPIKE** | Reduce ambiguity. Research a topic so that a later implementation ticket can be written with clear, concrete requirements. | Unclear requirements, multiple possible approaches, or unfamiliar technology. | A findings document linked in the ticket. A recommendation for how to proceed. |
| **FEATURE** | Implement new functionality. Requirements should already be reasonably clear (often from a preceding SPIKE). | Clear acceptance criteria. Design docs or SPIKE findings available. | Working code, tests, PR merged. |
| **REFACTOR** | Restructure existing code without changing external behavior. | Code works but is hard to maintain, extend, or understand. | Same behavior, better structure. |
| **IMPLEMENTATION** | General implementation that doesn't fit FEATURE (e.g., wiring, integration, infra). | Requirements known. | Working code, tests, PR merged. |
| **ONBOARDING** | Structured learning path for team members to get productive. | New team member or new technology area. | Completed reading/exercises. |
| **DOCS** | Improve documentation quality and consistency. | Docs are missing, outdated, or inconsistent. | Updated documentation. |
| **TEST** | Add or review test coverage. | Code exists but tests are missing or inadequate. | Test suite improvements. |
| **FRONTEND** | UI/frontend implementation or changes. | Design or requirements available. | Working UI, tests, PR merged. |
| **DESIGN** | Architectural/design work producing diagrams or specs. | System needs to be designed before implementation. | Design documents, diagrams. |

### The SPIKE → FEATURE Pipeline

SPIKEs exist to **de-risk** implementation. The pattern is:

1. **SPIKE** — research, compare approaches, write findings, make a recommendation
2. **FEATURE** — implement the recommendation with clear acceptance criteria

SPIKEs always link to their related implementation ticket. FEATURE tickets that were preceded
by a SPIKE link back to it for context.

## Issue Types (Labels)

| Label | Title Prefix | Priority (typical) |
| --- | --- | --- |
| FEATURE | `[FEATURE]` | High (2) |
| SPIKE | `[SPIKE]` | High (2) |
| REFACTOR | `[REFACTOR]` | Medium (3) |
| IMPLEMENTATION | `[IMPLEMENTATION]` | High (2) |
| ONBOARDING | `[ONBOARDING]` | High (2) |
| DOCS | `[DOCS]` | High (2) or Medium (3) |
| TEST | `[TEST]` | Medium (3) |
| FRONTEND | `[FRONTEND]` | Medium (3) |
| DESIGN | `[DESIGN]` | High (2) |
| (none) | (no prefix) | Varies |

### Priority Scale

| Value | Label | Meaning |
| --- | --- | --- |
| 1 | Urgent | Blocking other work, needs immediate attention |
| 2 | High | Important, on the critical path, default for most tickets |
| 3 | Medium | Should be done but not blocking, backlog-worthy |
| 4 | Low | Nice to have, do when time permits |

## Title Format

Titles follow: `[PREFIX] Descriptive Title`

Use backtick-quoted code names where appropriate:

    [FEATURE] `StockScreener` filter by market cap
    [SPIKE] Design authentication flow with Supabase
    [DOCS] Documentation Consistency
    [FRONTEND] Responsive layout for `ContactPage`

**Exception:** Basic user tickets have NO prefix — just the descriptive title.

## Issue Templates

### FEATURE Template

```markdown
## **User Story:**

As a …,

I want to …,

so that … .

## **Description:**

/

## Definition of Done:

- [ ] …
- [ ] …
- [ ] The Software Development Guidelines outlined in [AGENTS.md](../AGENTS.md) are followed

## **Related Design Documents:**

/

## **Additional Notes:**

/

---
```

### REFACTOR Template

```markdown
## **User Story:**

As a …,

I want to …,

so that … .

## **Description:**

/

## Definition of Done:

- [ ] …
- [ ] …
- [ ] Make sure the Software Development Guidelines outlined in [AGENTS.md](../AGENTS.md) are followed

## **Related Design Documents:**

/

## **Additional Notes:**

/

---
```

### IMPLEMENTATION Template (General)

```markdown
## **User Story:**

As a …,

I want to …,

so that … .

## **Description:**

/

## Definition of Done:

- [ ] …
- [ ] …
- [ ] Follow the Software Development Guidelines outlined in [AGENTS.md](../AGENTS.md)

## **Related Design Documents:**

/

## **Additional Notes:**

/

---
```

### SPIKE Template

```markdown
## **User Story:**

As a developer,

I want to …

so that I can implement … .

## **Description:**

This SPIKE ticket is related to the implementation ticket [STA-XXX](url).

## Definition of Done:

- [ ] Review …
  - [ ] …
  - [ ] …
- [ ] Write a document (e.g., Linear document) containing the findings of this research.
  - [ ] Summarize these review findings and discuss potential alternatives (if they exist) on a very high level. Discuss pros and cons for each approach.
  - [ ] Based on the summary, make a recommendation as to how … should be ideally implemented.
  - [ ] Link the created written document in the "Link to Findings" section in this ticket

## **Additional Notes:**

/

## **Link to Findings:**

/
```

### FRONTEND Template

```markdown
## **User Story:**

As a …,

I want to …,

so that … .

## **Description:**

/

## Definition of Done:

- [ ] …
- [ ] …
- [ ] The Software Development Guidelines outlined in [AGENTS.md](../AGENTS.md) are followed
- [ ] Sitemap page and sitemap XML are updated (if adding/modifying pages)

## **Related Design Documents:**

/

## **Additional Notes:**

/

---
```

### BASIC USER TICKET Template (no prefix)

```markdown
## **User Story:**

As a …,

I want to …,

so that … .

## **Description:**

/

## Definition of Done:

- [ ] …
- [ ] …

## **Additional Notes:**

/

---
```

## Building the Definition of Done

The Definition of Done (DoD) is the most critical part of every ticket — it defines when work
is complete and prevents scope ambiguity. Every DoD should be constructed deliberately using
the following methodology.

### Structure Rules

1. **Two levels of nesting:** Top-level checkboxes are major deliverables or work areas.
   Nested checkboxes are specific, actionable tasks within that deliverable.
2. **Actionable items only:** Each checkbox should describe a concrete action or artifact,
   not a vague aspiration. "Implement error handling" → good. "Think about errors" → bad.
3. **Ordered by execution flow:** Items should roughly follow the order in which they'd be
   completed. Research before implementation, implementation before testing.
4. **Final item is always the guidelines link** (for FEATURE, REFACTOR, IMPLEMENTATION, FRONTEND types).

### How to Build the DoD Interactively

When the user provides enough context, infer the DoD from the problem description and domain
knowledge. Draft it fully and present it in the created ticket.

When context is insufficient, use `AskUserQuestion` to clarify:

1. **What are the major deliverables?** — These become top-level checkboxes.
2. **What specific sub-tasks does each deliverable involve?** — These become nested checkboxes.
3. **Are there specific questions to answer or alternatives to compare?** (SPIKEs)
4. **Are there specific components or pages affected?** (FEATURE/FRONTEND)
5. **What does "done" look like — how would you verify this is complete?**

## Workflow: Creating an Issue

### Step 1: Gather Information

Use `AskUserQuestion` to collect:

1. **Issue type** — options: FEATURE, SPIKE, REFACTOR, IMPLEMENTATION, ONBOARDING, DOCS, TEST, FRONTEND, DESIGN, Basic (no prefix)
2. **Title** — what is this issue about? (will be formatted as `[TYPE] Title`, or just `Title` for basic)
3. **User story** — what do you want and why?
4. **Priority** — options: Urgent (1), High (2), Medium (3), Low (4) — default High (2)

If the user provided enough context when invoking the skill, skip questions you can already
answer. Infer what you can from conversation context.

### Step 2: Build the Description and Definition of Done

Based on the issue type, fill in the appropriate template. The DoD is the most important
part — follow the "Building the Definition of Done" section above to construct it.

### Step 3: Create the Issue

Use `mcp__linear__create_issue` with:
- `teamId`: `2f641ff7-6c29-4aa7-9bc5-659ff838e4ad`
- `title`: formatted as `[LABEL] Title` (or just `Title` for basic)
- `description`: filled template
- `priority`: user-selected (default 2)
- `labelIds`: match the label to existing IDs (see Label IDs section). Omit if the label ID is not yet captured.

### Step 4: Confirm

Show the user the created issue URL and summary.

## Workflow: Reading / Searching Issues

- **List issues:** Use `mcp__linear__list_issues` with team filter
- **Search:** Use `mcp__linear__search_issues` with keywords
- **Get details:** Use `mcp__linear__get_issue` with the issue ID
- **List teams:** Use `mcp__linear__list_teams` to discover team IDs when needed
- **List projects:** Use `mcp__linear__list_projects` to discover project IDs for filtering

When presenting issues to the user, show: identifier, title, status, assignee, and URL.

## Workflow: Updating an Issue

Use `mcp__linear__update_issue` to change status, assignee, priority, or description.
Always confirm with the user before making changes.

## Label IDs

| Label | ID |
| --- | --- |
| FEATURE | `c7fc7896-32b6-4c22-bcce-9f6cda3c935a` |
| SPIKE | `12ddfaf0-6644-459a-bd71-1765b2f7b795` |
| REFACTOR | `f4ab8267-331c-400a-8b54-4e6424b7f3e7` |
| DOCS | `4ae80929-fd9a-4d24-9e05-1c896d374700` |
| ONBOARDING | `339b3f41-9f48-4574-a958-ff76cf82795e` |

**Note:** Label IDs for IMPLEMENTATION, TEST, FRONTEND, and DESIGN are not yet captured.
When creating an issue with one of these types for the first time, omit `labelIds` — the
label can be added manually in Linear, and the ID should be captured here afterwards.

## Conventions

- **SPIKE before FEATURE (when needed):** When requirements are unclear or multiple approaches exist, create a SPIKE before the FEATURE.
- **Comments as progress logs:** Use comments for meeting notes and progress updates.
- **Related tickets:** Always cross-reference related issues with `[STA-XXX](url)` format.
- **Empty fields:** Use `/` for sections with no content.
- **Next steps in Additional Notes:** When a ticket enables follow-on work, note it.

## Self-Improvement

After creating an issue where the user corrected or refined the template, naming, or workflow:

1. Ask: "Should I update the linear skill with this change?"
2. If yes, update the relevant section in this SKILL.md.
3. Apply after user approval.
