# Knowledge Consistency: Problem, Options Considered, and Decision

> Created: 2026-03-26
> Context: Designing the quality layer for AI-maintained knowledge docs
> Problem: How do you keep a knowledge base consistent when an LLM both writes
> and reads from it across 200+ PRDs over time?

---

## The Problem

Traditional documentation is written by humans, read by humans, updated occasionally.
Our system is different:

- An LLM writes knowledge docs (and can hallucinate)
- An LLM reads knowledge docs (and acts on what it reads)
- 200+ PRDs update the same docs over time
- PRD 30 says: billing amount = divide by 10
- PRD 100 says: billing amount = multiply by 100
- If both rules survive in DOMAIN_BUSINESS.md, Claude on PRD 201 acts on wrong information
- Wrong information compounds: every session after the corruption is affected

This is not a traditional knowledge management problem. It is an emerging problem
specific to AI-mediated knowledge systems where the same agent both reads and writes.

---

## Industry Patterns Considered

### Pattern 1: ADR (Architecture Decision Records)

**Used by:** Standard in software engineering teams
**How it works:** Each decision gets an ID, a status (proposed / accepted / deprecated /
superseded), a date, and a link to what it supersedes. When a decision changes, the
old record is marked superseded and a new record is created. Nothing is deleted.

**What it solves well:**

- Decision lineage — you can trace every rule back to when it was made
- Prevents silent overwrites — superseded rules stay in the record
- Human-readable history alongside current state

**What it does not solve:**

- Does not prevent a skill from creating a new rule that conflicts with an existing one
  without realizing it
- Does not validate whether the rule matches the actual code
- Still relies on LLM to identify which existing rule a new rule conflicts with

**Verdict:** Good for lineage and lifecycle management. Insufficient as a standalone
safeguard because conflict detection is still semantic (LLM judgment).

---

### Pattern 2: Database Migrations (Flyway, Liquibase)

**Used by:** Enterprise systems — any application using relational databases
**How it works:** Schema changes are versioned sequential files. Each migration is
applied once and never edited. The current schema is always the result of applying
all migrations in order. New changes create new migration files.

**What it solves well:**

- Versioned, ordered change history
- Never edit an applied migration — safe, auditable
- Current state is always derivable
- Forces discipline: every change is an explicit, named operation

**What it does not solve:**

- Agents read DOMAIN_BUSINESS.md, not a migrations folder — history files are not
  in the knowledge reading path
- Migrations work on structured data (SQL schema); prose rules don't map cleanly
- Does not prevent semantic conflicts between rules in different migrations

**Verdict:** Good mental model (treat every rule change as a versioned operation,
never edit what shipped). Not practical as implemented because the history artifacts
are not in the agent's reading path.

---

### Pattern 3: Event Sourcing / CQRS

**Used by:** Amazon (for distributed systems), enterprise financial systems
**How it works:** Events are immutable and append-only. Current state is derived by
replaying the event log from the beginning. The log never changes — only new events
are added. CQRS separates the write model (events) from the read model (current state).

**What it solves well:**

- Perfect audit trail — full history of every change
- Immutable: nothing can be corrupted because nothing is ever overwritten
- Recoverable: roll back by replaying up to a previous point in the log

**What it does not solve:**

- Agents cannot replay an event log at query time — they read a document, not a log
- Requires a separate "current state" document (a projection), which means maintaining
  two artifacts and keeping them in sync
- Write-time conflict detection still requires semantic judgment
- Adds significant complexity for marginal benefit in a markdown-based system

**Verdict:** Elegant but impractical for our context. The complexity is not justified
when the read model (the markdown doc) is still needed. The immutability benefit is
already covered by git history.

---

### Pattern 4: Knowledge Graphs (RDF, OWL, Google Knowledge Graph)

**Used by:** Google (Knowledge Graph), enterprise ontology systems, semantic web
**How it works:** Entities are defined as nodes with typed properties and explicit
relationships. A conflict is structural and deterministic: same entity + same property

- different value = conflict. No semantic matching needed. SPARQL queries can find
  all rules about a given entity-property pair in milliseconds.

**What it solves well:**

- Conflict detection is deterministic — no LLM judgment required
- Entities and relationships are formally defined — no ambiguity
- Queryable: find all rules about billing.amount with one query
- Gold standard for enterprise knowledge management at scale

**What it does not solve:**

- Requires specialized infrastructure: triple stores, SPARQL endpoints, OWL reasoners
- Not markdown-friendly — incompatible with the file-based knowledge hierarchy we use
- High setup cost: requires ontology design, tooling, team training
- Far beyond what a Claude skill can write to reliably

**Verdict:** The right long-term answer at Google scale. Overkill and impractical for
a team-sized system built on markdown files and GitHub. The principles (entities with
typed properties, structural conflict detection) should be borrowed, not the tooling.

