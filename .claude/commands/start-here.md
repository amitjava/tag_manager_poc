# Start Here — Knowledge Loop Framework

## What is this framework?

The Knowledge Loop keeps business rules and implementation intent in sync as a codebase grows. It does this through a structured cycle of skills (slash commands) that run in a specific order for each feature. Every business rule that enters the codebase is explicitly declared, conflict-checked, and tracked — not buried in commit messages or developer memory.

## How to check if everything is set up

```bash
cat .claude/skill-config.yaml    # project paths and framework version
ls .claude/commands/             # all available skills
ls backend/src/domains/          # existing domains
cat CLAUDE.md                    # top-level project map
```

If `skill-config.yaml` exists and `CLAUDE.md` has a Domains table: the framework is initialized. If not: run `/initialize-knowledge-loop` first.

## The lifecycle — what runs when

Every feature follows this cycle, in order:

```
1. /grill-me              — structured discovery interview (feature/refactor/bugfix)
2. /update-agent-context  — write grill-me output to AGENT_CONTEXT.md
3. /write-a-prd           — create PRD GitHub issue, mint rule IDs, run conflict check
4. /break-into-tickets    — decompose PRD into focused tickets with dependencies
5. /tdd                   — for each ticket: write tests first, implement, open PR
6. /ship-feature          — after all tickets merged: write rules to YAML, close PRD
```

Optional steps:

- `/define-seam-contract` — run before step 1 if the feature crosses domain boundaries
- `/cross-domain-prd` — use instead of step 3 when the feature spans multiple domains
- `/rollback-prd` — use after ship if the feature must be reversed
- `/brownfield-import` — use once per domain when adopting the framework on an existing codebase
- `/health-check` — validate consistency across all knowledge files (run periodically)

## Skill dependency map

```
grill-me
  └─► update-agent-context
        └─► write-a-prd ──► validate-knowledge (called internally)
              └─► break-into-tickets
                    └─► tdd (one session per ticket)
                          └─► ship-feature ──► validate-knowledge (re-check at ship)
                                └─► (optional) rollback-prd
```

Cross-cutting:

- `define-seam-contract` — before grill-me if new cross-domain boundary
- `cross-domain-prd` — wraps write-a-prd for multi-domain features
- `health-check` — independent, runs on demand
- `brownfield-import` — one-time onboarding per domain

## Where things live

| What                        | Where                                            |
| --------------------------- | ------------------------------------------------ |
| Project map + seam table    | `CLAUDE.md`                                      |
| Domain business rules       | `backend/src/domains/<name>/domain-rules.yaml`   |
| Domain architecture context | `backend/src/domains/<name>/AGENT_CONTEXT.md`    |
| Cross-domain contracts      | `contracts/<provider>-to-<consumer>/CONTRACT.md` |
| Feature discovery logs      | `grill-me-docs/<feature>/grill-me-NN.md`         |
| Session index               | `grill-me-docs/INDEX.md`                         |
| Framework config            | `.claude/skill-config.yaml`                      |
| All skills                  | `.claude/commands/*.md`                          |

## Key concepts in 30 seconds

**domain-rules.yaml** — the source of truth for business rules. Rules are never deleted; they are superseded or retired. Every rule has a unique ID (`RULE-<DOMAIN>-P<issue-number>-<seq>`).

**AGENT_CONTEXT.md** — loaded by every Claude window working in a domain. Contains architecture, glossary, known debt, and in-flight ticket handoffs. Keep it under 500 lines or archive old sections.

**validate-knowledge** — called automatically by write-a-prd and ship-feature. Detects rule overlaps before they enter YAML. A human "yes" is required before any write.

**Ticket = one Claude window = one PR.** Each ticket is scoped to fit in a single TDD session. Dependencies between tickets are explicit.

**ship-feature** runs once per PRD after all tickets merge. It promotes rules from the PRD to YAML, audits AGENT_CONTEXT.md for stale references, and archives in-flight handoffs.

## Common entry points

| Situation                                | Start with                                        |
| ---------------------------------------- | ------------------------------------------------- |
| New feature in an existing domain        | `/grill-me`                                       |
| New feature crossing two domains         | `/define-seam-contract`, then `/cross-domain-prd` |
| Bug fix                                  | `/grill-me` (choose "bug fix" at Step 0)          |
| Refactor                                 | `/grill-me` (choose "refactor" at Step 0)         |
| Adopting this framework on existing code | `/brownfield-import`                              |
| Knowledge files feel out of sync         | `/health-check`                                   |
| A shipped PRD needs to be undone         | `/rollback-prd`                                   |

## Framework version

Check `.claude/skill-config.yaml` → `framework.version`. PRDs written under earlier versions may not have gone through all current gates (e.g. stale conflict re-check at ship was added in v2.0). Run `/health-check` after upgrading framework versions.
