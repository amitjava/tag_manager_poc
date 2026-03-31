# Design System Architecture

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

Run after `/initialize-knowledge-loop` and before the first `/scaffold-domain` call.

## Step 1 — Read existing context

Read `CLAUDE.md`. Note anything already filled in. Do not ask the user to repeat it.

## Step 2 — Identify bounded contexts

Ask the user:

> "Describe each major area of the system that has its own data and rules. Aim for 2–6 domains. For each one, give it a short name and say what it owns."

Wait for the full list before proceeding. If the user gives fewer than 2 or more than 6 domains, push back and ask them to reconsider the boundaries.

## Step 3 — Interview for each domain

For each domain the user named, collect:

1. **Name** — short identifier, no spaces (e.g. `billing`, `identity`, `catalog`)
2. **Purpose** — one sentence: what is this domain responsible for?
3. **Data it owns** — what entities or tables live exclusively in this domain
4. **Owner** — which team or person is accountable

One round of questions per domain — keep it quick.

## Step 4 — Identify cross-domain seams

Ask the user:

> "Which domains will need to share data or capabilities with each other? For each pair, what does one side need from the other?"

For each dependency capture:

- **Provider** — the domain supplying the capability
- **Consumer** — the domain that needs it
- **Capability** — one-line description (e.g. "user identity lookup", "payment confirmation event")

## Step 5 — Update CLAUDE.md

Use Edit tool to replace the placeholder rows in the Domains table and Cross-domain seams table with the collected data.

Domains table format:

```
| <name> | backend/src/domains/<name>/ | <purpose> | <seam names or —> |
```

Seams table format:

```
| <provider> | <consumer> | <capability> | Not yet established |
```

## Step 6 — Confirm next steps

Tell the user:

> Architecture recorded in CLAUDE.md. Next steps:
>
> 1. Run **/scaffold-domain** for each domain listed.
> 2. Run **/define-seam-contract** for each cross-domain seam before building any feature that crosses a boundary.
