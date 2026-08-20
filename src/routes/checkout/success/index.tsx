/**
 * Card-payment return page. Stripe redirects here with ?session_id=... after a
 * successful Checkout. The webhook is what actually finalizes the order; this
 * page just confirms to the customer and clears their cart.
 */
import { component$, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { createClient } from "@libsql/client";
import { retrieveCheckoutSession } from "../../../lib/stripe";
import { useAuthCheck } from "../../layout";
import { portalBrand } from "../../../portals";

export const useSession = routeLoader$(async ({ query, env }) => {
  // Dev simulated-payment path carries the assigned number directly (no Stripe).
  const devOrder = query.get("order") || "";
  if (devOrder) return { ok: true as const, orderNumber: devOrder, paid: true };

  const sessionId = query.get("session_id") || "";
  const stripeKey = env.get("STRIPE_SECRET_KEY");
  if (!sessionId || !stripeKey) return { ok: false as const, orderNumber: "", paid: false };
  try {
    const s = await retrieveCheckoutSession(stripeKey, sessionId);
    const paid = s.payment_status === "paid";
    // The SG number is assigned by the webhook at payment, so read it from the DB
    // by order_id (it's no longer in Stripe metadata). May be empty if the webhook
    // hasn't landed yet when this page loads — the confirmation email always
    // carries the number regardless.
    let orderNumber = "";
    const orderId = s.metadata?.order_id || "";
    const tursoUrl = env.get("TURSO_URL") || env.get("VITE_TURSO_URL");
    const tursoToken = env.get("TURSO_AUTH_TOKEN") || env.get("VITE_TURSO_AUTH_TOKEN");
    if (orderId && tursoUrl) {
      try {
        const db = createClient({ url: tursoUrl, authToken: tursoToken || undefined });
        const r = await db.execute({ sql: "SELECT order_no FROM orders WHERE id = ?", args: [orderId] });
        const n = Number((r.rows[0] as any)?.order_no) || 0;
        if (n) orderNumber = `SG-${n}`;
      } catch { /* ignore — fall back to the generic confirmation message */ }
    }
    return { ok: true as const, orderNumber, paid };
  } catch {
    return { ok: false as const, orderNumber: "", paid: false };
  }
});

export default component$(() => {
  const session = useSession();

  // Clear the cart on a confirmed return (payment happened before this page).
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("ce_cart_mn_")) localStorage.removeItem(k);
      }
      document.cookie = "ce_cart_count=0;path=/;max-age=31536000";
      window.dispatchEvent(new CustomEvent("cart-updated"));
    } catch { /* ignore */ }
  });

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
            : "It has been confirmed and sent for processing."}
        </p>
        <Link href="/" class="btn btn--primary">Continue</Link>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => ({
  title: `Order confirmed — ${portalBrand(resolveValue(useAuthCheck).loginType)}`,
});
