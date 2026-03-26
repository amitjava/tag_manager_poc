# AI Engineering Process — Flow Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        AI ENGINEERING PROCESS                               ║
║                     Idea  →  PRD  →  Build  →  QA                          ║
╚══════════════════════════════════════════════════════════════════════════════╝


━━━━━━━━━━━━━━━━━━━━━━━  PROJECT START (once, before any feature)  ━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────────────┐
  │  SYSTEM ARCHITECTURE DOCUMENT                                        │
  │                                                                      │
  │  ┌─────────────────┐  ┌───────────────────────┐  ┌───────────────┐  │
  │  │   Domains        │  │   Folder Structure     │  │  Seams        │  │
  │  │                  │  │                        │  │               │  │
  │  │  advertisers ──► │  │  backend/src/          │  │  domain A     │  │
  │  │    owns: Advert- │  │    domains/            │  │    │          │  │
  │  │    iser, tag     │  │      advertisers/      │  │    │ HTTP /   │  │
  │  │    files, code   │  │        Controller.ts   │  │    │ interface│  │
  │  │                  │  │        Repository.ts   │  │    ▼          │  │
  │  │  domain2 (stub)  │  │        Service.ts      │  │  domain B     │  │
  │  │    owns: TBD     │  │        routes.ts       │  │               │  │
  │  │                  │  │      domain2/          │  │  never import │  │
  │  │  billing ...     │  │        module2_1/      │  │  repo direct  │  │
  │  │  campaigns ...   │  │        module2_2/      │  │               │  │
  │  └─────────────────┘  │      db/ (shared)      │  └───────────────┘  │
  │                        └───────────────────────┘                      │
  └──────────────────────────────────────────────────────────────────────┘
                                      │
                      feeds into every feature session
                                      │
                                      ▼

━━━━━━━━━━━━━━━━━━━━━━━━━  BEFORE EVERY FEATURE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────────────┐
  │  PHASE 0 — Platform Context + Domain Assignment                      │
  │                                                                      │
  │  ① Read PLATFORM_CONTEXT.md                                          │
  │                                                                      │
  │  ┌────────────────────────────────────────────────────────────────┐  │
  │  │ §1 Platform Overview    │  §5 Settled Decisions  ← don't reopen│  │
  │  │ §2 Knowledge Sources    │  §6 Open Backlog       ← don't resurf │  │
  │  │ §3 Current State        │  §7 Genuine Unknowns   ← START HERE  │  │
  │  │ §4 Infrastructure       │  §8 Domain Map         ← pick domain  │  │
  │  └────────────────────────────────────────────────────────────────┘  │
  │                                                                      │
  │  ② Assign domain before asking a single question                     │
  │     "This feature belongs to the `advertisers` domain"               │
  │     → sets the folder, the owner, and the language scope             │
  └──────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼

━━━━━━━━━━━━━━━━━━━━━━━━━━━━  PHASE 1 — IDEA  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────────────┐
  │  /grill-me                                                           │
  │                                                                      │
  │  15–50 questions · multiple rounds · within assigned domain          │
  │  Resolves: entities · fields · error states · scope · edge cases     │
  │  Done when: zero open questions remain                               │
  └──────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  /ubiquitous-language                                                │
  │                                                                      │
  │  Locks canonical terms across DB · API · UI · code                  │
  │  "tag" in DB + "script" in API + "pixel" in UI = invisible bug       │
  │  Output: UBIQUITOUS_LANGUAGE.md                                      │
  └──────────────────────────────────────────────────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
      [skip if pure             PHASE 2                   PHASE 3
       internal feature]        Research                  Prototype
                                (optional)                (optional)
                                    │                         │
                          ┌─────────┴──────────┐   ┌─────────┴──────────┐
                          │ research.md         │   │ /design-an-interface│
                          │                     │   │                     │
                          │ Cache external API  │   │ 3 agents · 3 designs│
                          │ knowledge in repo   │   │ in parallel         │
                          │                     │   │ minimize · maximize │
                          │ ⚠ mark with date    │   │ · optimize-for-caller│
                          │ delete after ship   │   │                     │
                          └────────────────────┘   │ /improve-codebase-  │
                                                    │ architecture        │
                                                    │ (1st pass — before  │
                                                    │  touching existing  │
                                                    │  code)              │
                                                    └────────────────────┘
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │
                                      ▼

