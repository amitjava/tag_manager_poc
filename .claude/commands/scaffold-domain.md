# Scaffold Domain

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

Create the knowledge skeleton for one or more domains so that the FEATURE cycle
skills have the correct files and structure to populate.

## When to run

- At project start, for all domains defined in `CLAUDE.md`
- When a new domain is added mid-project

Skip any domain that already has `backend/src/domains/<name>/AGENT_CONTEXT.md`.

## Step 1 — Read CLAUDE.md

Read `CLAUDE.md`. Confirm which domains need scaffolding from the Domains table.

If `CLAUDE.md` does not exist yet: create it using the template from `/initialize-knowledge-loop`, then continue.

## Step 2 — Identify domain archetype

For each domain, ask the user:

> What type is **<name>**?
>
> 1. **backend** — owns data, exposes API, contains business logic (e.g. billing, catalog, loyalty)
> 2. **agent** — AI agent that makes autonomous decisions and escalates to humans
> 3. **integration** — thin wrapper around an external API or service (e.g. payments, email, storage)
> 4. **cross-cutting** — shared infrastructure consumed by all domains (e.g. identity, auth, feature flags)

If it is obvious from the domain name or CLAUDE.md description, infer the archetype without asking.

## Step 3 — Create AGENT_CONTEXT.md using the matching template

Every template has the same **3 required sections** at the top. The rest are optional stubs — include the ones relevant to the archetype, skip the rest. `/update-agent-context` may add further sections later as grill-me surfaces new information.

---

### Archetype: backend

```markdown
# <Domain Name> — Agent Context

## Purpose

_Fill after /grill-me._

## Glossary

_Fill after /grill-me — every domain-specific term with a one-line definition._

## Known debt

_None._

<!-- Optional sections — fill as code is written, remove if not applicable -->

## Owned tables

_List tables this domain owns._

## Architecture patterns

_Key patterns: module boundaries, error handling conventions, money rules, etc._

## File locations

_List entry files for this domain once the structure is known._
```

---

### Archetype: agent

```markdown
# <Domain Name> — Agent Context

## Purpose

_Fill after /grill-me._

## Glossary

_Fill after /grill-me._

## Known debt

_None._

<!-- Agent-specific sections -->

## Autonomous decisions

_What this agent decides without human input. Be explicit — if it's not listed here, escalate._

## Escalation rules

_Conditions that trigger handoff to a human. Include blast-radius threshold (e.g. order value > $X)._

## Tools available

_APIs, queues, databases this agent can call. Include read vs write permissions._

## Failure modes

_What happens if this agent gets it wrong. Who notices, who fixes it, how fast._

## Architecture patterns

_Prompt structure, tool-call patterns, retry policy._
```

---

### Archetype: integration

```markdown
# <Domain Name> — Agent Context

## Purpose

_Fill after /grill-me._

## Glossary

_Fill after /grill-me._

## Known debt

_None._

<!-- Integration-specific sections -->

## External APIs

_Provider name, base URL pattern, SDK or raw HTTP, relevant endpoints._

## Rate limits & retry policy

_Limits, backoff strategy, idempotency keys if applicable._

## Auth & credentials

_How credentials are stored and rotated. Never put actual secrets here._

## Error mapping

_How provider error codes map to domain errors surfaced to consumers._

## Architecture patterns

_Adapter pattern, circuit breaker, timeout defaults._
```

---

### Archetype: cross-cutting

```markdown
# <Domain Name> — Agent Context

## Purpose

_Fill after /grill-me._

## Glossary

_Fill after /grill-me._

## Known debt

_None._

<!-- Cross-cutting-specific sections -->

## Permission model

_Roles, scopes, and what each can do. Canonical source of truth for auth decisions._

## Token / claims structure

_JWT fields (or equivalent) passed to all consumers. Define every claim._

## Consumers

_Which domains depend on this one. What they read and how._

## Shared contracts

_Link to CONTRACT.md files where this domain is provider._

## Architecture patterns

_Session lifecycle, token refresh, middleware integration pattern._
```

---

## Step 4 — Create domain-rules.yaml and openapi.yaml

### `backend/src/domains/<name>/domain-rules.yaml`

```yaml
# Business rules registry for <domain name> domain.
# Rules are never deleted — status changes from active → superseded.
# Rule ID format: RULE-<DOMAIN>-P<N>-<seq> (PRD issue number + sequence, e.g. RULE-CATALOG-P5-1)
# IDs minted by /write-a-prd after gh issue create — never assigned manually
rules: []
```

### `backend/src/domains/<name>/openapi.yaml`

```yaml
openapi: '3.0.0'
info:
  title: <Domain Name> API
  version: '0.0.0'
  description: 'Stub — updated as endpoints are built during TDD'
paths: {}
components:
  schemas: {}
```

For **agent** and **integration** archetypes: openapi.yaml may not apply. Create it as a stub anyway — skip populating it if the domain has no HTTP API.

## Step 5 — Update CLAUDE.md domain map

For each new domain scaffolded, use Edit tool to fill in the domain's row in `CLAUDE.md`:

```
| <name> | backend/src/domains/<name>/ | <purpose> | <archetype> |
```

## Step 6 — Confirm to user

List every file created and the archetype chosen for each domain. State:

> Domain scaffold complete for: [list of domains].
> Next step: FEATURE cycle — run /grill-me → /update-agent-context → /write-a-prd → /break-into-tickets.
