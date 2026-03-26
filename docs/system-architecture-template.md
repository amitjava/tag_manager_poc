# System Architecture Document — Template + Example

> Created once at project start. Updated when a new domain is added or a cross-domain seam is established.
> Read by: architects, tech leads, and agents before any feature work begins.
> Reference: [ai-engineering-process.md](./ai-engineering-process.md) — "Project Start" section.

---

## What This Document Is For

When a project grows beyond a single feature, there is a question every engineer (and every agent) has to answer before building: **"Where does this code go, and what does it touch?"**

Without a map, the answer is guessed. Guesses create coupling. Coupling compounds.

This document answers three questions:

1. What are the domains?
2. What is the folder structure?
3. Where are the cross-domain seams?

---

## Section 1: Domains

A domain is a bounded area of business responsibility. It has its own data, its own language, and ideally its own owner. Features belong to domains. Modules belong to domains. Tests belong to domains.

**How to identify a domain:**

- It has a core entity that it owns (e.g. `Advertiser`, `Campaign`, `Invoice`)
- Other parts of the system reference it by ID, not by reading its internal tables
- You could hand it to a separate team and they could maintain it independently

**Template:**

| Domain | Core entity | What it owns       | What it does NOT own | Owner         |
| ------ | ----------- | ------------------ | -------------------- | ------------- |
| _name_ | _entity_    | _data, operations_ | _explicit boundary_  | _team/person_ |

---

## Section 2: Folder Structure

Use domain-based folders for any project with more than one domain.

**Do NOT use layer-based folders for multi-domain projects.** Layer-based means `controllers/`, `services/`, `repositories/` at the top level. This works for one domain and breaks when you add a second — files from different domains mix in the same folder, domain ownership becomes invisible, and agents cannot tell which team owns a file.

**Domain-based template:**

```
backend/src/
  domains/
    <domain1>/
      <Domain1>Controller.ts
      <Domain1>Repository.ts
      <Domain1>Service.ts         (optional — only if needed)
      routes.ts
      validation.ts
    <domain2>/
      <module2_1>/
        <Module2_1>.ts
      <module2_2>/
        <Module2_2>.ts
      routes.ts
  db/
    database.ts                   ← shared infrastructure (not a domain)
  app.ts
  index.ts
```

**Rule:** Everything about `<domain1>` lives in `domains/<domain1>/`. You never need to enter another domain's folder to understand a `<domain1>` operation.

---

## Section 3: Cross-Domain Seams

When domain A needs data or behaviour from domain B, that is a cross-domain seam.

Seams must be explicit. An explicit seam is one of:

- **HTTP call:** Domain A calls domain B's REST API
- **Interface/contract:** Domain A depends on an interface that domain B implements
- **Event:** Domain A emits an event; domain B subscribes

An implicit seam (domain A imports domain B's repository directly) is coupling. It looks harmless until one team changes the DB schema and breaks the other.

**Template:**

| From domain | To domain  | What it needs                | Contract type            | Notes      |
| ----------- | ---------- | ---------------------------- | ------------------------ | ---------- |
| _domain A_  | _domain B_ | _specific data or operation_ | HTTP / interface / event | _when/why_ |

---

## Section 4: Ubiquitous Language per Domain

Each domain has its own language. A term that means one thing in `advertisers` may mean something different in `campaigns`.

Record per-domain terms here. When a term is shared across domains, record it in the Platform Glossary (separate document) and link here.

**Template:**

| Domain    | Term   | Definition                              |
| --------- | ------ | --------------------------------------- |
| _domain1_ | _term_ | _what it means specifically in domain1_ |

---

---

# Tag Manager POC — System Architecture Example

> This is a filled example of the template above for the Tag Manager POC.
> Domains: `advertisers` (built), `domain2` (stub — future).

---

## Domains

| Domain      | Core entity | What it owns                                             | What it does NOT own                | Owner          |
| ----------- | ----------- | -------------------------------------------------------- | ----------------------------------- | -------------- |
| advertisers | Advertiser  | Advertiser records (DB), tag files (disk), tag code (DB) | Campaigns, billing, user management | Backend team   |
| domain2     | _(TBD)_     | _(TBD — stub domain for architecture demonstration)_     | Advertiser records                  | _(unassigned)_ |

---

## Folder Structure

```
backend/src/
  domains/
    advertisers/                    ← domain 1 (built)
      AdvertiserController.ts       ← Express route handlers
      AdvertiserRepository.ts       ← SQLite read/write
      TagFileService.ts             ← disk operations (write/delete .js files)
      routes.ts                     ← route registration
      validation.ts                 ← request body validation middleware
    domain2/                        ← domain 2 (stub)
      module2_1/
        Module2_1.ts                ← stub: replace when domain2 is built
      module2_2/
        Module2_2.ts                ← stub: replace when domain2 is built
  db/
    database.ts                     ← shared: connection singleton + migrations
  app.ts                            ← Express app (no listen)
  index.ts                          ← server startup
```

---

## Cross-Domain Seams

| From domain | To domain   | What it needs                 | Contract type  | Notes                     |
| ----------- | ----------- | ----------------------------- | -------------- | ------------------------- |
| domain2     | advertisers | Advertiser ID for association | HTTP (planned) | Not yet built — note only |

**Current state:** No active cross-domain seams. The `advertisers` domain is self-contained. `domain2` is a stub that will reference advertiser IDs once built.

---

## Ubiquitous Language

| Domain      | Term       | Definition                                                                              |
| ----------- | ---------- | --------------------------------------------------------------------------------------- |
| advertisers | Advertiser | A company identified by a unique name that owns one tag                                 |
| advertisers | Tag        | A named block of JavaScript code belonging to one Advertiser                            |
| advertisers | Tag File   | The `.js` output artifact written to `./tags/<slug>.js` on disk                         |
| advertisers | Tag Code   | The raw JavaScript string the user writes; stored in DB, written into Tag File          |
| advertisers | Tag Name   | A human-readable label for the Tag; shown in the table, included as comment in Tag File |
| advertisers | Slug       | The filename-safe version of an advertiser name: lowercase, hyphens, no specials        |

---

## Decision Log

| Decision               | What was chosen       | Why                                                        |
| ---------------------- | --------------------- | ---------------------------------------------------------- |
| Folder structure       | Domain-based          | Layer-based breaks when adding a second domain             |
| Database client        | @libsql/client        | better-sqlite3 has no prebuilt binaries for Node v25       |
| Auth                   | None                  | Out of scope for POC                                       |
| One tag per advertiser | Yes                   | Resolved in grill-me — multiple tags deemed out of scope   |
| File storage on Vercel | `/tmp/tags/`          | Vercel serverless functions have write access only to /tmp |
| DB path on Vercel      | `/tmp/tag-manager.db` | Same /tmp constraint; data is ephemeral (demo-only)        |

---

_Last updated: 2026-03-26_
_For process context: [ai-engineering-process.md](./ai-engineering-process.md)_
