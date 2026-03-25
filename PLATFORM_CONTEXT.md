# Platform Context Index

> **For AI agents:** Read this entire document before running `/grill-me`, `/write-a-prd`, `/prd-to-plan`, or `/improve-codebase-architecture`. It tells you what already exists, what decisions have already been made, and what is genuinely unresolved. Do not ask questions that are answered here.

---

## How to Use This Document

**Before a discovery session (`/grill-me`):**

1. Read sections 1–5 to understand what already exists
2. Read section 6 (backlog) — these are known gaps, don't re-surface them as new discoveries
3. Read section 7 (genuine unknowns) — these ARE your starting questions
4. Only ask about things not covered in sections 1–6

**Before a planning session (`/write-a-prd`, `/prd-to-plan`):**

1. Read sections 3–5 to understand the current architecture and decisions
2. Cross-reference the backlog (section 6) — the new feature may overlap with or depend on open issues
3. Do not contradict architectural decisions in section 5 without flagging it explicitly

**Before an architecture review (`/improve-codebase-architecture`):**

1. Read section 4 (current modules) — you'll see what already exists
2. Read section 6 (backlog) — issues #7 and #8 are already known architectural items; do not re-surface them as new findings

---

## 1. Platform Overview

**What it is:** A tag management web app for operations teams. Lets users create, edit, and delete JavaScript tags per advertiser. Each tag is stored in SQLite and written as a `.js` file to disk, ready to be placed on the advertiser's website.

**Who uses it:** Internal operations team (no external users, no auth).

**Status:** Feature-complete POC. Deployed at https://tagmanagerpoc.vercel.app. Not yet in production use.

---

## 2. Knowledge Sources

Read these in order when onboarding to this codebase:

| Source                  | Location                                                            | What it answers                                                                                      |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **PRD**                 | [docs/tag-manager-prd.md](./docs/tag-manager-prd.md)                | What the product does, user stories, acceptance criteria, DB schema, API contract, out-of-scope list |
| **Implementation Plan** | [docs/plans/tag-manager.md](./docs/plans/tag-manager.md)            | How it was built (5 phases), architectural decisions, what each phase covered                        |
| **Ubiquitous Language** | PRD Section 4                                                       | Canonical terms: Advertiser, Tag, Tag File, Tag Code, Tag Name                                       |
| **Grill-Me Q&A Log**    | [docs/grill-me-qa-log.md](./docs/grill-me-qa-log.md)                | Every decision made before coding started — 17 questions resolved                                    |
| **Process Log**         | [docs/process-log.md](./docs/process-log.md)                        | Why each decision was made, blockers hit, key principles                                             |
| **Source Code**         | [backend/src/](./backend/src/) and [frontend/src/](./frontend/src/) | Ground truth on what's actually implemented                                                          |
| **GitHub Issues**       | https://github.com/amitjava/tag_manager_poc/issues                  | Feature history (closed) and backlog (open)                                                          |

---

## 3. Current Platform State

Everything in this section is **built and deployed**.

### Backend (`backend/src/`)

| Module         | File                                   | What it does                                                                   |
| -------------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| Express app    | `app.ts`                               | Sets up CORS, JSON parsing, mounts routes at `/api/advertisers`                |
| Routes         | `routes/advertisers.ts`                | 5 routes: GET list, POST create, GET by id, PUT update, DELETE                 |
| Controller     | `controllers/AdvertiserController.ts`  | Thin HTTP handlers — parses request, calls repo/service, returns response      |
| Repository     | `repositories/AdvertiserRepository.ts` | Async CRUD over SQLite: list, findById, findByName, create, update, delete     |
| TagFileService | `services/TagFileService.ts`           | Writes/deletes `.js` files. Slugifies advertiser name for filename             |
| Database       | `db/database.ts`                       | libSQL client singleton, migrations (`CREATE TABLE IF NOT EXISTS advertisers`) |
| Validation     | `middleware/validation.ts`             | Express middleware — validates required fields on POST and PUT                 |

### Frontend (`frontend/src/`)

| Module      | File                          | What it does                                                            |
| ----------- | ----------------------------- | ----------------------------------------------------------------------- |
| Table page  | `pages/Table/TablePage.tsx`   | Lists all advertisers, Edit/Delete buttons, Create button, empty state  |
| Create page | `pages/Create/CreatePage.tsx` | 3-field form: Advertiser Name, Tag Name, Tag Code (CodeMirror editor)   |
| Edit page   | `pages/Edit/EditPage.tsx`     | Pre-filled form. Advertiser Name is read-only. Tag Name + Code editable |
| API client  | `lib/api.ts`                  | Centralised typed fetch wrapper for all API calls                       |
| Validation  | `lib/validate.ts`             | Shared `validateCreate()`, `validateUpdate()`, `hasErrors()`            |

### Database Schema

```sql
CREATE TABLE advertisers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,       -- raw advertiser name, unique constraint here
  tag_name    TEXT NOT NULL,
  tag_code    TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
)
```

### API Contract

```
GET    /api/advertisers          → 200 [{id, name, tag_name}]
POST   /api/advertisers          → 201 {id, name, tag_name, tag_code} | 400 | 409
GET    /api/advertisers/:id      → 200 {id, name, tag_name, tag_code} | 404
PUT    /api/advertisers/:id      → 200 {id, name, tag_name, tag_code} | 400 | 404
DELETE /api/advertisers/:id      → 200 {success: true} | 404
```

### Tag File Format

