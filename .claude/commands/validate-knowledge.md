# Validate Knowledge

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

A quality gate that detects overlapping business rules using cheap LLM text comparison against existing rule text — not key lookup.

This skill **always gates** writes to `domain-rules.yaml`. It **optionally gates** writes to `AGENT_CONTEXT.md` — only when the incoming content contradicts or overlaps with existing rules in `domain-rules.yaml`. It does **not** gate routine context updates, formatting changes, stub creation, or any write that adds new content without touching business rules.

## When to run

Called by other skills before they write to knowledge docs:

- `/write-a-prd` → always, immediately after the PRD issue is created, for every rule with `action: add` or `action: supersede` in the "Business Rules Affected" section
- `/ship-feature` → only when superseding an existing rule; skip for net-new rules (already cleared at PRD time)

Can also be invoked directly: "validate-knowledge before updating billing rules"

## Input required

1. **Incoming rule text** — plain_english + formula extracted from the PRD being processed
2. **Domain name** — which domain's rules to scan
3. **Target file path** — which knowledge doc is being updated

## Process

### Step 1 — Extract incoming rule from PRD

Read the PRD and extract:

- `plain_english` — verbose description of what the rule governs (see YAML spec below)
- `formula` — the calculation or condition if applicable
- `why` — business rationale

### Step 2 — Cheap LLM text scan against domain-rules.yaml

Read the full `domain-rules.yaml` for this domain. Use the cheapest available model (Haiku or equivalent) for this scan — this is a text comparison task, not a reasoning task. For each **active** rule in the file, ask:

> "Do these two rules govern the same business decision, even partially? Rule A: [incoming plain_english + formula]. Rule B: [existing plain_english + formula]. Answer YES or NO with one sentence of reasoning."

Superseded and retired rules are skipped — they are history.

This is the primary overlap detection mechanism. No conflict_key, no entity/field/operation matching.

**Prompt discipline:** The question must be "same business decision" not "similar topic". Two rules about loyalty points that cover non-overlapping conditions (VIP vs non-VIP) are NOT the same decision. The LLM reasoning sentence is surfaced to the human in all non-CLEAN outcomes.

### Step 3 — If no overlap found → CLEAN

No existing rule covers the same business decision as the incoming rule.
→ Auto-write. No PRD fetch. No human gate.

### Step 4 — If overlap found → check if intent is clear from incoming PRD alone

You already have the incoming PRD open (you extracted the rule text from it in Step 1).
Before fetching anything else, read its full text and ask:

> Does this PRD state what it intends to do with the overlapping rule?
> Examples of clear intent: "replaces our current earn rate", "adds a weekend modifier on top of the existing rule", "this feature is being removed", "this is a VIP-only variant".

If intent is clear → **DECLARED-WRITE** (see Step 5). No second fetch needed.

If intent is not stated or ambiguous → fetch the historical PRD:

```
📥 fetch historical PRD  gh issue view <introduced_prd of overlapping rule>
```

Read both PRDs. Determine intent.

### Step 5 — Classify

**DECLARED-WRITE** — the incoming PRD text clearly states the relationship to the overlapping rule (replaces it, layers on it, scopes it, retires it). No rule IDs needed — plain English intent is sufficient.
→ Auto-execute. No second fetch. PM already made the decision when writing the PRD.

**INFERRED-WRITE** — no explicit declaration, but reading both PRDs makes intent unambiguous (one clearly replaces or layers on the other).
→ Auto-write with reasoning shown. No human gate.

**SCOPE-INFERRED** — overlap exists but incoming rule has a narrower scope (e.g. VIP only) that forces annotation on an existing rule the current PRD does not own.
→ BLOCKED. Human must authorise modification to a rule they did not author.

**CONFLICT-UNRESOLVABLE** — both PRDs assert contradictory product intent with no clear resolution path.
→ BLOCKED. Human makes product decision. No write until resolved.

### Step 6 — Chain check (for all auto paths)

Before writing any DECLARED-WRITE or INFERRED-WRITE, scan all domain-rules.yaml files for rules with `depends_on` pointing to the rule being changed.

If a rule has a `depends_on` reference pointing to a rule that no longer exists in any domain-rules.yaml, flag it separately as **DATA-INTEGRITY** and block the write until the `depends_on` is corrected. Do not proceed with the write until the broken reference is fixed.

If any found (and the referenced rule does exist) → escalate to **CHAIN-IMPACT**:

```
⚠ CHAIN-IMPACT
  Rule 1.2.1 depends_on 1.1.2 which is being superseded.
  Human must confirm: does 1.2.1 still compose correctly with incoming rule?
```

### Step 7 — Show diff and wait for approval

For all auto paths (CLEAN, DECLARED-WRITE, INFERRED-WRITE), show exact diff before writing:

```
APPROVED — validate-knowledge-[OUTCOME]

Changes to be written:
  [SUPERSEDE] 1.1.2 → status: superseded, superseded_by: 1.1.3
  [NEW] 1.1.3 — earn points on net total after discount, tier multiplied

Proceed? (yes to write / no to cancel)
```

Wait for explicit "yes" before any write.

For BLOCKED outcomes:

```
BLOCKED — validate-knowledge-[OUTCOME]

Incoming rule: [plain_english]

Overlaps with existing rule 1.1.2:
  [plain_english of existing rule]
  LLM reasoning: [one sentence from Step 2 scan]

Resolution options:
  A) Supersede 1.1.2 (incoming PRD changes this rule)
  B) These are different rules — rename incoming to avoid overlap
  C) Cancel — investigate before proceeding

Choose A, B, or C:
```

Do not proceed until human makes a choice.

## YAML spec — what makes a good plain_english field

The `plain_english` field is the primary matching surface. It must be verbose enough that a cheap LLM can confidently judge overlap. Bad: "1 point per dollar". Good:

```
"Customers earn loyalty points on every completed order. The earning rate is 1 point
per whole dollar of the order total (net of discounts), calculated as
floor(net_total_cents / 100). Fractional dollars do not earn partial points — they
are discarded. This rule applies to all customer tiers (Bronze, Silver, Gold) and
all order types except gift card purchases. It does not apply to cancelled or
refunded orders. The intent is a simple, predictable rate that customers can
calculate mentally."
```

When writing a new rule to YAML, always write plain_english at this level of detail.

## Rules for the skill itself

- Always run this check before any write to domain-rules.yaml
- Run this check before writing to AGENT_CONTEXT.md only when the incoming content contradicts or overlaps with existing rules — not for routine context updates
- Never auto-resolve a conflict — always surface it to the human
- A human "yes" to the APPROVED diff is required before any write
- Use the Edit tool for all writes — never overwrite entire files
- Never delete rules — only change status to superseded or retired
