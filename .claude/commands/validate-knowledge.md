# Validate Knowledge

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

A quality gate that detects overlapping business rules using cheap LLM text comparison against existing rule text — not key lookup.

This skill **always gates** writes to `domain-rules.yaml`. It **optionally gates** writes to `AGENT_CONTEXT.md` — only when the incoming content contradicts or overlaps with existing rules in `domain-rules.yaml`. It does **not** gate routine context updates, formatting changes, stub creation, or any write that adds new content without touching business rules.

## When to run

Called by other skills before they write to knowledge docs:

- `/write-a-prd` → always, immediately after the PRD issue is created, for every rule with `action: add` or `action: supersede` in the "Business Rules Affected" section
- `/ship-feature` → for every rule with `action: add` (stale conflict re-check — other PRDs may have shipped between PRD creation and now) and every rule with `action: supersede` (chain-impact check)

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

### Step 1.5 — Enforce plain_english minimum length

Count the words in the extracted `plain_english`. Apply:

| Word count  | Action                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| < 50 words  | **HALT.** Return to the calling skill (write-a-prd or ship-feature) with: `BLOCKED — plain_english too short (<N> words). Minimum is 80 words. Ask the user to expand the description to cover: what the rule governs, which entities/conditions it applies to, which cases are excluded, and the business intent. Re-run validate-knowledge once expanded.` Do not proceed until the description meets the threshold. |
| 50–79 words | **WARN.** Proceed, but surface: `⚠ plain_english is <N> words — below the recommended 80. Overlap detection may be less reliable. Consider expanding before the rule enters YAML.`                                                                                                                                                                                                                                     |
| ≥ 80 words  | Proceed silently.                                                                                                                                                                                                                                                                                                                                                                                                      |

### Step 2 — Cheap LLM text scan against domain-rules.yaml

**Scan cost check:** Count active rules in domain-rules.yaml before scanning. If the count exceeds `max_rules_before_warn` in `skill-config.yaml` (default: 100 if not set), warn:

```
⚠ SCAN COST: This domain has <N> active rules. Scan will make ~<N> LLM comparisons.
Proceed? (yes / no to cancel)
```

This prevents silent cost accumulation on mature domains.

Read the full `domain-rules.yaml` for this domain. Use the cheapest available model (Haiku or equivalent) for the initial scan — this is a text comparison task. For each **active** rule in the file, ask:

> "Do these two rules govern the same business decision, even partially? Rule A: [incoming plain_english + formula]. Rule B: [existing plain_english + formula]. Answer YES or NO with one sentence of reasoning."

Superseded and retired rules are skipped — they are history.

This is the primary overlap detection mechanism. No conflict_key, no entity/field/operation matching.

**Uncertainty escalation:** If the cheap model's YES/NO reasoning contains hedging language ("possibly", "might", "could be", "unclear", "hard to say") — escalate that specific comparison to a more capable model (Sonnet or equivalent) before classifying. Cost of one escalated call is far lower than cost of a wrong YAML write.

**Cross-domain scan:** After scanning the target domain, run the same comparison against active rules in **all other domains**. Cross-domain overlap (the same business decision encoded in two domain YAMLs) is an architectural violation — it means business logic is duplicated or contradicted across boundaries.

Cross-domain overlap → treat as **CONFLICT-UNRESOLVABLE**: flag which domains both govern the same decision, ask the human to decide which domain owns it, and remove or explicitly scope the other.

**Prompt discipline:** The question must be "same business decision" not "similar topic". Two rules about loyalty points that cover non-overlapping conditions (VIP vs non-VIP) are NOT the same decision. The LLM reasoning sentence is surfaced to the human in all non-CLEAN outcomes.

### Step 3 — If no overlap found → CLEAN

No active rule covers the same business decision as the incoming rule.

**Secondary check — retired rule resurrection:** After confirming CLEAN against active rules, run one additional scan against `status: retired` rules only:

