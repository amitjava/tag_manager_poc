# Tag Manager POC — Resource Directory

All links, tools, and documents related to the Tag Manager POC and the AI engineering process built around it.

---

## Live Demo

| Resource     | Link                             | What it is                                                                                                   |
| ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Live App** | https://tagmanagerpoc.vercel.app | The deployed Tag Manager. Create advertisers, write JS tags in a syntax-highlighted editor, edit and delete. |

> Note: Data is ephemeral on the free tier — resets after ~5 min of inactivity. For the demo, just create a few records and show while the session is warm.

---

## GitHub

| Resource         | Link                                               | What it is                                                                                   |
| ---------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Repository**   | https://github.com/amitjava/tag_manager_poc        | Full source code — React frontend, Express backend, SQLite, 36 tests across 3 test suites.   |
| **Issues Board** | https://github.com/amitjava/tag_manager_poc/issues | All 8 issues: 5 feature tickets (closed), 1 bug triage, 1 architecture RFC, 1 refactor plan. |
| **Kanban Board** | https://github.com/users/amitjava/projects/1       | GitHub Projects board. Issues #1–5 in Done, #6–8 in Todo (bug, RFC, refactor).               |

### GitHub Issues

| #                                                          | Title                                                                     | Type             | Status    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------- | --------- |
| [#1](https://github.com/amitjava/tag_manager_poc/issues/1) | [TM-1] Foundation — DB schema, GET /api/advertisers, table UI             | Feature          | ✅ Closed |
| [#2](https://github.com/amitjava/tag_manager_poc/issues/2) | [TM-2] Create — POST /api/advertisers, TagFileService, create form        | Feature          | ✅ Closed |
| [#3](https://github.com/amitjava/tag_manager_poc/issues/3) | [TM-3] Edit — GET+PUT /api/advertisers/:id, edit form                     | Feature          | ✅ Closed |
| [#4](https://github.com/amitjava/tag_manager_poc/issues/4) | [TM-4] Delete — DELETE /api/advertisers/:id, delete button                | Feature          | ✅ Closed |
| [#5](https://github.com/amitjava/tag_manager_poc/issues/5) | [TM-5] Validation — uniqueness, required fields, UI error messages        | Feature          | ✅ Closed |
| [#6](https://github.com/amitjava/tag_manager_poc/issues/6) | Bug: slug collision — two advertisers can overwrite each other's tag file | Bug triage       | 🔴 Open   |
| [#7](https://github.com/amitjava/tag_manager_poc/issues/7) | [RFC] Introduce AdvertiserService to encapsulate DB+file coordination     | Architecture RFC | 🔴 Open   |
| [#8](https://github.com/amitjava/tag_manager_poc/issues/8) | [Refactor] Extract AdvertiserService — decouple controller from DB+file   | Refactor plan    | 🔴 Open   |

> Issues #1–5 were created before coding started (one per tracer bullet slice) and closed automatically when each branch was merged via `Closes #N` in the commit message.

---

## Process Documents

| Document                         | Link                                                                           | What it is                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AI Engineering Process**       | [docs/ai-engineering-process.md](./docs/ai-engineering-process.md)             | The main process guide. Full workflow from Idea → PRD → Planning → Execution → QA. Includes PRD template (12 sections), TDD mechanics, domain-based architecture, and key principles. Written for mid-sized engineering teams. |
| **Platform Context Proposal**    | [docs/platform-context-proposal.md](./docs/platform-context-proposal.md)       | Proposal for maintaining a `PLATFORM_CONTEXT.md` in every project. The 8-section structure (includes domain map), flow, and maintenance rules. Referenced as Phase 0 in the process guide.                                     |
| **System Architecture Template** | [docs/system-architecture-template.md](./docs/system-architecture-template.md) | Template for the System Architecture Document (done once at project start). Includes domains, folder structure convention, cross-domain seams, and per-domain language. Filled example uses the tag manager build.             |
| **PRD Example**                  | [docs/tag-manager-prd.md](./docs/tag-manager-prd.md)                           | The actual PRD written for this project. A working example of the 12-section template, including domain declaration in Section 7.                                                                                              |
| **Implementation Plan**          | [docs/plans/tag-manager.md](./docs/plans/tag-manager.md)                       | The 5-phase tracer bullet plan with architectural decisions (including domain-based folder structure) and acceptance criteria per phase.                                                                                       |
| **Grill-Me Q&A Log**             | [docs/grill-me-qa-log.md](./docs/grill-me-qa-log.md)                           | Full verbatim Q&A from the requirements session — 17 questions across 4 rounds. Shows what discovery looks like before a PRD is written.                                                                                       |
| **Skills Blueprint**             | [docs/skill-blueprint.md](./docs/skill-blueprint.md)                           | Quick-reference map of all Claude Code skills to all 8 development phases (Phase 0 through Phase 7 + Maintenance).                                                                                                             |
| **Process Log**                  | [docs/process-log.md](./docs/process-log.md)                                   | Step-by-step diary of every decision made during the build — 13 steps, blockers hit, key principles learned, and a "what was missed" audit at the end.                                                                         |

---

## Source Tools

| Resource               | Link                                 | What it is                                                                             |
| ---------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| **Claude Code Skills** | https://github.com/mattpocock/skills | The 12 skills used in this build. Clone and copy into `~/.claude/skills/` to use them. |
| **Claude Code**        | https://claude.ai/code               | The AI coding assistant used for the entire build.                                     |

---

## Where to Start

| Goal                          | Start here                                                         |
| ----------------------------- | ------------------------------------------------------------------ |
| See the app running           | https://tagmanagerpoc.vercel.app                                   |
| Understand the process        | [docs/ai-engineering-process.md](./docs/ai-engineering-process.md) |
| See a real PRD example        | [docs/tag-manager-prd.md](./docs/tag-manager-prd.md)               |
| See what discovery looks like | [docs/grill-me-qa-log.md](./docs/grill-me-qa-log.md)               |
| Read the code                 | https://github.com/amitjava/tag_manager_poc                        |
