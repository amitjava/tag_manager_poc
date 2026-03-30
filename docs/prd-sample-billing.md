# PRD #7 — Checkout: Discount & Tax Calculation

> Status: Draft
> Created: 2026-03-30
> Skill used: /write-a-prd
> Domain: billing

---

## 1. Feature Overview

Add discount coupon redemption and tax calculation to the checkout flow. The order total shown to the customer and charged at payment must reflect: the line-item subtotal, any coupon discount deducted, and the applicable sales tax applied to the post-discount amount.

---

## 2. Problem Statement

Today the checkout endpoint returns a raw sum of line items with no discount or tax logic. Coupons entered by customers are stored but silently ignored at payment time. Tax is applied client-side by the frontend — inconsistently and without audit trail. This causes wrong charges and support escalations.

---

## 3. Solution

Centralise all order total arithmetic in a single `OrderCalculator` service. The API returns a structured breakdown (subtotal, discount, tax, total) so the UI renders exactly what the backend calculated. Coupon validity and discount type are resolved server-side before the breakdown is computed.

---

## 4. Ubiquitous Language

| Term            | Definition                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| **Subtotal**    | Sum of `unit_price × quantity` for all line items in the order, before discount or tax.                         |
| **Coupon**      | A redeemable code that maps to a discount rule (percentage or fixed amount).                                    |
| **Discount**    | The monetary amount deducted from the subtotal when a valid coupon is applied.                                  |
| **Tax**         | Sales tax in cents, calculated as `floor(taxable_amount × tax_rate)`. Taxable amount = subtotal minus discount. |
| **Order Total** | The final amount charged: `subtotal − discount + tax`.                                                          |
| **Line Item**   | One product in the order with `unit_price` (cents) and `quantity`.                                              |

---

## 5. User Stories

1. As a customer, I want the subtotal to reflect the sum of all line items so that I can verify my cart before paying. `[rule: 2.1.1]`
2. As a customer, I want to enter a coupon code at checkout and see the discount applied to my subtotal so that I pay the correct reduced amount. `[rule: 2.2.1]`
3. As a customer, I want tax calculated on my post-discount amount so that I am not taxed on money I didn't spend. `[rule: 2.3.1]`
4. As a customer, I want to see the final order total (subtotal − discount + tax) before I confirm payment so that there are no surprises. `[rule: 2.4.1]`
5. As a customer, I want to see a clear error message if my coupon code is invalid or expired so that I understand why no discount was applied.
6. As an operator, I want all order totals calculated server-side so that I have an authoritative audit trail for every charge.

---

## 6. Acceptance Criteria

### Subtotal

- [ ] Subtotal = sum of `unit_price × quantity` across all line items `[2.1.1]`
- [ ] Fractional cents are not possible (unit prices are always whole cents)
- [ ] An order with zero line items returns subtotal = 0

### Discount

- [ ] A valid percentage coupon deducts `floor(subtotal × rate)` from the subtotal `[2.2.1]`
- [ ] A valid fixed-amount coupon deducts the fixed amount; discount is capped at subtotal (cannot go negative) `[2.2.1]`
- [ ] An expired coupon returns HTTP 422 with `error: "coupon_expired"`
- [ ] An unrecognised coupon code returns HTTP 422 with `error: "coupon_invalid"`
- [ ] No coupon field in the request means discount = 0

### Tax

- [ ] Tax = `floor(taxable_amount × tax_rate)` where `taxable_amount = subtotal − discount` `[2.3.1]`
- [ ] Tax rate is read from `SALES_TAX_RATE` environment variable (default 0.08)
- [ ] Taxable amount of 0 returns tax = 0

### Order Total

- [ ] Order total = `subtotal − discount + tax` `[2.4.1]`
- [ ] API response includes all four fields: `subtotal`, `discount`, `tax`, `total`
- [ ] UI displays the breakdown in the order summary panel before payment confirmation

---

## 7. Implementation Decisions

### No new DB tables

Coupon table already exists (`coupons`: `code`, `type` enum `[percent, fixed]`, `value`, `expires_at`). No schema changes needed.

### OrderCalculator service

Pure function — no DB calls, no side effects. Takes `{ line_items, coupon? }`, returns `{ subtotal, discount, tax, total }`. Fully unit-testable without DB.

