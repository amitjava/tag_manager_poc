# Session Refactor Summary

Changes made across this session to the knowledge loop framework (`knowledge-loop.html` + `skill-content.js`).

---

## 1. PRD must be manually promoted from Draft → Submitted

**Issue:** There was no explicit gate between a PRD being written and tickets starting. An agent could start building before the human had reviewed and approved the PRD.

**Fix:** Added a "Promote PRD: Draft → Submitted" button at the bottom of the FEATURE phase. Tickets cannot begin until the human manually clicks it.

**What it means:** The PRD is locked at submission — no further edits without a new PRD. The human owns the promotion decision. Claude never promotes automatically.

---

## 2. Upload documents during grill-me

**Issue:** Users often had background docs (existing specs, legacy system docs, competitor analysis) that grill-me wasn't prompted to read, so it would ask questions the docs already answered.

**Fix:** Added a "Before starting" step to `/grill-me`: agent checks if any documents were uploaded at the start of the conversation and reads them before beginning the interview.

**What it means:** Grill-me now treats uploaded docs as pre-loaded context. The 5-branch interview focuses on gaps and ambiguities in those docs rather than re-asking what's already written.

---

## 3. Save grill-me results in a separate document

**Issue:** Grill-me output lived only in the conversation. Future sessions, humans, or Claude couldn't search past grill-me sessions for prior decisions or repeated questions.

**Fix:** Added a "Save grill-me log" step as the final step of `/grill-me`. The log is written to `grill-me-docs/<prd-brief-name>/grill-me-NN.md`. Append-only — never overwritten.

**What it means:** Every grill-me session is permanently searchable. If the same question comes up in a later PRD, both humans and Claude can grep the logs. If grill-me loops (PRD changes, re-run), the log is appended with the new session number, so the decision history is complete.

---

## 4. Supersede vs scope branch — when a general rule becomes partially specific

**Issue:** When a new feature introduced a rule that only applied to a subset (e.g., VIP customers), it was unclear whether that supersedes the original general rule or just branches from it.

**Resolution:** Three distinct outcomes, now modelled explicitly:

- **Composition** — new rule adds a modifier on top; original formula unchanged for everyone. New rule gets `composes_with`. Original untouched.
- **SCOPE-INFERRED** — new scoped rule introduced; original formula still valid for the remaining segment. Original gets a `scope` annotation + `modified_prd`. New scoped rule added as active.
- **Supersede split** — new scoped rules introduced such that the original formula no longer applies to any segment. Original marked superseded. Two new scoped rules written as active.

**What it means:** "Supersede" is not the only path when a general rule becomes partially specific. The framework models the full shape of the change rather than forcing everything into supersede.

---

## 5. Test cases when the change is not a plain supersede

**Issue:** For scope splits and compositions, it was unclear which existing tests were still valid, which needed updating, and who was responsible.

**Resolution:** Handled at the `/tdd` level — each ticket identifies from its acceptance criteria which behaviors to test. The rule action (`supersede` / `SCOPE-INFERRED` / `composition`) is stated in the PRD; the ticket reads the PRD and writes tests for the new scope while preserving existing tests for unchanged scopes. No test management lives in domain-rules.yaml.

---

## 6. Ticket dependencies — how are they tracked across independent Claude windows

**Issue:** Each ticket runs in its own Claude window with no memory of prior tickets. If Ticket 2 called a function created by Ticket 1, the Ticket 2 window had no way to know that interface existed.

**Fix (two parts):**

- **`/break-into-tickets`** now explicitly maps dependencies and marks them on each checkbox: `| requires: Ticket 1 merged`. Tickets with dependencies are blocked from starting until the dependency is confirmed merged.
- **`## Ticket handoffs` section in AGENT_CONTEXT.md** — before opening a PR, each ticket window appends a brief note: interfaces it created, design decisions made, error types introduced. The next ticket window reads this section as the first step of Load context.

**What it means:** Tickets can run in separate windows without losing continuity. The handoff section is the lightweight contract between tickets. It's cleared at `/ship-feature` once all PRs are merged.

---

## 7. Removed `test_cases` from domain-rules.yaml

**Issue:** The `test_cases` field in domain-rules.yaml contained strings describing test scenarios. These duplicated what the actual test files already proved, had no enforcement mechanism (just a string), added maintenance overhead, and were fragile — changing a rule description required updating both YAML and tests separately.

**Fix:** Removed entirely. The `test_cases` field no longer exists in the schema. Also removed the `spec-alignment CI` job that checked for consistency between YAML test strings and test files (the job was checking strings against strings, not behaviour against code).

**What it means:** The test files are the sole authority for test lifecycle. YAML owns the business rule definition. The two don't duplicate each other.

---

## 8. Test types — what exists, where it's called, what happens on failure

**Issue:** The framework referenced "tests" generically. There was no central reference explaining the different types of tests, what skill covers each, when each runs, and what happens on failure.

**Fix:** Added **Chapter 14 — Test Types** tab to `knowledge-loop.html`. Covers 8 test types:

| Type               | Skill                   | When triggered                            |
| ------------------ | ----------------------- | ----------------------------------------- |
| Unit               | `/tdd`                  | Per behavior during ticket TDD loop       |
| Integration        | `/tdd`                  | Per ticket, after unit tests pass         |
| End-to-end         | Manual / CI             | After all tickets merged, before ship     |
| TDD cycle          | `/tdd`                  | RED → GREEN per behavior                  |
| Frontend component | `/tdd`                  | Same TDD loop, scoped to UI component     |
| Backend API        | `/tdd`                  | Same TDD loop, scoped to endpoint         |
| Browser-based      | External tool           | Post-merge, regression suite              |
| Contract           | `/define-seam-contract` | At seam establishment, on any seam change |

**On failure:** CI blocks the PR. The ticket window is re-opened to fix. `/ship-feature` will not proceed if any ticket PR has failing checks.

---

## 9. AGENT_CONTEXT.md — archetype-based templates

**Issue:** The single fixed AGENT_CONTEXT.md template was too rigid. A backend domain needs owned tables and DB patterns. An AI agent domain needs escalation logic and tool inventory. A cross-cutting domain needs neither. One template couldn't cover all cases without becoming a graveyard of N/A sections.

**Fix:** `/scaffold-domain` now asks which archetype the domain is, then generates a matching template:

| Archetype         | Required sections               | Optional sections                                                        |
| ----------------- | ------------------------------- | ------------------------------------------------------------------------ |
| **backend**       | Purpose · Glossary · Known debt | Owned tables · Architecture patterns · File locations                    |
| **agent**         | Purpose · Glossary · Known debt | Agent capabilities · Escalation rules · Tool inventory · Prompt patterns |
| **integration**   | Purpose · Glossary · Known debt | External systems · Auth & credentials · Rate limits · Failure modes      |
| **cross-cutting** | Purpose · Glossary · Known debt | Policy rules · Consumer domains · Enforcement point                      |

New sections can be added freely when grill-me surfaces content with no existing home.

**What it means:** The template is a starting point, not a constraint. Archetype determines the default sections; the domain's actual needs determine what gets added or dropped.

---

## 10. Remove draft rule status from domain-rules.yaml (Option C + Option 1)

**Issue:** Rules were written into domain-rules.yaml with `status: draft` as soon as they were discovered during grill-me — before any code existed. This polluted the "what is live" view of the domain. Two PRDs written before either shipped could also mint conflicting rule IDs using the same counter.

**Fix — Option C (no draft in YAML):**

- During `/grill-me` and `/update-agent-context`: rules stay as plain English in AGENT_CONTEXT.md only. No ID. No YAML entry.
- During `/write-a-prd`: after `gh issue create` returns the issue number, rule IDs are minted as `RULE-<DOMAIN>-P<issue-number>-<seq>` (e.g. `RULE-BILLING-P10-1`). PRD body is edited to replace placeholders. validate-knowledge runs for conflict check. Rules still not in YAML.
- During `/ship-feature`: rules are written to domain-rules.yaml for the first time, directly as `status: active`. No promotion step needed.

**Fix — Option 1 (PRD-number-based IDs):**
Format: `RULE-<DOMAIN>-P<N>-<seq>`. The PRD issue number (globally unique GitHub issue) makes IDs collision-proof across concurrent PRDs without a shared counter.

**What it means:**

- domain-rules.yaml only ever contains rules that have shipped code behind them
- No `draft` status exists anywhere in the YAML
- Rule IDs are stable from PRD creation through shipping — no renaming
- Two concurrent PRDs cannot collide on IDs because each gets a unique issue number

---

## 11. Major overhauls — gaps identified (not yet implemented)

**Issue raised:** How does the framework handle a big-bang refactor where you're ripping out an entire subsystem? How do docs and YAML catch up?

**What works today:**

- Pure architectural refactor (same business rules, different code structure) — works fine. AGENT_CONTEXT.md architecture section is rewritten at ship-feature. YAML unchanged.
- 2–3 rule replacements — supersede path handles it cleanly.

**Gaps identified:**

- **Batch supersede is noisy.** 8 simultaneous supersedes trigger 8 independent validate-knowledge runs. Each can raise its own CHAIN-IMPACT gate. The framework has no concept of "this is a coordinated batch — treat as one atomic decision."
- **AGENT_CONTEXT.md has no reset path.** ship-feature's Step 3 says "use Edit tool to update changed sections." For a wholesale architecture change, targeted edits don't work — you need to rewrite sections entirely.
- **PRD template is additive, not subtractive.** The template doesn't have a "Motivation: why the current approach is wrong" section. Refactor PRDs have fundamentally different content from feature PRDs.
- **Multi-domain overhauls have no coordinating skill.** Merging or splitting domains requires updating CLAUDE.md seams, retiring AGENT_CONTEXT.md files, and moving rules across domain boundaries. No skill covers this.
- **Stale references not audited.** After a refactor, AGENT_CONTEXT.md may still reference deleted module names or file paths. Only domain-rules.yaml gets careful lifecycle tracking.

**Proposed solution (not yet built):**
A `/overhaul-domain` skill that:

1. Produces an "overhaul manifest" — classifies every rule as survive / transform / retire before writing anything
2. Runs validate-knowledge once across the whole manifest, not per-rule
3. Allows section-level rewrites of AGENT_CONTEXT.md
4. Updates CLAUDE.md seams in one pass

The key distinction: validate-knowledge currently asks "is this new rule consistent with what exists?" — a refactor needs "is this new rule set internally consistent?" That's a different scan.
