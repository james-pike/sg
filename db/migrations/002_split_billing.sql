-- Split billing: the customer pays 50% by credit card at checkout (Stripe), and
-- the remaining 50% is invoiced to the signed-in portal's company (to be pushed
-- to QuickBooks later). These columns record both halves + the company-invoice
-- status so the AR side can be reconciled/exported independently of the order's
-- payment status.
--
-- Run against the Turso database, e.g.:
--   turso db shell <your-db> < db/migrations/002_split_billing.sql
-- (or paste into the Turso web shell). SQLite has no "ADD COLUMN IF NOT EXISTS";
-- if a column already exists the statement errors — skip the ones that fail on a
-- re-run.

ALTER TABLE orders ADD COLUMN customer_amount        REAL DEFAULT 0;              -- half paid now by card
ALTER TABLE orders ADD COLUMN company_amount         REAL DEFAULT 0;              -- half billed to the company
ALTER TABLE orders ADD COLUMN company_name           TEXT;                        -- billed party, e.g. "Corflow Synergy"
ALTER TABLE orders ADD COLUMN company_billing_status TEXT DEFAULT 'pending_invoice'; -- 'pending_invoice' | 'invoiced' | 'exported_qb' | 'paid'