### Tax rate config

`SALES_TAX_RATE` env var. Validated at startup — server refuses to start if missing or non-numeric. Default 0.08 for local dev only.

### API

| Method | Route                   | Description                                                           |
| ------ | ----------------------- | --------------------------------------------------------------------- |
| POST   | `/api/orders/calculate` | Dry-run: returns breakdown without creating an order                  |
| POST   | `/api/orders`           | Creates order using same calculator; breakdown stored on order record |

### Domain

**Domain:** `billing`
Modules live under `backend/src/domains/billing/`.

### Modules

- **OrderCalculator** — pure arithmetic service. No DB, no I/O.
- **CouponRepository** — fetches coupon by code, checks expiry.
- **OrderController** — validates request, calls CouponRepository + OrderCalculator, returns breakdown.

---

## 8. Testing Decisions

### What to test

**OrderCalculator** (unit — no DB needed)

- Subtotal: `[{unit_price: 1000, qty: 2}, {unit_price: 500, qty: 1}]` → subtotal = 2500
- Percent coupon 20%: subtotal 2500 → discount = 500
- Fixed coupon $10: subtotal 2500, fixed 1000 → discount = 1000
- Fixed coupon exceeds subtotal: subtotal 500, fixed 1000 → discount = 500 (capped)
- Tax at 8%: taxable 2000 → tax = 160
- Tax floor: taxable 2499 × 0.08 = 199.92 → tax = 199
- Total assembly: subtotal 2500, discount 500, tax 160 → total = 2160
- No coupon: discount = 0

**CouponRepository** (unit with test DB)

- Valid coupon returns coupon record
- Expired coupon throws `CouponExpiredError`
- Unknown code throws `CouponInvalidError`

**API** (integration via Supertest)

- `POST /api/orders/calculate` — 200 with full breakdown on valid input
- `POST /api/orders/calculate` — 422 with `coupon_expired` on expired coupon
- `POST /api/orders/calculate` — 422 with `coupon_invalid` on unknown code
- `POST /api/orders/calculate` — 400 on missing `line_items`

---

## 9. Tracer Bullet Slices

| Slice       | What it covers                                                 | Done when                                                        |
| ----------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Slice 1** | OrderCalculator — subtotal + total (no coupon, no tax)         | Unit tests green, `POST /calculate` returns subtotal = total     |
| **Slice 2** | Tax integration — env var loaded, tax computed and returned    | Response includes non-zero tax field                             |
| **Slice 3** | Coupon redemption — CouponRepository + discount in breakdown   | Valid coupon deducts correct amount; expired/invalid returns 422 |
| **Slice 4** | Order creation — `POST /api/orders` stores breakdown on record | Order row has subtotal, discount, tax, total columns populated   |

---

## 10. Tickets

Generated by `/break-into-tickets`. One checkbox = one Claude window = one PR.

- [ ] Ticket 1: OrderCalculator service — subtotal, tax, total (no coupon) + unit tests
- [ ] Ticket 2: CouponRepository — fetch by code, expiry check + unit tests
- [ ] Ticket 3: Wire coupon into OrderCalculator; discount logic + unit tests
- [ ] Ticket 4: `POST /api/orders/calculate` endpoint — controller, request validation, integration tests
- [ ] Ticket 5: `POST /api/orders` stores breakdown; order record schema migration
- [ ] Ticket 6: Frontend order summary panel — display subtotal/discount/tax/total breakdown

---

## 11. Out of Scope

- Multiple coupons per order
- Coupon creation or management UI
- Per-product or per-category tax rates (flat rate only)
- Tax jurisdiction detection (single configured rate)
- Refund or partial credit calculations
- Loyalty points integration

---

## 12. Open Questions

None. All questions resolved during `/grill-me` session.

---

## 13. Further Notes

- `OrderCalculator` must be a pure function — no side effects. This is enforced by the module boundary: it receives plain data, returns plain data.
- Tax floor behaviour (`floor`, not `round`) was confirmed in grill-me: rounding in the customer's favour is the business preference.
- The `SALES_TAX_RATE` env var failure-at-startup behaviour prevents silent misconfiguration in production.