```javascript
// Advertiser: <name>
// Tag: <tag_name>
(function() {
  <tag_code — indented 2 spaces>
})();
```

Filename: `<slugified-name>.js` → e.g. "Acme Corp" → `acme-corp.js`

### Test Coverage

| Suite       | File                           | Count  | What it covers                         |
| ----------- | ------------------------------ | ------ | -------------------------------------- |
| Unit        | `AdvertiserRepository.test.ts` | 10     | list, create, findById, update, delete |
| Unit        | `TagFileService.test.ts`       | 8      | slugify, write, delete                 |
| Integration | `advertisers.test.ts`          | 18     | All 5 routes end-to-end via Supertest  |
| **Total**   |                                | **36** |                                        |

---

## 4. Infrastructure

| Concern          | Decision                             | Notes                                   |
| ---------------- | ------------------------------------ | --------------------------------------- |
| Frontend hosting | Vercel (static)                      | https://tagmanagerpoc.vercel.app        |
| Backend hosting  | Vercel (serverless function)         | `/api/index.ts` wraps Express app       |
| Database (prod)  | libSQL file at `/tmp/tag-manager.db` | Ephemeral — resets on Vercel cold start |
| Database (dev)   | libSQL file at `./tag-manager.db`    | Local file, gitignored                  |
| Database (test)  | libSQL in-memory (`:memory:`)        | Isolated per test run                   |
| Tag files (prod) | `/tmp/tags/`                         | Ephemeral on Vercel                     |
| Tag files (dev)  | `./backend/tags/`                    | Local folder, gitignored                |
| CI/CD            | None yet                             | Manual push to Vercel via CLI           |

---

## 5. Architectural Decisions (Settled — Do Not Re-debate)

These were decided during the build and are not open for re-discussion without a new RFC.

| Decision                | What was chosen                                | Why                                                                                        |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Database library        | `@libsql/client`                               | `better-sqlite3` and `node:sqlite` both fail on Node v25. `@libsql/client` is pure JS/WASM |
| One tag per advertiser  | Yes                                            | Resolved in grill-me. Not multiple tags per advertiser                                     |
| Advertiser name on edit | Read-only                                      | Resolved in grill-me. Changing the name would change the filename and break serving        |
| JS file format          | IIFE (`(function(){})()`)                      | Standard sandboxing pattern for tag scripts                                                |
| Auth                    | None                                           | Out of scope for this POC                                                                  |
| Code editor             | CodeMirror                                     | Not a plain textarea — syntax highlighting required                                        |
| Error handling          | Typed HTTP status codes                        | 400 validation, 404 not found, 409 duplicate name                                          |
| App/server split        | `app.ts` exports app, `index.ts` starts server | Required for Supertest integration tests to import app without binding a port              |

---

## 6. Open Backlog

These are **known issues and planned work**. Do not surface these as new discoveries during grill-me.

| Issue | Link                                                                                     | Type             | Summary                                                                                                                                |
| ----- | ---------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| #6    | [Slug collision bug](https://github.com/amitjava/tag_manager_poc/issues/6)               | Bug              | DB uniqueness is on raw `name`; file path uses slug. "Acme Corp" and "Acme-Corp" both produce `acme-corp.js` — silent file overwrite   |
| #7    | [RFC: AdvertiserService](https://github.com/amitjava/tag_manager_poc/issues/7)           | Architecture RFC | Controller directly orchestrates DB + file writes with no atomic boundary. Proposed: extract `AdvertiserService` as coordination layer |
| #8    | [Refactor plan: AdvertiserService](https://github.com/amitjava/tag_manager_poc/issues/8) | Refactor plan    | 6-commit plan to implement the RFC from #7                                                                                             |

**Planned but not yet ticketed:**

- Persistent database for production (Turso / cloud libSQL — `@libsql/client` already supports this, just needs connection URL + auth token)
- CI/CD pipeline (GitHub Actions → auto-deploy to Vercel on merge to main)
- E2E tests (Playwright)

---

## 7. Genuine Unknowns

These are things **not yet decided**. These are the right starting point for a `/grill-me` session on the next feature.

- Multi-user support: if more than one person uses this, do they see each other's advertisers? Is there any concept of ownership or workspace?
- Persistent production database: Turso requires an account and connection credentials — no decision yet on who owns this or how it's provisioned
- Tag file serving: the `.js` files are generated but how do they get from the server to the advertiser's website? (Manual copy? CDN? Direct URL?)
- Tag versioning: should old versions of a tag be kept when a tag is edited?
- Audit log: should there be a record of who changed what and when?
- Soft delete: should deleted advertisers be recoverable?
- CI/CD: no pipeline defined — deploy is currently manual

---

## 8. How to Keep This Document Current

Update this document when:

| Event                                      | What to update                                                   |
| ------------------------------------------ | ---------------------------------------------------------------- |
| A new feature is built                     | Add modules to section 3, update API contract if changed         |
| An architectural decision is made          | Add to section 5                                                 |
| A GitHub issue is opened                   | Add to section 6 (backlog)                                       |
| A GitHub issue is closed                   | Remove from section 6, move decisions to section 5 if applicable |
| Something is decided in a grill-me session | Move it from section 7 (unknowns) to section 5 (decided)         |
| Infrastructure changes                     | Update section 4                                                 |

**Rule:** If a question came up in a grill-me session and was resolved, it belongs in sections 3–5 — not in section 7 again. The document only grows; resolved items do not stay in the unknowns.
