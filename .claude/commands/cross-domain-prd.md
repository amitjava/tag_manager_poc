# Cross-Domain PRD

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

Coordinate a feature that spans two or more domains. A cross-domain feature requires grill-me, AGENT_CONTEXT.md updates, validate-knowledge, and tickets in each domain — plus a shared seam contract if none exists.

## When to run

When `/grill-me` surfaces that the feature touches more than one domain (e.g. billing + loyalty, fulfillment + inventory).

## Step 0 — Identify all domains involved

From the grill-me output, list every domain this feature reads from or writes to.

For each domain pair where data crosses a boundary:

- Is there an existing seam contract in `contracts/<provider>-to-<consumer>/CONTRACT.md`?
- If no: the seam must be established with `/define-seam-contract` before writing any cross-domain PRD.

Do not proceed until all required seam contracts exist.

## Step 1 — Run grill-me per domain

The standard `/grill-me` interview covers the feature as a whole. For cross-domain features, you need domain-specific passes too:

For each domain involved:

1. Focus on: what does this domain **own** in this feature? What does it **receive** from other domains?
2. What new business rules apply within this domain's boundary?
3. What does this domain expose to other domains (new or changed seam fields)?

A single grill-me session is fine if the feature is simple (two domains, one direction of data flow). Run separate sessions if domains have independent complex rules.

## Step 2 — Update AGENT_CONTEXT.md for each domain

Run `/update-agent-context` for each domain separately. Each domain's AGENT_CONTEXT.md must reflect:

- Its own rules and decisions
- What it sends/receives at the seam (reference the contract, don't duplicate it)

Do not put cross-domain design in one domain's context and leave the other stale.

## Step 3 — Write one PRD per domain

Cross-domain features need one PRD issue per domain. This is not bureaucracy — it keeps rule IDs, ticket scopes, and ship steps domain-contained:

```
PRD #N  — <feature name> [billing domain]
PRD #N+1 — <feature name> [loyalty domain]
```

Each PRD:

- Has its own "Business Rules Affected" (rules in that domain only)
- Has its own ticket list (code in that domain only)
- Ships independently via `/ship-feature`

**Shared "Problem Statement"** is fine to duplicate across both PRDs (it's the same user problem). **Implementation Decisions and Business Rules must not be shared** — each PRD owns only its domain's decisions.

Run `/write-a-prd` once per domain.

## Step 4 — Sequence the PRDs

Determine which domain ships first. The dependency is usually:

- Provider domain ships first (its code must exist for consumer to call it)
- Consumer domain ships second

Document the sequence in both PRDs:

Provider PRD: "Consumer PRD (#N+1) depends on this PRD shipping first."
Consumer PRD: "Requires PRD #N (provider) shipped before ticket work begins."

## Step 5 — Coordinate ticket dependencies across domains

Tickets within one domain follow normal dependency rules. Cross-domain dependencies:

- Consumer tickets that call provider code cannot start until the provider ticket is merged.
- Mark this explicitly in the consumer ticket: `requires: PRD #N Ticket X merged (cross-domain)`

## Step 6 — Ship in order

Ship provider PRD first (`/ship-feature` on provider PRD).
Then ship consumer PRD (`/ship-feature` on consumer PRD).

At each ship step, run the stale conflict re-check normally — cross-domain ships can still race with unrelated PRDs in the same domain.

## Step 7 — Confirm to user

State:

> Cross-domain feature broken into:
>
> - PRD #N: <feature> [<provider domain>] — ship first
> - PRD #N+1: <feature> [<consumer domain>] — ship second
> - Seam contract: contracts/<provider>-to-<consumer>/CONTRACT.md
>
> Start with PRD #N tickets. Run /break-into-tickets on PRD #N first.
