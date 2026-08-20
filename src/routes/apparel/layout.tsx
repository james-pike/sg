import { component$, Slot, useComputed$ } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import { ProductCatalog } from "../../components/product-catalog/product-catalog";
import { PORTAL_IDS } from "../../portals";
import { verifyPortal } from "../../lib/session";

export const useApparelAuthGuard = routeLoader$(async ({ cookie, redirect, env }) => {
  // ce_auth holds a SIGNED portal id (portal1..portal4); verify the HMAC so a
  // forged cookie can't get in. See src/lib/session.ts.
  const secret = env.get("APP_SESSION_SECRET") || env.get("VITE_APP_SESSION_SECRET") || "sg-dev-insecure-session-secret";
  const portalId = await verifyPortal(cookie.get("ce_auth")?.value, secret);
  if (!portalId || !PORTAL_IDS.includes(portalId)) {
    throw redirect(302, "/?login=1");
  }
});

export default component$(() => {
  const loc = useLocation();
  const isCatalog = useComputed$(() => /^\/apparel\/?$/.test(loc.url.pathname));

  return (
    <div class="apparel-page dot-pattern">
      {isCatalog.value ? (
        <ProductCatalog />
      ) : (
        <Slot />
      )}
    </div>
  );
});
