# AGENT_CONTEXT.md — billing domain

# Archetype: backend

# Created by /scaffold-domain · updated by /update-agent-context

# Edit only via /update-agent-context — never manually.

---

## Purpose

The billing domain owns all order total arithmetic: subtotal calculation, coupon
discount deduction, sales tax computation, and final order total. It also owns
invoice generation and payment intent creation. It does not own product prices
(catalog domain) or loyalty point accrual (loyalty domain).

---

## Glossary

| Term                   | Definition                                                                      | Do not say                   |
| ---------------------- | ------------------------------------------------------------------------------- | ---------------------------- |
| `subtotal_cents`       | Sum of unit_price_cents × quantity for all line items, before discount or tax   | "price", "amount", "cost"    |
| `discount_cents`       | Amount deducted from subtotal when a valid coupon is applied                    | "savings", "promo amount"    |
| `taxable_amount_cents` | subtotal_cents minus discount_cents — the base for tax calculation              | "net amount"                 |
| `tax_cents`            | floor(taxable_amount_cents × SALES_TAX_RATE)                                    | "VAT", "GST"                 |
| `total_cents`          | subtotal_cents − discount_cents + tax_cents — the amount charged                | "grand total", "final price" |
| `Coupon`               | A redeemable code with type (percent/fixed) and value                           | "promo", "voucher", "code"   |
| `Invoice`              | Immutable record created after payment confirmed, containing the full breakdown | "receipt", "bill"            |

All monetary values are stored and passed as **whole cents (integer)**. Never use
floats for money anywhere in this domain.

---

## Known debt

- Tax rate is a single env var (SALES_TAX_RATE). Multi-jurisdiction tax is out of scope until PRD #12.
- Coupon composition (stacking two coupons) is explicitly out of scope. If a request adds it, raise before writing code.
- Invoice PDF generation is stubbed — returns a placeholder URL until PRD #15.

---

## Owned tables

- `orders` — order header, status, customer_id, timestamps
- `order_line_items` — unit_price_cents, quantity, product_id per line
- `coupons` — code, type (percent/fixed), value, expiry, redemption count
- `invoices` — immutable record per confirmed payment

---

## Architecture patterns

### Module boundaries

- `OrderCalculator` — pure function, no I/O. Input: `{line_items, coupon?}`. Output: `{subtotal, discount, tax, total}`.
- `CouponRepository` — single DB interface for coupon reads. Raises typed errors: `CouponExpiredError`, `CouponInvalidError`.
- `InvoiceRepository` — write-only after payment. Never update an invoice after creation.
- `BillingController` — thin. Validates request shape, delegates to Calculator + Repository, returns response.

### Error handling

- Validation errors (missing fields, wrong types) → HTTP 400
- Business errors (expired coupon, invalid code) → HTTP 422 with machine-readable `error` field
- Never return raw database errors to the client

### Money rule

All monetary arithmetic uses integer cents. No floats. Rounding is always `floor`
(customer-favoured). Enforced by rule RULE-BILLING-003 in domain-rules.yaml.

---

## File locations

```
backend/src/domains/billing/
  AGENT_CONTEXT.md          ← this file
  domain-rules.yaml
  openapi.yaml
  OrderCalculator.ts
  CouponRepository.ts
  InvoiceRepository.ts
  BillingController.ts
  billing.routes.ts
  __tests__/
    OrderCalculator.test.ts
    CouponRepository.test.ts
    billing.integration.test.ts
```
