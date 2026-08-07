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
  // portal1 = Airtech, portal2 = Corflow, portal3 = Wired, portal4 = Powered.
  portal1: {
    "SG-1": { img: "/portals/g2000-as.jpg", imgs: ["/portals/g2000-as.jpg"] },
    "SG-2": { img: "/portals/g2300-as.jpg", imgs: ["/portals/g2300-as.jpg"] },
    "SG-3": { img: "/portals/g2400-as.jpg", imgs: ["/portals/g2400-as.jpg"] },
    "SG-11": { img: "/88194-as.png", imgs: ["/88194-as.png"] },
  },
  portal2: {
    "SG-1": { img: "/portals/g2000-cf.jpg", imgs: ["/portals/g2000-cf.jpg"] },
    "SG-2": { img: "/portals/g2300-cf.jpg", imgs: ["/portals/g2300-cf.jpg"] },
    "SG-3": { img: "/portals/g2400-cf.jpg", imgs: ["/portals/g2400-cf.jpg"] },
    "SG-11": { img: "/88194-cf.png", imgs: ["/88194-cf.png"] },
    "SG-12": { img: "/portals/l00550-cf.png", imgs: ["/portals/l00550-cf.png"] },
    "SG-13": { img: "/portals/122307-cf.png", imgs: ["/portals/122307-cf.png"] },
    "SG-14": { img: "/portals/L00545-cf.webp", imgs: ["/portals/L00545-cf.webp"] },
    "SG-15": { img: "/portals/L00555-cf.webp", imgs: ["/portals/L00555-cf.webp"] },
  },
  portal3: {
    "SG-1": { img: "/portals/g2000-ws.jpg", imgs: ["/portals/g2000-ws.jpg"] },
    "SG-2": { img: "/portals/g2300-ws.jpg", imgs: ["/portals/g2300-ws.jpg"] },
    "SG-3": { img: "/portals/g2400-ws.jpg", imgs: ["/portals/g2400-ws.jpg"] },
    "SG-11": { img: "/88194-ws.png", imgs: ["/88194-ws.png"] },
  },
  portal4: {
    "SG-1": { img: "/portals/g2000-ps.jpg", imgs: ["/portals/g2000-ps.jpg"] },
    "SG-2": { img: "/portals/g2300-ps.jpg", imgs: ["/portals/g2300-ps.jpg"] },
    "SG-3": { img: "/portals/g2400-ps.jpg", imgs: ["/portals/g2400-ps.jpg"] },
    "SG-11": { img: "/88194-ps.png", imgs: ["/88194-ps.png"] },
    "SG-12": { img: "/portals/l00550-ps.png", imgs: ["/portals/l00550-ps.png"] },
    "SG-13": { img: "/portals/122307-ps.png", imgs: ["/portals/122307-ps.png"] },
    "SG-14": { img: "/portals/L00545-ps.webp", imgs: ["/portals/L00545-ps.webp"] },
    "SG-15": { img: "/portals/L00555-ps.webp", imgs: ["/portals/L00555-ps.webp"] },
  },
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
