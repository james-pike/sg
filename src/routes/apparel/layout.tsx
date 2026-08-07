import { component$, Slot, useComputed$ } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import { ProductCatalog } from "../../components/product-catalog/product-catalog";
import { PORTAL_IDS } from "../../portals";

export const useApparelAuthGuard = routeLoader$(({ cookie, redirect }) => {
  // sg stores the portal id (portal1..portal4) in ce_auth; a valid portal
  // cookie means the user is signed in. (The old MN values were
  // "authenticated"/"clothing"/"tech"/"safety" — different auth model.)
  const val = cookie.get("ce_auth")?.value;
  if (!val || !PORTAL_IDS.includes(val)) {
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