> "Does the incoming rule re-introduce a concept that was deliberately retired? Rule A: [incoming]. Rule B: [retired rule]. Answer YES or NO."

If YES:

```
⚠ RETIRED-CONCEPT
  Incoming rule may re-introduce concept from RULE-<ID> (retired in PRD #N).
  Retired reason: <retired_reason field if present>
  Confirm this retirement reversal is intentional before proceeding.
  (yes to continue / no to cancel)
```

Wait for human confirmation. If no retired rule overlaps: proceed to auto-write with no further gate.

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

**DECLARED-WRITE** — the incoming PRD text explicitly names the rule ID being changed (e.g. "supersedes RULE-BILLING-P7-1", "layers on RULE-LOYALTY-P4-2", "retires RULE-BILLING-P3-1"). The relationship is declared with a specific rule reference, not just prose intent.

**Important:** Plain English alone is not sufficient for DECLARED-WRITE. "Replaces our current earn rate" without citing a rule ID is INFERRED-WRITE, not DECLARED-WRITE — the overlap was inferred, not declared. The PRD author must have named the specific rule ID.

→ Show diff and wait for human "yes" (Step 7). No second PRD fetch needed. The PM named the rule they intended to change.

**INFERRED-WRITE** — no explicit declaration, but reading both PRDs makes intent unambiguous (one clearly replaces or layers on the other).
→ BLOCKED for human confirmation. Show the diff and reasoning — do not auto-write. LLM inference is not deterministic; a plausible-sounding but wrong inference would silently corrupt the YAML. The human confirms intent before any write.

**SCOPE-INFERRED** — overlap exists but incoming rule has a narrower scope (e.g. VIP only) that forces annotation on an existing rule the current PRD does not own.
→ BLOCKED. Human must authorise modification to a rule they did not author.

**CONFLICT-UNRESOLVABLE** — both PRDs assert contradictory product intent with no clear resolution path.
→ BLOCKED. Human makes product decision. No write until resolved.

### Step 6 — Chain check (for all auto paths)

Before writing any DECLARED-WRITE or INFERRED-WRITE, scan all domain-rules.yaml files for rules with `depends_on` pointing to the rule being changed.

If a rule has a `depends_on` reference pointing to a rule that no longer exists in any domain-rules.yaml, flag it separately as **DATA-INTEGRITY** and block the write until the `depends_on` is corrected. Do not proceed with the write until the broken reference is fixed.

**Circular dependency check:** Before writing, verify no cycle exists. A cycle is `RULE-A depends_on RULE-B depends_on RULE-A`. Walk the full `depends_on` chain for the incoming rule. If you reach the incoming rule's own ID, HALT:

```
BLOCKED — DATA-INTEGRITY: circular depends_on detected.
Chain: RULE-A → RULE-B → RULE-A
Fix the depends_on before writing.
```

**Supersede chain depth warning:** If the supersede chain for the rule being changed has depth ≥ 4 (e.g. A→B→C→D→incoming), emit a warning:

```
⚠ CHAIN-DEPTH: this rule has been superseded 4+ times.
Consider whether the concept should be split into distinct rules
rather than continuing to extend a single lineage.
```

This is advisory — does not block the write.

If any found (and the referenced rule does exist) → escalate to **CHAIN-IMPACT**:

```
⚠ CHAIN-IMPACT
  Rule 1.2.1 depends_on 1.1.2 which is being superseded.
  Human must confirm: does 1.2.1 still compose correctly with incoming rule?
```

### Step 7 — Show diff and wait for approval

For all auto paths (CLEAN, DECLARED-WRITE), show exact diff before writing:

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

### Optional: review_by field

Rules can declare a review date — useful for time-sensitive business rules (promotional rates, regulatory requirements, seasonal logic):

```yaml
review_by: '2026-12-31' # ISO date — re-validate this rule before this date
review_reason: 'Promotional rate expires; confirm rule still reflects product intent'
```