━━━━━━━━━━━━━━━━━━━━━━━━━━━━  PHASE 4 — PRD  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────────────┐
  │  /write-a-prd                                                        │
  │                                                                      │
  │  §1  Feature Overview         §7  Implementation Decisions           │
  │  §2  Problem Statement             Domain: advertisers               │
  │  §3  Solution                      DB Schema · API Contract          │
  │  §4  Ubiquitous Language           Modules                           │
  │  §5  User Stories             §8  Testing Decisions                  │
  │  §6  Acceptance Criteria      §9  Tracer Bullet Slices               │
  │       ↑ this is what QA uses  §10 Out of Scope  ← as important as   │
  │       write it to that           §11 Open Questions  (must be empty) │
  │       standard                   §12 Further Notes                   │
  └──────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼

━━━━━━━━━━━━━━━━━━━━━━━━━━  PHASE 5 — PLANNING  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────────────┐
  │  /prd-to-plan → plans/<feature>.md                                   │
  │                                                                      │
  │  Slice 1: DB + API + UI  ← proves full stack works together          │
  │  Slice 2: adds create                                                │
  │  Slice 3: adds edit                      Each slice is               │
  │  Slice 4: adds delete          ◄────     demo-able end-to-end        │
  │  Slice 5: validation hardening           Never horizontal layers     │
  └──────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  /prd-to-issues → GitHub Issues                                      │
  │                                                                      │
  │  Title: [TM-N] short-name                                            │
  │  Body:  stories covered · acceptance criteria checkboxes             │
  │  Deps:  "Depends on #N"                                              │
  │  Branch: feature/TM-N-short-name                                     │
  │  Close: "Closes #N" in PR description → auto-closes on merge         │
  │                                                                      │
  │  GitHub Projects Kanban ← create NOW, not later                      │
  │  [ Todo ] → [ In Progress ] → [ In Review ] → [ Done ]              │
  └──────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼

━━━━━━━━━━━━━━━━━━━━━━━━━━  PHASE 6 — EXECUTION  ━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ONE-TIME SETUP (before first feature commit)
  ┌──────────────────────────────────────────────────────────────────────┐
  │  /setup-pre-commit                                                   │
  │  Every commit gates: lint-staged → typecheck → tests                 │
  │  Use absolute $ROOT paths in hook — never chain cd commands          │
  │                                                                      │
  │  /git-guardrails-claude-code  (global — covers all projects)         │
  │  Blocks: git push · git reset --hard · git clean -f · branch -D      │
  │  Agent writes + commits. You review + push manually.                 │
  └──────────────────────────────────────────────────────────────────────┘

  PER-SLICE LOOP  ← repeat for every issue
  ┌──────────────────────────────────────────────────────────────────────┐
  │                                                                      │
  │  git checkout -b feature/TM-N-name                                  │
  │              │                                                       │
  │              ▼                                                       │
  │  ┌─────────────────────────────────────────────────────────────┐    │
  │  │  /tdd                                                        │    │
  │  │                                                              │    │
  │  │  ┌─ RED ──────────────────────────────────────────────────┐ │    │
  │  │  │  Write failing test                                     │ │    │
  │  │  │  Specifies exact behaviour before any code is written   │ │    │
  │  │  └────────────────────────────────────────────────────────┘ │    │
  │  │              │                                               │    │
  │  │              ▼                                               │    │
  │  │  ┌─ GREEN ────────────────────────────────────────────────┐ │    │
  │  │  │  Write minimum code to make test pass                   │ │    │
  │  │  │  No more than what the test requires                    │ │    │
  │  │  └────────────────────────────────────────────────────────┘ │    │
  │  │              │                                               │    │
  │  │              ▼                                               │    │
  │  │  ┌─ REFACTOR ─────────────────────────────────────────────┐ │    │
  │  │  │  Extract · rename · simplify  ·  tests stay green       │ │    │
  │  │  └────────────────────────────────────────────────────────┘ │    │
  │  │              │                                               │    │
  │  │              ▼                                               │    │
  │  │  ┌─ COMMIT ───────────────────────────────────────────────┐ │    │
  │  │  │  Pre-commit: lint ✓  typecheck ✓  tests ✓              │ │    │
  │  │  │  "feat: [TM-N] ..."                                     │ │    │
  │  │  └────────────────────────────────────────────────────────┘ │    │
  │  └─────────────────────────────────────────────────────────────┘    │
  │              │                                                       │
  │              ▼                                                       │
  │  You push  →  gh pr create  →  review  →  merge  →  issue closes    │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
                                      │
                              next slice ──┐
                                      │   │
                                      ▼   └── (loop until all slices done)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━  PHASE 7 — QA  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────────────┐
  │  Go through PRD Acceptance Criteria line by line                     │
  │                                                                      │
  │                    ┌─────────────────────┐                           │
  │                    │  criterion N         │                           │
  │                    └─────────────────────┘                           │
  │                         │           │                                │
  │                       PASS         FAIL                              │
  │                         │           │                                │
  │                         ▼           ▼                                │
  │                    next criterion  /triage-issue                     │
  │                                    │                                 │
  │                                    │  Root cause                     │
  │                                    │  Failing test that catches it   │
  │                                    │  Fix approach                   │
  │                                    │  → new GitHub Issue             │
  │                                    │                                 │
  │                                    └──► Phase 5 → Phase 6 → Phase 7  │
  │                                         loop until all pass          │
  │                                                                      │
  │  All criteria pass ──────────────────────────────────────────────►  │
  │                          feature ships                               │
  └──────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼

