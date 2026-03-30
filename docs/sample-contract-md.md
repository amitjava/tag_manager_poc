# CONTRACT.md — billing ↔ loyalty seam

# Created by /define-seam-contract

# Edit only via /define-seam-contract — never manually.

# Both domain owners must approve any change to this file.

---

## Seam

**Producer:** `billing`
**Consumer:** `loyalty`
**Trigger:** Order payment confirmed (`order.payment_confirmed` event)

---

## Purpose

After a customer's payment is confirmed, billing publishes the final order total
so the loyalty domain can calculate and credit points earned. Loyalty does not
read billing's database — it only consumes the event payload defined here.

---

## Event contract

### Event name

`order.payment_confirmed`

### Payload

```typescript
{
  order_id: string // billing's canonical order identifier
  customer_id: string // identity domain user ID (JWT sub claim)
  total_cents: number // Rule 2.4.1 — final charged amount in whole cents
  subtotal_cents: number // Rule 2.1.1 — pre-discount, pre-tax subtotal
  discount_cents: number // Rule 2.2.1 — coupon deduction applied
  confirmed_at: string // ISO 8601 datetime of payment confirmation
}
```

### What loyalty uses

| Field          | Used for                                                        |
| -------------- | --------------------------------------------------------------- |
| `total_cents`  | Points earn base — loyalty rule 1.1.1 earns on total paid       |
| `customer_id`  | Looks up customer tier to apply multiplier (loyalty rule 1.2.x) |
| `order_id`     | Idempotency key — prevents double-crediting on retry            |
| `confirmed_at` | Timestamp for points ledger entry                               |

### What loyalty must NOT do

- Read billing's `orders` table directly
- Infer discount or tax from the payload — use only `total_cents` as the earn base
- Modify or acknowledge the event — fire-and-forget; loyalty failure does not roll back payment

---

## Invariants

1. `total_cents` is always a non-negative integer (≥ 0)
2. `total_cents = subtotal_cents − discount_cents + tax_cents` (verifiable from payload)
3. `order_id` is globally unique and stable — never reused after cancellation
4. Event is published exactly once per confirmed payment, never on refunds

---

## Change protocol

Any change to this payload requires:

1. A new PRD covering both billing and loyalty impact
2. `/validate-knowledge` run in both domains
3. Both domain owners approve the CONTRACT.md diff before merge
4. Version bump in this file's header

---

## Version history

| Version | PRD    | Change                                           |
| ------- | ------ | ------------------------------------------------ |
| 1.0     | PRD #7 | Initial contract — order total passed to loyalty |