This field is advisory. No automated enforcement — it is a signal for the team's periodic health check. When writing a rule that is known to be time-sensitive, always populate `review_by`.

## Edge cases not covered by the 6 outcomes

The 6 outcomes (CLEAN, DECLARED-WRITE, INFERRED-WRITE, SCOPE-INFERRED, CHAIN-IMPACT, CONFLICT-UNRESOLVABLE) cover the common cases. Real codebases produce edges that don't fit cleanly:

**Partial overlap — neither fully supersedes the other:**

> "Rule A covers orders under $100. Incoming rule governs orders over $50. There's a $50–$100 band where both fire."
> → Treat as SCOPE-INFERRED. The incoming rule needs an explicit boundary condition before it can be written. BLOCK and ask the human to add a `when:` clause that makes the boundary precise.

**Cross-cutting policy violation:**

> "Rule is domain-correct but violates a cross-cutting policy (e.g. billing rule that contradicts a compliance requirement in a separate policy doc)."
> → Treat as CONFLICT-UNRESOLVABLE. Surface the cross-cutting conflict explicitly: "This rule is valid in the billing domain but may conflict with [policy]. Human must confirm it's approved."

**Correct now, planned future conflict:**

> "Rule is clean today but would conflict with a known upcoming PRD that isn't written yet."
> → CLEAN — write it. The future conflict will be caught when the future PRD runs validate-knowledge. Do not block on hypothetical future state; that is the job of the next PRD's validate-knowledge run.

**Rule that layers on two existing rules simultaneously:**
→ Treat as two separate SCOPE-INFERRED checks — one for each parent rule. Both must pass before writing.

When in doubt about which outcome applies: use CONFLICT-UNRESOLVABLE and surface your reasoning. It is always better to block and ask than to auto-write ambiguous state.

## Batch supersede mode

A major overhaul may supersede 5–10 rules simultaneously. Running N independent validate-knowledge passes raises N independent CHAIN-IMPACT gates — each judged against the old state — even though they are all part of one intentional product decision.

**When to use batch mode:** When the PRD explicitly states it is replacing a set of rules as a coordinated overhaul (e.g. "restructure the entire earn rate model").

**How batch mode works:**

1. Collect all incoming rules for the overhaul into one set.
2. Run the Step 2 text scan across all of them together against the existing active rules.
3. Show one consolidated diff:

   ```
   BATCH SUPERSEDE — validate-knowledge-BATCH

   Overhaul replaces: RULE-A, RULE-B, RULE-C, RULE-D
   New rules: RULE-X, RULE-Y, RULE-Z

   Internal consistency check: do the incoming rules contradict each other?
   [YES/NO with reasoning]

   Chain-impact: rules with depends_on pointing to any of the superseded set:
   [list or "none"]

   Proceed with full batch? (yes to write all / no to cancel)
   ```

4. One human confirmation writes the entire batch.
5. Check internal consistency within the incoming set (do the new rules conflict with each other?) — flag before showing the diff.

**Auto-detection:** If the calling skill is processing a PRD that contains ≥ 3 rules with `action: supersede`, automatically prompt before running individual passes:

```
⚠ BATCH DETECTED: This PRD supersedes <N> rules. This looks like a coordinated overhaul.
Run in batch mode? (yes = single consolidated gate / no = N individual passes)
```

Wait for the human's answer. Default to individual passes if no response.

## Rules for the skill itself

- Always run this check before any write to domain-rules.yaml
- Run this check before writing to AGENT_CONTEXT.md only when the incoming content contradicts or overlaps with existing rules — not for routine context updates
- Never auto-resolve a conflict — always surface it to the human
- A human "yes" to the APPROVED diff is required before any write
- Use the Edit tool for all writes — never overwrite entire files
- Never delete rules — only change status to superseded or retired