---

### Pattern 5: Structured YAML Rules + ID Matching + Human Diff Approval + CI Tests

**Used by:** Synthesized from TDD, ADR, database migrations, schema validation, human-in-the-loop AI review
**How it works:** Business rules are stored as structured YAML with IDs, not embedded
in prose. Conflict detection is a lookup by ID and entity+field+operation — not semantic
matching. Before any write, an exact diff is shown for human approval. Every active rule
has CI test cases that validate the rule matches the actual code.

**Components borrowed from each pattern:**

| Component                                         | Borrowed from                           | What it contributes                                   |
| ------------------------------------------------- | --------------------------------------- | ----------------------------------------------------- |
| Rule IDs + status + supersedes chain              | ADR pattern                             | Lineage, lifecycle management, nothing deleted        |
| Never edit what shipped, versioned operations     | Database migrations                     | Discipline, audit trail                               |
| Immutable history, append-only                    | Event sourcing                          | Recoverability, no corruption                         |
| Entity + property + operation as the conflict key | Knowledge graphs                        | Deterministic conflict detection without LLM judgment |
| Structured schema validation                      | OpenAPI / JSON Schema                   | Catches structural hallucinations before commit       |
| Test cases linked to rules, run in CI             | TDD                                     | Code validates the rule, not just the document        |
| Human reviews exact diff before approval          | Human-in-the-loop AI (medical/legal AI) | Semantic validator is always human, not LLM           |

**What this solves:**

- LLM does not need to semantically match rules — it looks up by ID
- Conflict detection is a schema check: one active rule per entity+field+operation
- Human reads a raw diff and approves — semantic validation is human, not LLM
- CI fails if rule says X but code does Y — code is the ground truth validator
- Nothing is ever deleted — full history preserved, always recoverable

**What this does not solve:**

- Human must declare correct rule IDs in the PRD — human error still possible
- Human must read and approve the diff — creates a review step
- Test coverage gaps mean some rules go unvalidated by CI

**Verdict:** Most practical option. Reduces the LLM's judgment surface to near zero.
Human handles semantic validation. CI handles code-level validation. Structure handles
conflict detection. Adopted as the approach.

---

## Decision

**Chosen: Pattern 5 (Structured YAML Rules + ID Matching + Human Diff Approval + CI Tests)**

Combined with ADR lifecycle naming from Pattern 1 (ID, status, supersedes).

### Why not the others

| Pattern             | Rejected because                                         |
| ------------------- | -------------------------------------------------------- |
| ADR alone           | Conflict detection still relies on LLM semantic matching |
| Database migrations | History artifacts not in agent reading path              |
| Event sourcing      | Too complex; still needs a current-state projection      |
| Knowledge graphs    | Right answer at Google scale; impractical for our stack  |

### The core principle

**Reduce what the LLM needs to judge to near zero.**

Every safeguard that relies on LLM semantic understanding of English prose is a
hallucination surface. Every safeguard that is deterministic (schema check, ID lookup,
CI test pass/fail, raw diff) is reliable regardless of LLM behavior.

The LLM's role in knowledge updates:

- Look up the rule by declared ID
- Apply the declared change
- Show the exact diff
- Wait for human approval

Everything else is deterministic infrastructure.

---

## The Four-Layer Quality Architecture

```
Layer 1: STRUCTURE
  Business rules in domain-rules.yaml with IDs, typed fields, status
  Conflict detection = schema check: one active rule per entity+field+operation
  No LLM semantic matching needed

Layer 2: SURGICAL EDIT
  Skills always read existing doc before writing
  Changes target specific rule IDs, not sections of prose
  Edit tool (targeted), not Write tool (overwrite)

Layer 3: HUMAN APPROVAL GATE
  Before any write, show exact diff to human
  Human is the semantic validator — not the LLM
  No write proceeds without explicit approval

Layer 4: CI VALIDATION
  Every active rule has test cases in domain-rules.yaml
  CI reads the file and validates test cases against actual code
  If rule says X but code does Y → CI fails → blocked from merge
```

---

## What is genuinely novel about this problem

Standard knowledge management assumes human writers and human readers. Our problem
has an LLM doing both. The closest existing analogy is a living test suite:

- Tests are a living specification that must stay consistent as code evolves
- Tests have IDs, they are never deleted, they run in CI, deletions require human review
- A failing test means the specification and the code disagree

Applied to knowledge: a failing CI rule test means the knowledge doc and the code
disagree. That disagreement, caught automatically, is the safeguard against hallucination.

---

_Reference: see also plan file at ~/.claude/plans/wise-zooming-codd.md_
_Process guide: tag_manager_poc/docs/ai-engineering-process.html_
