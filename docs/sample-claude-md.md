# CLAUDE.md

# Auto-loaded at the start of every Claude Code session.

# Created by /initialize-knowledge-loop · filled by /design-system-architecture

# Edit only via /design-system-architecture — never manually.

---

## Context-loading instructions

At the start of every session, before doing anything else:

1. Read `CLAUDE.md` (this file) — already loaded automatically
2. Identify the domain(s) the request touches using the domain map below
3. Read `backend/src/domains/<domain>/AGENT_CONTEXT.md`
4. Read `backend/src/domains/<domain>/domain-rules.yaml`
5. If the request crosses a seam, also read the relevant `CONTRACT.md`

Do not ask the user for context you can load yourself.

---

## Domain map

| Domain     | Owns                                                    | Entry files                                                                |
| ---------- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| `billing`  | Order totals, discounts, tax, invoices, payment intents | `domains/billing/AGENT_CONTEXT.md` · `domains/billing/domain-rules.yaml`   |
| `loyalty`  | Points earn/burn, tiers, multipliers, redemption        | `domains/loyalty/AGENT_CONTEXT.md` · `domains/loyalty/domain-rules.yaml`   |
| `catalog`  | Products, prices, inventory, variants                   | `domains/catalog/AGENT_CONTEXT.md` · `domains/catalog/domain-rules.yaml`   |
| `identity` | Users, auth, roles, sessions, permissions               | `domains/identity/AGENT_CONTEXT.md` · `domains/identity/domain-rules.yaml` |

---

## Cross-domain seam table

| Seam              | Domains          | Contract file                           | What crosses the boundary                                                    |
| ----------------- | ---------------- | --------------------------------------- | ---------------------------------------------------------------------------- |
| `billing↔loyalty` | billing, loyalty | `contracts/billing-loyalty.CONTRACT.md` | Order total passed to loyalty for points calculation after payment confirmed |
| `billing↔catalog` | billing, catalog | `contracts/billing-catalog.CONTRACT.md` | unit_price and product_id read from catalog at order creation time           |
| `identity↔all`    | identity, \*     | `contracts/identity.CONTRACT.md`        | user_id and role passed as JWT claims — all domains consume, none own        |

---

## Terminology rules

- Never say "price" — say `unit_price_cents` (billing) or `list_price_cents` (catalog)
- Never say "user" in code — say `customer` (billing, loyalty) or `account` (identity)
- Never say "points balance" — say `ledger_balance` (loyalty)
- Canonical terms per domain are in each domain's AGENT_CONTEXT.md ubiquitous language section

---

## What Claude must never do

- Write business logic outside a domain module
- Read or write another domain's database tables directly
- Bypass a CONTRACT.md interface — always use the defined seam
- Silently diverge from domain-rules.yaml — if a rule is wrong, raise it before writing code
