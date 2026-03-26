# Process Test: Platform Selection Log

> Created: 2026-03-26
> Purpose: Record why e-commerce was chosen as the process test platform

---

## Options Considered

### Option A: E-commerce platform

Domains: Catalog · Orders · Customers
Modules: Inventory, Pricing, Search · Cart, Checkout, Fulfillment · Profile, Address Book, Loyalty

### Option B: Google Tag Manager

Domains: Workspace · Tag Configuration · Publishing

### Option C: Local Biz Intel Platform (existing)

27 PRDs already written. AI marketing agency platform. Full stack built, deploying to AWS.

---

## Comparison

| Dimension                       | E-commerce                                      | Google Tag Manager                                                     | Local Biz Intel                |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------ |
| Domain boundary clarity         | Very clean                                      | Blurry — Tags/Triggers/Variables are tightly coupled, not true domains | Clean — already designed       |
| Business rule richness          | High — pricing, inventory, fulfillment, returns | Low — mostly config management                                         | High — already documented      |
| Cross-domain seam variety       | Three distinct seams, different contract types  | Mostly internal coupling, not true cross-domain seams                  | Real seams already encountered |
| Familiarity for decisions       | Everyone shops — instant answers                | Narrow — requires GTM expertise                                        | Deep — 27 PRDs already exist   |
| Module naturalness              | 3 modules per domain emerge naturally           | Forced — hard to find 3 genuinely distinct modules                     | Natural                        |
| Non-technical stakeholder input | Easy                                            | Hard                                                                   | Easy                           |
| Process stress test value       | High — many decision points and edge cases      | Low — config management has few genuine ambiguities                    | Highest                        |
| Relevance to actual work        | Low                                             | High — maps to POC                                                     | Highest                        |

---

## Why GTM was rejected

GTM's core entities (Tags, Triggers, Variables) are not separate domains — they are modules within one domain. A Trigger only exists in relation to a Tag. There are no real cross-domain seams to test. Business knowledge hierarchy has almost nothing to populate. Reverse sync has no business obligations to sync to.

## Why Local Biz Intel was not chosen for this test

Too complex to set up cleanly for an isolated process test. The goal here is to test whether water flows through the pipes — a clean, well-understood domain is better for that. Local Biz Intel is the right platform to apply the process to in production once the process is validated.

## Why e-commerce was chosen

- Clean domain boundaries — best for testing boundary discipline
- Rich business rules — enough surface area to stress-test every phase
- Universal familiarity — fast decisions during /grill-me without domain research
- Natural cross-domain seams — Orders needs both Catalog and Customers
- 3 modules per domain emerge without forcing
- Business knowledge hierarchy has real content to populate

## What we are testing

Whether the full process pipeline holds up end to end:

- Does the knowledge hierarchy stay clean as features are added?
- Do cross-domain seams get documented before code crosses them?
- Does AGENT_CONTEXT.md give real orientation?
- Does reverse sync stay maintained?
- Do domain boundaries hold under pressure?
- Does /grill-me surface real unknowns?
- Does the PRD lifecycle work?

---

_Next step: Build the e-commerce platform following the process exactly, phase by phase._
