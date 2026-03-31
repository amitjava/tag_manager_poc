# Update Agent Context

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

Translate the output of `/grill-me` (which lives in the current conversation) into an
updated `AGENT_CONTEXT.md`. Rules discovered during grill-me stay as plain English
in the context — they are not written to domain-rules.yaml here. Rule IDs are minted
and rules are written to YAML only at `/write-a-prd` and `/ship-feature` respectively.

## When to run

After `/grill-me` completes, before `/write-a-prd`.

## Step 1 — Identify the domain

From the grill-me conversation, identify which domain this feature belongs to.

Read:

1. `CLAUDE.md` — confirm the domain exists in the domain map
2. `backend/src/domains/<name>/AGENT_CONTEXT.md` — existing content (check what's already there)
3. `backend/src/domains/<name>/domain-rules.yaml` — existing rules

If `AGENT_CONTEXT.md` does not exist yet, run `/scaffold-domain` first, then return here.

## Step 1.5 — Concurrent write check

AGENT_CONTEXT.md is a shared file. Two developers or parallel ticket windows writing to it simultaneously will produce a git conflict.

Before editing, run:

```
git fetch origin && git log origin/main..HEAD --oneline -- backend/src/domains/<name>/AGENT_CONTEXT.md
```

If the remote has commits ahead of local that touch this file: **pull first**, then edit. Do not write over concurrent changes.

**Concurrent PRD rule:** If two PRDs are in-flight for the same domain at the same time:

- Only one PRD's grill-me session should update `## Ticket handoffs` at a time.
- Coordinate by rule: whichever PRD is further along (more tickets merged) has "write priority." The other PRD author pulls before each edit.
- If in doubt: make your edit a focused `+` only (add new content, not rewrite existing lines). Additive edits produce resolvable conflicts.

## Step 2 — Update AGENT_CONTEXT.md

The file has 3 required sections (Purpose, Glossary, Known debt) and optional sections that vary by domain archetype. Update only where grill-me produced new information. Do not blank out sections that are already populated.

**Always update if grill-me touched them:**

- **Purpose** — refine if the session clarified domain scope
- **Glossary** — add every new domain-specific term. Format: `Term: definition`.
- **Known debt** — add anything the session surfaced as deferred or out of scope

**Update if the section exists and grill-me touched it:**

- **Owned tables** — new entities or schema clarifications
- **Architecture patterns** — new patterns confirmed or changed
- **File locations** — new files added
- **Autonomous decisions / Escalation rules** — agent domains: any clarifications from grill-me
- **External APIs / Error mapping** — integration domains: new endpoints or error cases
- **Permission model / Token structure** — cross-cutting domains: new roles or claims

**Add a new section if grill-me surfaced something with no existing home:**
The template is a starting point, not a constraint. If grill-me produced information that doesn't fit any existing section — e.g. a concurrency model, a caching strategy, a compliance requirement — add a new section with a descriptive heading. Use judgment: only add a section if the information is worth loading into every future ticket context.

Use Edit tool — never overwrite the file.

## Step 3 — Confirm to user

State:

> AGENT_CONTEXT.md updated for domain: <name>
> Glossary terms added: <N>
> Business rules noted in context: <N> (plain English — IDs minted during /write-a-prd)
> Next step: /write-a-prd
