# TDD

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

Write tests first, make them pass, then ship. One ticket = one TDD session = one PR.

## When to run

For each ticket in the PRD's task list. Load the PRD and AGENT_CONTEXT.md before writing a single line of code.

## Step 0 — Load context

```
gh issue view <issue-number>
```

Read:

1. The PRD issue — identify which ticket you are working on
2. `backend/src/domains/<name>/AGENT_CONTEXT.md`
3. `backend/src/domains/<name>/domain-rules.yaml` — for any rule this ticket implements

Check the ticket's dependency tag. If it says "requires: Ticket N merged", verify that PR is merged before starting.

## Step 1 — Identify what to test

From the ticket description and PRD, list the **behaviors** this ticket must deliver. A behavior is:

- Something a caller can observe via a public interface
- A state change visible through a query/return value
- An error condition the interface surfaces

**Observable behavior rule:** Every test must test what the system **does**, not how it **does it**. Apply this filter to each proposed test:

> "If I swap the implementation for a different one that produces the same outputs, does this test still pass?"
>
> - YES → the test is behavior-based. Write it.
> - NO → the test is testing an implementation detail. Do not write it.

**Anti-patterns to reject outright — do not write these tests:**

- Tests that call private methods directly (even via reflection or test utilities)
- Tests that assert on internal state (e.g. "the cache now contains 3 items")
- Tests that verify a specific method was called (mock-based call verification unrelated to output)
- Tests that assert on log output as the primary assertion
- Tests that break when a variable is renamed but behavior is unchanged

If you find yourself about to write one of these, stop and restate: "What observable outcome am I actually testing?" Write that instead.

## Step 2 — Write the test list

Before writing any test code, write a plain-English list of all the tests you intend to write:

```
Tests for <ticket description>:
1. [BEHAVIOR] Returns X when given Y
2. [BEHAVIOR] Raises ErrorType when condition Z
3. [BEHAVIOR] Applies rule RULE-<DOMAIN>-P<N>-<seq>: <one-line description>
4. [EDGE]     Handles empty input gracefully
...
```

Show this list to the user. Ask: "Any behaviors missing? Any I shouldn't test?" Wait for confirmation before writing test code.

This list is the contract between you and the user before code exists. It prevents scope creep and catches gaps early.

## Step 3 — Write failing tests

Write all tests from the list. Tests must fail before any implementation exists — a test that passes before the code is written is testing nothing.

Read similar test files in the codebase for structural reference (test runner setup, fixture patterns, assertion style). **Do not follow existing patterns uncritically** — if existing tests violate the observable behavior rule (call private methods, assert on internal state), do not replicate those patterns. Follow the observable behavior rule, not the existing pattern. Use existing tests only for mechanical setup, not for what to test or how to assert.

**Test structure:** Arrange → Act → Assert. One assertion per test where possible.

**Business rule tests:** For each business rule this ticket implements, write at least one test that asserts the formula or condition directly:

```
# Rule: RULE-BILLING-P10-1
# plain_english: floor(net_total_cents / 100)
def test_earn_rate_uses_floor_not_round():
    # $1.99 order earns 1 point, not 2
    assert calculate_points(net_total_cents=199) == 1
```

Run tests — confirm they all fail for the right reason (not import errors or syntax errors).

## Step 4 — Implement

Write the minimum code to make the tests pass. No more.

- No speculative features beyond what the tests require
- No error handling for cases the tests don't cover
- No refactoring of surrounding untouched code

If the implementation reveals that a test was testing the wrong thing (implementation detail crept in), go back and fix the test, not the implementation.

## Step 5 — Green bar

Run the full test suite for the domain (not just the new tests). Confirm:

- All new tests pass
- No existing tests regressed

If existing tests broke: investigate whether the implementation changed behavior (bad) or whether the existing tests were implementation-coupled (fix the tests, not the implementation).

## Step 6 — Write handoff note

Before opening the PR, write to `## Ticket handoffs → ### Ticket N` in AGENT_CONTEXT.md:

```markdown
### Ticket N — <description>

Interfaces created: <list any new public interfaces or contracts>
Design decisions: <any significant choices made during implementation>
Assumptions: <anything assumed that the next ticket should know>
```

Use Edit tool. This is read by the next ticket window before it starts.

## Step 7 — Open PR

```
git add <files>
git commit -m "<ticket description> — tests first, implementation second"
gh pr create --title "Ticket N: <description> (PRD #<issue>)" \
  --body "Part of PRD #<issue>. Implements: <bullet list of behaviors from test list>."
```

**CI failure recovery:** After opening the PR, note CI status in the handoff before closing this window:

```markdown
### Ticket <N> — <description>

...
CI status: green ✓ / pending ⏳ / red ✗ [failing: <test names if known>]
```

If CI is red: diagnose and fix before closing the window if possible. If the window is near context limit, write the failing test names in the handoff so the next window can jump straight to the fix without re-running CI.

Mark the checkbox in the PRD issue:

```bash
# Replace <N> with the actual ticket number (e.g. 3)
TICKET_NUM=<N>
TMPFILE=$(mktemp /tmp/prd-body-XXXXXX.md)
trap "rm -f $TMPFILE" EXIT
gh issue view <issue-number> --json body -q .body > "$TMPFILE"
sed -i "s/- \[ \] Ticket ${TICKET_NUM}:/- [x] Ticket ${TICKET_NUM}:/" "$TMPFILE"
gh issue edit <issue-number> --body-file "$TMPFILE"
# Verify: gh issue view <issue-number> | grep "Ticket ${TICKET_NUM}"
```
