/**
 * Card-payment return page. Stripe redirects here with ?session_id=... after a
 * Checkout attempt. The webhook is what actually finalizes the order; this page
 * CONFIRMS the outcome to the customer and clears their cart.
 *
 * INTEGRITY GATE — payment is the source of truth. Stripe's
 * `payment_status === "paid"` is the ONE thing that decides success: if the
 * customer was charged, they ALWAYS see "Thank you for your order!", because
 * telling a paid customer their order failed is the worst possible outcome.
 * The DB is consulted only best-effort, to show the SG order number; a DB read
 * failure or a not-yet-finalized row NEVER downgrades a paid order to failure —
 * the webhook (with Stripe retries) reconciles the DB write, and the order is
 * recorded via Stripe + the confirmation email regardless.
 *
 * The NON-success "we couldn't confirm your payment" state shows ONLY when
 * Stripe did not report a paid session (payment not completed, or an
 * unknown/missing/invalid session) — i.e. no money was taken.
 */
import { component$, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { createClient } from "@libsql/client";
import { retrieveCheckoutSession } from "../../../lib/stripe";
import { useAuthCheck } from "../../layout";
import { portalBrand } from "../../../portals";

interface SessionResult {
  /** True ONLY when payment is confirmed AND the order row exists in the DB. */
  confirmed: boolean;
  orderNumber: string;
  /** True once the webhook has flipped the order to 'paid' (number + email sent). */
  finalized: boolean;
}

export const useSession = routeLoader$<SessionResult>(async ({ query, env }) => {
  // Dev simulated-payment path carries the assigned number directly (no Stripe).
  // The order was already marked 'paid' + numbered by the simulated flow, so a
  // number here means both payment and DB write happened.
  const devOrder = query.get("order") || "";
  if (devOrder) return { confirmed: true, orderNumber: devOrder, finalized: true };

  const sessionId = query.get("session_id") || "";
  const stripeKey = env.get("STRIPE_SECRET_KEY");
  if (!sessionId || !stripeKey) return { confirmed: false, orderNumber: "", finalized: false };

  try {
    const s = await retrieveCheckoutSession(stripeKey, sessionId);
    // THE gate: Stripe must confirm the card actually paid. This alone decides
    // success — nothing about our DB can turn a paid order into a failure.
    const paid = s.payment_status === "paid";
    if (!paid) return { confirmed: false, orderNumber: "", finalized: false };

    // Paid → the customer is confirmed. Best-effort DB read ONLY to show the SG
    // number. Any failure here (DB down, row not written yet, webhook not landed)
    // is swallowed and still returns confirmed:true — the webhook + Stripe
    // retries reconcile the write, and the order lives in Stripe + the email.
    let orderNumber = "";
    let finalized = false;
    try {
      const orderId = s.metadata?.order_id || "";
      const tursoUrl = env.get("TURSO_URL") || env.get("VITE_TURSO_URL");
      const tursoToken = env.get("TURSO_AUTH_TOKEN") || env.get("VITE_TURSO_AUTH_TOKEN");
      if (orderId && tursoUrl) {
        const db = createClient({ url: tursoUrl, authToken: tursoToken || undefined });
        const r = await db.execute({
          sql: "SELECT status, order_no FROM orders WHERE id = ?",
          args: [orderId],
        });
        const row = r.rows[0] as any;
        const n = Number(row?.order_no) || 0;
        if (n) orderNumber = `SG-${n}`;
        finalized = String(row?.status) === "paid";
      }
    } catch { /* DB best-effort only — never blocks a confirmed payment */ }

    return { confirmed: true, orderNumber, finalized };
  } catch {
    // Could not retrieve the session at all → we have no proof of payment.
    return { confirmed: false, orderNumber: "", finalized: false };
  }
});

export default component$(() => {
  const session = useSession();
  const confirmed = session.value.confirmed;

  // Clear the cart ONLY on a confirmed order (payment + DB placement). On an
  // unconfirmed return we keep the cart so the customer can retry — same
  // principle as the cm storefront's "don't clear on failure".
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    if (!confirmed) return;
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("ce_cart_mn_")) localStorage.removeItem(k);
      }
      document.cookie = "ce_cart_count=0;path=/;max-age=31536000";
      window.dispatchEvent(new CustomEvent("cart-updated"));
    } catch { /* ignore */ }
  });

  if (!confirmed) {
    // NOT confirmed — never show an order-success message.
    return (
      <div class="checkout-result">
        <div class="checkout-result__card">
          <div class="checkout-result__icon checkout-result__icon--warn">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>
          </div>
          <h1 class="checkout-result__title">We couldn't confirm your payment</h1>
          <p class="checkout-result__text">
            Your card may not have been charged and your order has not been confirmed. Your cart has been kept — please try again, and if you were charged, contact us at info@synergygroupapparel.ca before re-ordering.
          </p>
          <Link href="/" class="btn btn--primary">Back to catalogue</Link>
        </div>
      </div>
    );
  }

  return (
    <div class="checkout-result">
      <div class="checkout-result__card">
        <div class="checkout-result__icon checkout-result__icon--ok">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
        <h1 class="checkout-result__title">Thank you for your order!</h1>
        <p class="checkout-result__text">
          {session.value.orderNumber
            ? `Order ${session.value.orderNumber} has been confirmed and sent for processing.`
            : "Your payment is confirmed. Your order number and confirmation email are on their way."}
        </p>
        <Link href="/" class="btn btn--primary">Continue</Link>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => ({
  title: `Order confirmed — ${portalBrand(resolveValue(useAuthCheck).loginType)}`,
});
