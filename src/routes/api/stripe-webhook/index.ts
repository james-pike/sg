/**
 * Stripe webhook — the source of truth for card payments.
 *
 * When a Checkout Session completes, Stripe POSTs here. We verify the signature,
 * then finalize the order: deduct the gift-card portion (now that the card
 * actually paid), mark the order 'paid', and send the confirmation email. The
 * customer's email/phone travel in the session metadata (not our DB); the line
 * items are loaded from the order row by id.
 *
 * Configure this URL in the Stripe dashboard (Developers → Webhooks) for the
 * `checkout.session.completed` event, and set STRIPE_WEBHOOK_SECRET.
 */
import type { RequestHandler } from "@builder.io/qwik-city";
import { createClient } from "@libsql/client";
import { verifyAndParseWebhook } from "../../../lib/stripe";
import { sendConfirmationEmail, assignSynergyOrderNumber } from "../../../lib/orders";
import type { OrderEmailData, OrderItem } from "../../../lib/orders";

export const onPost: RequestHandler = async ({ request, env, json }) => {
  const secret = env.get("STRIPE_WEBHOOK_SECRET");
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");

  const event = await verifyAndParseWebhook(payload, sig, secret || "");
  if (!event) {
    json(400, { error: "Invalid signature" });
    return;
  }

  // Only act on completed checkout sessions.
  if (event.type !== "checkout.session.completed") {
    json(200, { received: true, ignored: event.type });
    return;
  }

  const session = event.data?.object ?? {};
  const m: Record<string, string> = session.metadata || {};
  const orderId = m.order_id;
  if (!orderId) {
    json(200, { received: true, note: "no order_id in metadata" });
    return;
  }

  const tursoUrl = env.get("TURSO_URL") || env.get("VITE_TURSO_URL");
  const tursoToken = env.get("TURSO_AUTH_TOKEN") || env.get("VITE_TURSO_AUTH_TOKEN");
  if (!tursoUrl || !tursoToken) {
    // Can't finalize without the DB — 500 so Stripe retries.
    json(500, { error: "DB not configured" });
    return;
  }
  const db = createClient({ url: tursoUrl, authToken: tursoToken });

  // Idempotency: if this order is already paid, ack and stop (Stripe retries).
  const existing = await db.execute({
    sql: "SELECT status, items FROM orders WHERE id = ?",
    args: [orderId as any],
  });
  const row = existing.rows[0] as any;
  if (!row) {
    json(200, { received: true, note: "order not found" });
    return;
  }
  if (String(row.status) === "paid") {
    json(200, { received: true, note: "already paid" });
    return;
  }

  // ---- Payment received — finalize -----------------------------------------
  // The customer's 50% card portion has now settled. PAYMENT IS THE SOURCE OF
  // TRUTH: whatever happens with our DB below, the money is captured and the
  // order MUST be recorded somewhere (the confirmation email is that record).
  //
  // Mark the order paid + assign its SG number. If either DB write fails we do
  // NOT lose the order: we still send the confirmation email (so it's recorded),
  // then return 500 so Stripe RETRIES this webhook and the write is reconciled.
  // The company's 50% is tracked separately via company_billing_status (left at
  // 'pending_invoice' for the QuickBooks pipeline).
  let orderNumber = "";
  let dbWriteOk = true;
  try {
    await db.execute({
      sql: "UPDATE orders SET status = 'paid', paid_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      args: [orderId as any],
    });
    // Assign the SG number once (idempotent on retries via `order_no IS NULL`).
    // Cancelled/abandoned orders never reach here, so numbers stay gap-free.
    orderNumber = await assignSynergyOrderNumber(db, orderId as any);
  } catch (err) {
    dbWriteOk = false;
    console.error("Stripe webhook: payment WAS received but the DB finalize failed — sending the confirmation email so the order is recorded, and returning 500 so Stripe retries:", err);
  }

  // Send the confirmation email (items from the row we already fetched above,
  // everything else from Stripe metadata). This runs whether or not the DB write
  // succeeded, so a paid order is always recorded even if our DB is misbehaving.
  // sendConfirmationEmail never throws.
  const apiKey = env.get("RESEND_API_KEY") || env.get("VITE_RESEND_API_KEY");
  if (apiKey) {
    let items: OrderItem[] = [];
    try { items = JSON.parse(String(row.items || "[]")); } catch { items = []; }
    const fromAddress = env.get("RESEND_FROM") || env.get("VITE_RESEND_FROM") || "Synergy Group <onboarding@resend.dev>";
    const staffAddresses = (env.get("ORDER_NOTIFY_TO") || env.get("VITE_ORDER_NOTIFY_TO") || "info@synergygroupapparel.ca")
      .split(",").map((a) => a.trim()).filter(Boolean);
    const emailData: OrderEmailData = {
      orderNumber,
      date: m.date || "",
      employee: {
        name: m.employee_name || "",
        email: m.customer_email || "",
        phone: m.customer_phone || "",
        department: m.department || "",
        provinceName: m.province_name || "",
        provinceCode: m.province_code || "",
        address1: m.address1 || "",
        city: m.city || "",
        postal: m.postal || "",
        po: m.po || "",
      },
      items,
      subtotal: Number(m.subtotal || "0") || 0,
      taxPct: Number(m.tax_pct || "0") || 0,
      tax: Number(m.tax || "0") || 0,
      total: Number(m.total || "0") || 0,
      payment: {
        method: "split",
        customerAmount: Number(m.customer_amount || "0") || 0,
        companyAmount: Number(m.company_amount || "0") || 0,
        companyName: m.company_name || "",
      },
    };
    await sendConfirmationEmail({ apiKey, from: fromAddress, staffAddresses }, emailData);
  }

  if (!dbWriteOk) {
    // Payment captured + order emailed, but the DB wasn't updated. 500 → Stripe
    // retries; the retry re-runs the UPDATE (status still isn't 'paid', so it
    // isn't short-circuited above) and reconciles the row. The order is never
    // lost — worst case a paid order is emailed twice before the write lands.
    json(500, { error: "payment received and order emailed, but DB finalize failed — retrying" });
    return;
  }

  json(200, { received: true });
};
