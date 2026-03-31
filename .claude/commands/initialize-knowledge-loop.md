# Initialize Knowledge Loop

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

Run once at the very start of a new project, before any domain work or scaffold-domain calls.

## Step 1 — Gather project details

Ask the user these four questions before doing anything else:

1. **Project name** — what is this project called?
2. **One-line purpose** — what does this system do? (One sentence.)
3. **Team size** — how many people will be working on this?
4. **Tech stack** — what runtime and database will be used?

Collect all four answers before proceeding.

## Step 2 — Create CLAUDE.md at project root

Write `CLAUDE.md` with the following content:

```markdown
# <Project Name>

<One-line purpose>

**Stack:** <runtime> / <database>
**Team:** <size>

---

## Context loading

When starting any feature ticket:

1. Read the GitHub issue (`gh issue view <N>`)
2. Identify the domain from the issue
3. Read `backend/src/domains/<name>/AGENT_CONTEXT.md`
4. Read `backend/src/domains/<name>/domain-rules.yaml`
5. Read `contracts/<provider>-to-<consumer>/CONTRACT.md` if the ticket touches a cross-domain seam

---

## Domains

| Domain                                     | Path | Purpose | Seams |
| ------------------------------------------ | ---- | ------- | ----- |
| _populated by /design-system-architecture_ |      |         |       |

---

## Cross-domain seams

| Provider                                   | Consumer | Capability | Status |
| ------------------------------------------ | -------- | ---------- | ------ |
| _populated by /design-system-architecture_ |          |            |        |

---

## Conventions

- Rule IDs: `RULE-<DOMAIN>-P<N>-<seq>` (PRD issue number + sequence, e.g. RULE-CATALOG-P5-1) — minted by /write-a-prd after gh issue create
- Contract folder: `contracts/<provider>-to-<consumer>/CONTRACT.md`
- Domain files: `backend/src/domains/<name>/` (AGENT_CONTEXT.md, domain-rules.yaml, openapi.yaml)
```

## Step 3 — Initial git commit

```
git add CLAUDE.md
git commit -m "Init: knowledge-loop scaffold"
```

## Step 4 — Confirm next steps

Tell the user:

> Knowledge-loop is ready. Next steps:
>
> 1. Run **/design-system-architecture** to define your domains and cross-domain seams.
> 2. Run **/scaffold-domain** for each domain.
> 3. Run **/define-seam-contract** for any cross-domain seams before the first feature that crosses a boundary.
> 4. Run **/setup-pre-commit**, **/git-guardrails-claude-code** to install project guardrails.
