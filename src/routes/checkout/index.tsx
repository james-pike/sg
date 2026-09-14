// Dedicated checkout route.
//
// The "details" step that used to live inside the cart drawer, lifted onto its
// own route so it is a real, linkable URL and — crucially — so a submission
// error is ALWAYS visible (a prominent modal) instead of being written into a
// collapsed/off-screen drawer panel where the customer never sees it (e.g. a
// "Card payment couldn't start" 502). The cart stays a slide-in drawer in the
// layout; its "Checkout" button now navigates here.
//
// Payment: every order is a 50/50 split — the customer pays half now by card
// via Stripe Checkout, the rest is invoiced to the signed-in portal's company.
// On submit the server inserts the order (awaiting_payment) and returns a Stripe
// redirect URL; we send the browser there. Submits carry an idempotency key so a
// retry can't create a duplicate order row OR a duplicate Stripe session.
import { component$, useSignal, useStore, useComputed$, useContext, useVisibleTask$, $ } from "@builder.io/qwik";
import { type DocumentHead, Link, useNavigate } from "@builder.io/qwik-city";
import { Modal, Collapsible } from "@qwik-ui/headless";
import { LocaleContext, t } from "../../i18n";
import { LoginTypeContext, useSubmitOrder, taxRateFor, stripColorSuffix, type CartItem } from "../layout";
import { colorName } from "../apparel/products";
import { getPortal } from "../../portals";