━━━━━━━━━━━━━━━━━━━━━━━━  AFTER EACH FEATURE SHIPS  ━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────────────┐
  │  Update PLATFORM_CONTEXT.md                                          │
  │                                                                      │
  │  New modules built   ──────────────────────►  add to §3             │
  │  Decisions made      ──────────────────────►  add to §5             │
  │  GitHub issues opened ─────────────────────►  add to §6             │
  │  GitHub issues closed ─────────────────────►  remove from §6        │
  │  Unknowns resolved   ──────────────────────►  move §7 → §5          │
  │                                                                      │
  │  §7 never accumulates resolved items                                 │
  │  §7 only ever contains things genuinely still open                   │
  └──────────────────────────────────────────────────────────────────────┘
                                      │
                                      └──► back to Phase 0 for next feature


━━━━━━━━━━━━━━━━━━━━━━━━━━  MAINTENANCE (recurring)  ━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────────────────────────────────────────────────────────────┐
  │  /improve-codebase-architecture   ← weekly / every 3–5 features      │
  │                                                                      │
  │  Explores codebase the way an agent sees it cold                     │
  │  Finds: shallow modules · tight coupling · seams that compound       │
  │  Deep module = small interface + large implementation                │
  │  Shallow module = large interface + trivial implementation  ← bad    │
  │                                                                      │
  │  Output: RFC GitHub issue with 3 competing interface designs         │
  │                           │                                          │
  │                           ▼                                          │
  │  /request-refactor-plan   ← when RFC is approved                     │
  │                                                                      │
  │  Tiny-commit plan — every commit leaves the app green                │
  │                                                                      │
  │  Commit 1: add typed errors        (additive — green)                │
  │  Commit 2: add interface           (additive — green)                │
  │  Commit 3: new module stub + tests (RED)                             │
  │  Commit 4: implement module        (GREEN)                           │
  │  Commit 5: refactor callers        (GREEN — all existing tests pass) │
  │  Commit 6: delete dead code        (GREEN)                           │
  └──────────────────────────────────────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━  SKILLS QUICK REFERENCE  ━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Phase 0   read PLATFORM_CONTEXT.md + domain assignment   (no skill)
  Phase 1   /grill-me  →  /ubiquitous-language
  Phase 2   manual research.md                             (no skill)
  Phase 3   /design-an-interface
            /improve-codebase-architecture  (pass 1)
  Phase 4   /write-a-prd
  Phase 5   /prd-to-plan  →  /prd-to-issues
  Phase 6   /setup-pre-commit  (once)
            /git-guardrails-claude-code  (once, global)
            /tdd  (every slice)
  Phase 7   /triage-issue
  Maint.    /improve-codebase-architecture  (recurring)
            /request-refactor-plan


━━━━━━━━━━━━━━━━━━━━━━━━━━  KEY LAWS  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ① Context quality = how long you can go AFK
    research + PRD + tickets + tests  →  hand off and come back to working code
    missing any one of these          →  supervise every step

  ② Grill-me before writing anything
    The PRD is not where you discover open questions. Grill-me is.

  ③ Lock terminology before coding
    "tag" in DB · "script" in API · "pixel" in UI  =  a build-time type error
    that's invisible until integration day

  ④ Vertical slices, not horizontal layers
    Each slice touches DB + API + UI together
    No "all backend done" milestones — they give false confidence

  ⑤ TDD is the single highest-leverage practice
    A failing test tells the agent exactly what done means
    Tests first constrain the solution space

  ⑥ Out of Scope is as important as In Scope
    Agents add features that "seem obvious" — exclude them explicitly

  ⑦ Domain-based folders for multi-domain projects
    Layer-based breaks the moment you add domain #2
    Domain folder = one place to understand one thing completely

  ⑧ Architecture health doesn't maintain itself
    Agents don't notice the smell — run /improve-codebase-architecture
    on a cadence or debt compounds invisibly
```
