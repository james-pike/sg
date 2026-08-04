// Per-portal product image overrides.
//
// All 4 portals share the same SKUs, names and prices — but each portal can show
// its OWN image(s) for any SKU. Fill in overrides here, keyed by portal id then
// SKU. Anything not listed falls back to the default image from products.ts, so
// this map can start empty and be filled portal-by-portal / sku-by-sku later.
//
//   PORTAL_SKU_IMAGES = {
//     portal2: {
//       "MN-7": { img: "/portals/portal2/sku/winter.png",
//                 imgs: ["/portals/portal2/sku/winter.png", "/portals/portal2/sku/winter-back.png"] },
//     },
//   }
//
// `img` overrides the card / primary image; `imgs` overrides the gallery. You
// can set either or both.

export interface PortalImageOverride {
  img?: string;
  imgs?: string[];
}

export const PORTAL_SKU_IMAGES: Record<string, Record<string, PortalImageOverride>> = {
  portal1: {},
  portal2: {},
  portal3: {},
  portal4: {},
};

import { allProducts, type Product } from "./routes/apparel/products";

/** Return a copy of `p` with its image(s) swapped for the given portal's
 *  overrides. Falls back to the product's default images when there's no
 *  override, so this is safe to call unconditionally. */
export function portalizeProduct(p: Product, portalId?: string | null): Product {
  const ov = portalId ? PORTAL_SKU_IMAGES[portalId]?.[p.sku] : undefined;
  if (!ov) return p;
  return { ...p, img: ov.img ?? p.img, imgs: ov.imgs ?? p.imgs };
}

/** The full catalog with every product's images resolved for `portalId`. */
export function portalProducts(portalId?: string | null): Product[] {
  return allProducts.map((p) => portalizeProduct(p, portalId));
}