export default component$(() => {
  const locale = useContext(LocaleContext);
  const loginType = useContext(LoginTypeContext);
  const orderAction = useSubmitOrder();
  const nav = useNavigate();

  const cart = useStore<{ items: CartItem[] }>({ items: [] });
  const cartHydrated = useSignal(false);

  const summaryOpen = useSignal(true);
  const formError = useSignal("");
  const formTouched = useSignal(false);
  const submitting = useSignal(false);
  // Server/submission failure (DB, network, Stripe handoff) shown in a prominent
  // modal — as visible as a confirmation — separate from inline field-validation.
  const serverError = useSignal("");
  const showError = useSignal(false);
  // One stable idempotency key per checkout visit — shared across all retries so
  // a re-submit can never create a duplicate awaiting_payment row or a second
  // Stripe Checkout session.
  const idempotencyKey = useSignal("");

  const empFirstName = useSignal("");
  const empLastName = useSignal("");
  const empEmail = useSignal("");
  const empPhone = useSignal("");
  const empProvince = useSignal("");
  const empAddress1 = useSignal("");
  const empCity = useSignal("");
  const empPostal = useSignal("");
  const empPO = useSignal("");

  // Hydrate the cart from the same localStorage key the drawer writes.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => loginType.value);
    const key = () => `ce_cart_mn_${loginType.value || "clothing"}`;
    const loadCart = () => {
      try {
        const saved = localStorage.getItem(key());
        cart.items = saved ? (JSON.parse(saved) as CartItem[]) : [];
      } catch {
        cart.items = [];
      }
      cartHydrated.value = true;
    };
    loadCart();
    window.addEventListener("cart-updated", loadCart);
    cleanup(() => window.removeEventListener("cart-updated", loadCart));
  });

  // Mint one idempotency key for this checkout visit (client-side only).
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    if (idempotencyKey.value) return;
    try {
      idempotencyKey.value = crypto.randomUUID();
    } catch {
      idempotencyKey.value = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  });

  const portal = useComputed$(() => getPortal(loginType.value));
  const companyName = useComputed$(() => `${portal.value.name} ${portal.value.sub}`);

  const cartCount = useComputed$(() => cart.items.reduce((sum, i) => sum + i.quantity, 0));
  const subtotal = useComputed$(() => cart.items.reduce((sum, i) => sum + (Number(i.price) || 0) * i.quantity, 0));
  const taxRate = useComputed$(() => taxRateFor(empProvince.value));
  const taxAmount = useComputed$(() => (taxRate.value === undefined ? undefined : subtotal.value * taxRate.value));
  const orderTotal = useComputed$(() => subtotal.value + (taxAmount.value ?? 0));
  // 50/50 split, mirrored from the server (integer cents, odd cent to the card half).
  const customerPay = useComputed$(() => Math.round(Math.round(orderTotal.value * 100) / 2) / 100);
  const companyPay = useComputed$(() => +(orderTotal.value - customerPay.value).toFixed(2));
  const taxLabel = useComputed$(() => {
    if (taxRate.value === undefined) return t("cart.invoice.tax", locale.value);
    const pct = +(taxRate.value * 100).toFixed(3);
    return `${t("cart.invoice.tax", locale.value)} (${empProvince.value} ${pct}%)`;
  });

  const isEmpty = useComputed$(() => cartHydrated.value && cart.items.length === 0);

  const canPlaceOrder = useComputed$(() => {
    if (!empFirstName.value.trim() || !empLastName.value.trim() || !empEmail.value.trim() || !empPhone.value.trim() || !empProvince.value) return false;
    if (!empAddress1.value.trim() || !empCity.value.trim() || !empPostal.value.trim()) return false;
    return cart.items.length > 0;
  });

  const submitOrder = $(async () => {
    if (!canPlaceOrder.value || submitting.value) return;
    formTouched.value = true;
    if (!empFirstName.value || !empLastName.value || !empAddress1.value || !empCity.value || !empPostal.value || !empEmail.value || !empPhone.value || !empProvince.value) {
      formError.value = t("cart.error.required", locale.value);
      return;
    }
    const fmtErrors: string[] = [];
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(empEmail.value.trim())) fmtErrors.push(t("cart.error.email", locale.value));
    const phoneDigits = empPhone.value.replace(/[^\d]/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15 || !/^[\d\s+()\-.]+$/.test(empPhone.value.trim())) fmtErrors.push(t("cart.error.phone", locale.value));
    if (!/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(empPostal.value.trim())) fmtErrors.push(t("cart.error.postal", locale.value));
    if (fmtErrors.length) {
      formError.value = fmtErrors.join("\n");
      return;
    }
    formError.value = "";

    if (!idempotencyKey.value) {
      try {
        idempotencyKey.value = crypto.randomUUID();
      } catch {
        idempotencyKey.value = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
    }

    const device: "mobile" | "tablet" | "desktop" = window.innerWidth <= 600 ? "mobile" : window.innerWidth <= 1024 ? "tablet" : "desktop";
    const orderData = {
      device,
      employee: {
        name: `${empFirstName.value} ${empLastName.value}`,
        email: empEmail.value,
        phone: empPhone.value,
        department: "",
        province: empProvince.value,
        address1: empAddress1.value,
        city: empCity.value,
        postal: empPostal.value,
        po: empPO.value,
      },
      items: cart.items.map((i: any) => ({
        name: i.name || "",
        sku: i.sku || "",
        color: i.color || "",
        size: i.size || "",
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) || 0,
        ...(i.waist ? { waist: i.waist } : {}),
        ...(i.length ? { length: i.length } : {}),
        ...(i.variant ? { variant: i.variant } : {}),
        ...(i.code ? { code: i.code } : {}),
      })),
      date: new Date().toLocaleDateString("en-CA"),
      // Stable per-checkout key so a retry can't duplicate the order/session.
      idempotencyKey: idempotencyKey.value,
    };

    submitting.value = true;

    // Auto-retry until the server returns a redirect (success), then surface a
    // failure. Both transient network drops and server-reported failures are
    // retried — safe because the idempotency key dedupes both the order row and
    // the Stripe session. Covers Turso cold starts and blips while the spinner
    // spins, before we hand off to the card page.
    const MAX_TRIES = 3;
    let v: any = null;
    let lastNetworkErr: any = null;
    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
      try {
        const result = await orderAction.submit(orderData);
        v = result?.value ?? null;
        lastNetworkErr = null;
      } catch (err) {
        lastNetworkErr = err;
        v = null;
        console.error(`Order submit threw (attempt ${attempt}/${MAX_TRIES}):`, err);
      }
      // Success is a redirect URL (Stripe, or the dev/test success page).
      if (v?.redirectUrl) break;
      console.error(`Checkout not confirmed (attempt ${attempt}/${MAX_TRIES}):`, v ?? lastNetworkErr);
      if (attempt < MAX_TRIES) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }

    // Success — hand off to the card page. The cart is cleared on return
    // (/checkout/success), not here, so it survives a cancelled payment.
    if (v?.redirectUrl) {
      window.location.href = v.redirectUrl;
      return;
    }

    // Failure after retries — show the prominent modal.
    let msg = "";
    if (lastNetworkErr) {
      msg = (lastNetworkErr as Error)?.message || t("cart.error.network", locale.value);
    } else {
      msg = v?.message;
      if (!msg && v?.fieldErrors) {
        const flat: string[] = [];
        const walk = (obj: any) => {
          if (Array.isArray(obj)) flat.push(...obj.map(String));
          else if (obj && typeof obj === "object") Object.values(obj).forEach(walk);
        };
        walk(v.fieldErrors);
        msg = flat.join(", ");
      }
      if (!msg && v?.formErrors?.length) msg = v.formErrors.join(", ");
      msg = msg || t("cart.error.failed", locale.value);
    }
    serverError.value = msg;
    showError.value = true;
    console.error("Checkout failed after retries.");
    submitting.value = false;
  });

  return (
    <div class="modal-overlay" onClick$={() => nav("/")}>
      <div class="drawer cart-drawer" onClick$={(e) => e.stopPropagation()}>
        <div class="cart-drawer__site-header">
          <Link href="/" class="site-header__logo">
            <img src={portal.value.logo} alt={portal.value.name} class="site-header__logo-img" width="200" height="200" loading="eager" decoding="sync" />
          </Link>
          <nav class="site-header__nav">
            <button class="cart-btn" onClick$={() => nav("/")}>
              <span class="cart-btn__label">{t("cart.mycart", locale.value)}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
            </button>
          </nav>
        </div>
        <div class="cart-drawer__header">
          <h2 class="cart-drawer__title">{t("cart.title", locale.value)} <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg></h2>
          <button class="modal__close cart-drawer__close-desktop" onClick$={() => nav("/")}>x</button>
        </div>

      {isEmpty.value ? (
        <div class="cart-drawer__empty">
          <p>{t("cart.empty", locale.value)}</p>
          <button type="button" class="cart-drawer__back-link" onClick$={() => nav("/")}>
            {t("cart.backtoapparel", locale.value)}
          </button>
        </div>
      ) : (
        <>
          <div class="cart-drawer__details-step">
            <button class="cart-drawer__back-btn" onClick$={() => nav("/")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
              {t("cart.backtoapparel", locale.value)}
            </button>
            <Collapsible.Root class="cart-drawer__summary" bind:open={summaryOpen}>
              <Collapsible.Trigger class="cart-drawer__checkout-title">
                {t("cart.ordersummary", locale.value)} — {cartCount.value} {cartCount.value !== 1 ? t("cart.items", locale.value) : t("cart.item", locale.value)}
              </Collapsible.Trigger>
              <Collapsible.Content>
                <div class="cart-drawer__summary-list">
                  {cart.items.map((item) => (
                    <div key={`${item.name}-${item.size}`} class="cart-drawer__summary-item">
                      <span>
                        {item.color && item.color.startsWith("#") && <span class="cart-drawer__summary-swatch" style={{ background: item.color }} aria-hidden="true" />}
                        {item.quantity}x {stripColorSuffix(item.name)}{(item.color || item.size) ? ` — ${item.color ? (item.color.startsWith("#") ? colorName(item.color, locale.value) : item.color) : ""}${item.color && item.size ? " / " : ""}${item.size || ""}` : ""}
                      </span>
                      <span>${(((Number(item.price) || 0) * item.quantity)).toFixed(2)}</span>
                    </div>
                  ))}
                  <div class="cart-drawer__summary-item cart-drawer__summary-total">
                    <span>{t("cart.invoice.subtotal", locale.value)}</span>
                    <span>${subtotal.value.toFixed(2)}</span>
                  </div>
                  {empProvince.value ? (
                    <>
                      <div class="cart-drawer__summary-item">
                        <span>{taxLabel.value}</span>
                        <span>${(taxAmount.value ?? 0).toFixed(2)}</span>
                      </div>
                      <div class="cart-drawer__summary-item cart-drawer__summary-total">
                        <span>{t("cart.invoice.total", locale.value)}</span>
                        <span>${orderTotal.value.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div class="cart-drawer__summary-item">
                      <span>+ {t("cart.invoice.tax", locale.value)}</span>
                      <span>—</span>
                    </div>
                  )}
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
            <div class="checkout-modal__form">
              <h3 class="checkout-modal__form-title">{t("cart.orderdetails", locale.value)}</h3>
              <div class="checkout-modal__row">
                <div class={`checkout-modal__field ${formTouched.value && !empFirstName.value ? "checkout-modal__field--error" : ""}`}>
                  <label>{t("cart.firstname", locale.value)}</label>
                  <input type="text" value={empFirstName.value} onInput$={(_, el) => { empFirstName.value = el.value; formError.value = ""; }} />
                </div>
                <div class={`checkout-modal__field ${formTouched.value && !empLastName.value ? "checkout-modal__field--error" : ""}`}>
                  <label>{t("cart.lastname", locale.value)}</label>
                  <input type="text" value={empLastName.value} onInput$={(_, el) => { empLastName.value = el.value; formError.value = ""; }} />
                </div>
              </div>
              <div class={`checkout-modal__field ${formTouched.value && !empAddress1.value ? "checkout-modal__field--error" : ""}`}>
                <label>{t("cart.address", locale.value)}</label>
                <input type="text" autoComplete="street-address" value={empAddress1.value} onInput$={(_, el) => { empAddress1.value = el.value; formError.value = ""; }} />
              </div>
              <div class={`checkout-modal__field ${formTouched.value && !empCity.value ? "checkout-modal__field--error" : ""}`}>
                <label>{t("cart.city", locale.value)}</label>
                <input type="text" autoComplete="address-level2" value={empCity.value} onInput$={(_, el) => { empCity.value = el.value; formError.value = ""; }} />
              </div>
              <div class={`checkout-modal__field ${formTouched.value && !empProvince.value ? "checkout-modal__field--error" : ""}`}>
                <label>{t("cart.province", locale.value)}</label>
                <select required value={empProvince.value} onChange$={(_, el) => { empProvince.value = el.value; formError.value = ""; }}>
                  <option value="" disabled hidden>{locale.value === "fr" ? "Sélectionner…" : "Select…"}</option>
                  <option value="AB">{t("prov.AB", locale.value)}</option>
                  <option value="BC">{t("prov.BC", locale.value)}</option>
                  <option value="MB">{t("prov.MB", locale.value)}</option>
                  <option value="NB">{t("prov.NB", locale.value)}</option>
                  <option value="NL">{t("prov.NL", locale.value)}</option>
                  <option value="NS">{t("prov.NS", locale.value)}</option>
                  <option value="ON">{t("prov.ON", locale.value)}</option>
                  <option value="PE">{t("prov.PE", locale.value)}</option>
                  <option value="QC">{t("prov.QC", locale.value)}</option>
                  <option value="SK">{t("prov.SK", locale.value)}</option>
                </select>
              </div>
              <div class={`checkout-modal__field ${formTouched.value && !empPostal.value ? "checkout-modal__field--error" : ""}`}>
                <label>{t("cart.postal", locale.value)}</label>
                <input type="text" autoComplete="postal-code" value={empPostal.value} onInput$={(_, el) => { empPostal.value = el.value; formError.value = ""; }} />
              </div>
              <div class={`checkout-modal__field ${formTouched.value && !empEmail.value ? "checkout-modal__field--error" : ""}`}>
                <label>{t("cart.email", locale.value)}</label>
                <input type="email" value={empEmail.value} onInput$={(_, el) => { empEmail.value = el.value; formError.value = ""; }} />
              </div>
              <div class={`checkout-modal__field ${formTouched.value && !empPhone.value ? "checkout-modal__field--error" : ""}`}>
                <label>{t("cart.phone", locale.value)}</label>
                <input type="tel" value={empPhone.value} onInput$={(_, el) => { empPhone.value = el.value; formError.value = ""; }} />
              </div>
            </div>

            {/* ---- Payment: 50/50 split ---- */}
            <div class="checkout-modal__pay">
              <h3 class="checkout-modal__form-title">{t("pay.title", locale.value)}</h3>
              <div class="checkout-modal__pay-header">
                <p class="checkout-modal__pay-note">{t("pay.split.note", locale.value)} {companyName.value}</p>
                <span class="checkout-modal__pay-pickup">{t("cart.pickup", locale.value)}</span>
              </div>
              <div class="checkout-modal__split">
                <div class="checkout-modal__split-row">
                  <span class="checkout-modal__split-label">
                    {t("pay.split.paynow", locale.value)}
                    <span class="checkout-modal__split-badge">{t("pay.split.half", locale.value)}</span>
                  </span>
                  <span class="checkout-modal__split-amt">
                    {empProvince.value ? `$${customerPay.value.toFixed(2)}` : "—"}
                  </span>
                </div>
                <div class="checkout-modal__split-row">
                  <span class="checkout-modal__split-label">
                    {t("pay.split.company", locale.value)} {companyName.value}
                    <span class="checkout-modal__split-badge">{t("pay.split.half", locale.value)}</span>
                  </span>
                  <span class="checkout-modal__split-amt checkout-modal__split-amt--muted">
                    {empProvince.value ? `$${companyPay.value.toFixed(2)}` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {formError.value && (
              <div class="cart-drawer__error" role="alert">{formError.value}</div>
            )}
            <div class="cart-drawer__footer">
              <span class="cart-drawer__total">
                {cartCount.value} {cartCount.value !== 1 ? t("cart.items", locale.value) : t("cart.item", locale.value)}{empProvince.value ? ` — $${orderTotal.value.toFixed(2)}` : ` — $${subtotal.value.toFixed(2)} + ${t("cart.invoice.tax", locale.value).toLowerCase()}`}
              </span>
              <button
                class={`btn btn--primary cart-drawer__order-btn ${!canPlaceOrder.value ? "cart-drawer__order-btn--disabled" : ""}`}
                disabled={!canPlaceOrder.value || submitting.value}
                onClick$={submitOrder}
              >
                {submitting.value ? (
                  <>
                    <span class="btn-spinner" aria-hidden="true" />
                    {t("cart.placing", locale.value)}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                    {t("cart.continuepayment", locale.value)}
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Order Failure — as prominent as a confirmation */}
      <Modal.Root bind:show={showError}>
        <Modal.Panel class="modal-overlay">
          <div class="modal order-confirm order-confirm--error">
            <h2 class="order-confirm__title">{t("order.fail.title", locale.value)}</h2>
            <p class="order-confirm__text">{t("order.fail.text", locale.value)}</p>
            <div class="order-confirm__actions">
              <button
                type="button"
                class="btn btn--primary"
                onClick$={() => { showError.value = false; submitOrder(); }}
              >
                {t("order.fail.retry", locale.value)}
              </button>
            </div>
          </div>
        </Modal.Panel>
      </Modal.Root>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Checkout - Synergy Group",
  meta: [{ name: "robots", content: "noindex,nofollow" }],
};
