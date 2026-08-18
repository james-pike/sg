# Payments setup (50/50 split + Stripe)

> **Current model (Synergy Group):** every order is a **50/50 split**. The
> customer pays **half the total by credit card** at checkout via Stripe Checkout
> (hosted page); the **other half is invoiced to the signed-in portal's company**
> (Airtech / Corflow / Powered / Wired Synergy) and tracked as
> `company_billing_status = 'pending_invoice'` for a later QuickBooks export.
> There is no payment-method choice — every checkout is a split.
>
> Run the split-billing migration once, in addition to the Stripe setup below:
>
> ```bash
> turso db shell <your-db> < db/migrations/002_split_billing.sql
> ```
>
> This adds `customer_amount`, `company_amount`, `company_name`, and
> `company_billing_status` to `orders`. The customer half is captured by the
> Stripe webhook (order → `paid`); the company half stays `pending_invoice`
> until it's billed / exported to QuickBooks.
>
> **The gift-card sections below are legacy** (from the wt/wills project) and are
> no longer used by the checkout. `db/lib/giftcards.ts` and the `gift_cards`
> tables can stay in place harmlessly, or be dropped.

---

<details>
<summary>Legacy: gift-card scaffold (no longer used)</summary>

This scaffolds four checkout options: **PO / invoice** (existing), **gift card**,
**gift card + credit card**, and **credit card**. Gift cards are tracked in the
database; the credit-card portion goes through Stripe Checkout (hosted page).

Most orders are expected to be **gift card + credit card**: each employee gets a
~$250 gift card, and the card covers any remaining balance.

</details>

---

## 1. Run the database migration

Adds the `gift_cards` + `gift_card_transactions` tables and payment columns on
`orders`.

```bash
turso db shell <your-db> < db/migrations/001_payments.sql
```

(Or paste the file into the Turso web shell. On a re-run, the `ALTER TABLE ADD
COLUMN` lines error because the columns already exist — that's safe to ignore.)

### Load gift cards

Insert one row per card (store codes UPPERCASE, no spaces):

```sql
INSERT INTO gift_cards (code, balance, initial_balance, note)
VALUES ('WT-GC-000001', 250.00, 250.00, 'Jane Doe');
```

## 2. Set environment variables

See `.env.example`. For payments you need:

- `STRIPE_SECRET_KEY` — `sk_test_...` then `sk_live_...`
- `STRIPE_WEBHOOK_SECRET` — `whsec_...` from the webhook you create below
- (optional) `SITE_URL` — public origin for Stripe return URLs

On **Cloudflare Pages**, add these as encrypted environment variables /
secrets in the project settings (Production + Preview). Locally, use `.dev.vars`
or `.env`.

## 3. Create the Stripe webhook

In the Stripe dashboard → **Developers → Webhooks → Add endpoint**:

- URL: `https://<your-domain>/api/stripe-webhook`
- Event: `checkout.session.completed`
- Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET`.

The webhook is the source of truth: it deducts the gift-card balance (only after
the card actually paid), marks the order `paid`, and sends the confirmation
email.

## 4. Test

Use Stripe **test mode** and card `4242 4242 4242 4242`, any future expiry / CVC.

- **Gift card + card:** apply a $250 test gift card to a >$250 order → the
  balance goes to Stripe → pay → webhook marks it paid and deducts $250.
- **Card only:** whole total goes to Stripe.
- **Gift card only:** works only if the card covers the full total (otherwise the
  UI tells the customer to switch to gift + card).
- **PO:** unchanged — no payment captured.

For local webhook testing use the Stripe CLI:

```bash
stripe listen --forward-to localhost:5173/api/stripe-webhook
```

---

## How it fits together

| File | Role |
|------|------|
| `db/migrations/001_payments.sql` | schema |
| `src/lib/giftcards.ts` | balance lookup + atomic deduction (guarded UPDATE) |
| `src/lib/stripe.ts` | fetch-based Stripe Checkout + webhook verification (no npm dep, Workers-safe) |
| `src/lib/orders.ts` | shared confirmation-email builder + sender |
| `src/routes/layout.tsx` | `useCheckGiftCard` + `useSubmitOrder` actions, checkout UI |
| `src/routes/api/stripe-webhook/index.ts` | finalizes card orders |
| `src/routes/checkout/success/index.tsx` | card return page (clears cart) |
| `src/routes/checkout/cancelled/index.tsx` | card cancel page |

### Privacy note
Consistent with the existing policy, customer **email/phone are not stored in the
DB**. For card orders they travel to the webhook via **Stripe session metadata**
(a third-party processor) so the confirmation email can be sent after payment;
the order's line items are read from the order row by id.

### Known scaffold limitations (worth hardening before heavy use)
- **Gift-card reservation:** the balance is validated at checkout and deducted in
  the webhook. Between those, a concurrent order could spend the same card; the
  webhook's guarded deduct then fails and flags the order `review_gift`. For a
  single card per employee this is unlikely, but a short-lived "hold" would make
  it airtight.
- **Amounts** are computed server-side from the posted cart; there's no separate
  price catalog check. Fine for an internal, authenticated store.
- The Stripe page shows a single line item ("balance after gift card"), not the
  full itemized list — the itemized breakdown is in the confirmation email.
