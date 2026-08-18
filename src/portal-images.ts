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
    "SG-4": { img: "/portals/1370399-as.jpg", imgs: ["/portals/1370399-as.jpg"] },
    "SG-5": { img: "/portals/106674-as.png", imgs: ["/portals/106674-as.png"] },
    "SG-6": { img: "/portals/j7603-as.jpg", imgs: ["/portals/j7603-as.jpg"] },
    "SG-7": { img: "/88194-as.png", imgs: ["/88194-as.png"] },
    "SG-8": { img: "/portals/L00550-as.jpg", imgs: ["/portals/L00550-as.jpg"] },
    "SG-9": { img: "/portals/M748-as.jpg", imgs: ["/portals/M748-as.jpg"] },
    "SG-10": { img: "/portals/L00545-as.jpg", imgs: ["/portals/L00545-as.jpg"] },
    "SG-11": { img: "/portals/L00555-as.jpg", imgs: ["/portals/L00555-as.jpg"] },
    "SG-12": { img: "/portals/L01150-as.jpg", imgs: ["/portals/L01150-as.jpg"] },
    "SG-13": { img: "/portals/L01110-as.jpg", imgs: ["/portals/L01110-as.jpg"] },
    "SG-14": { img: "/portals/110M-as.jpg", imgs: ["/portals/110M-as.jpg"] },
    "SG-15": { img: "/portals/6110NU-as.jpg", imgs: ["/portals/6110NU-as.jpg"] },
    "SG-16": { img: "/portals/M585-as.jpg", imgs: ["/portals/M585-as.jpg"] },
    "SG-17": { img: "/portals/M585L-as.jpg", imgs: ["/portals/M585L-as.jpg"] },
    "SG-18": { img: "/portals/56795-as.jpg", imgs: ["/portals/56795-as.jpg"] },
    "SG-19": { img: "/portals/g8800-as.jpg", imgs: ["/portals/g8800-as.jpg"] },
    "SG-20": { img: "/portals/M723-as.jpg", imgs: ["/portals/M723-as.jpg"] },
    "SG-21": { img: "/portals/88193-as.jpg", imgs: ["/portals/88193-as.jpg"] },
    "SG-22": { img: "/portals/16398-as.png", imgs: ["/portals/16398-as.png"] },
    "SG-23": { img: "/portals/viceball-as.jpg", imgs: ["/portals/viceball-as.jpg"] },
  },
  portal2: {
    "SG-1": { img: "/portals/g2000-cf.jpg", imgs: ["/portals/g2000-cf.jpg"] },
    "SG-2": { img: "/portals/g2300-cf.jpg", imgs: ["/portals/g2300-cf.jpg"] },
    "SG-3": { img: "/portals/g2400-cf.jpg", imgs: ["/portals/g2400-cf.jpg"] },
    "SG-4": { img: "/portals/1370399-cf.jpg", imgs: ["/portals/1370399-cf.jpg"] },
    "SG-5": { img: "/portals/106674-cf.png", imgs: ["/portals/106674-cf.png"] },
    "SG-7": { img: "/88194-cf.png", imgs: ["/88194-cf.png"] },
    "SG-12": { img: "/portals/L01150-cf.webp", imgs: ["/portals/L01150-cf.webp"] },
    "SG-13": { img: "/portals/L01110-cf.jpg", imgs: ["/portals/L01110-cf.jpg"] },
    "SG-8": { img: "/portals/l00550-cf.png", imgs: ["/portals/l00550-cf.png"] },
    "SG-9": { img: "/portals/122307-cf.png", imgs: ["/portals/122307-cf.png"] },
    "SG-10": { img: "/portals/L00545-cf.webp", imgs: ["/portals/L00545-cf.webp"] },
    "SG-11": { img: "/portals/L00555-cf.webp", imgs: ["/portals/L00555-cf.webp"] },
    "SG-6": { img: "/portals/J7603-cf.jpg", imgs: ["/portals/J7603-cf.jpg"] },
    "SG-14": { img: "/portals/110M-cf.jpg", imgs: ["/portals/110M-cf.jpg"] },
    "SG-15": { img: "/portals/6110NU-cf.jpg", imgs: ["/portals/6110NU-cf.jpg"] },
    "SG-16": { img: "/portals/M585-cf.jpg", imgs: ["/portals/M585-cf.jpg"] },
    "SG-17": { img: "/portals/M585L-cf.jpg", imgs: ["/portals/M585L-cf.jpg"] },
    "SG-18": { img: "/portals/56795-cf.jpg", imgs: ["/portals/56795-cf.jpg"] },
    "SG-19": { img: "/portals/g8800-cf.jpg", imgs: ["/portals/g8800-cf.jpg"] },
    "SG-20": { img: "/portals/M723-cf.png", imgs: ["/portals/M723-cf.png"] },
    "SG-21": { img: "/portals/88193-cf.jpg", imgs: ["/portals/88193-cf.jpg"] },
    "SG-22": { img: "/portals/16398-cf.png", imgs: ["/portals/16398-cf.png"] },
  },
  portal3: {
    "SG-1": { img: "/portals/g2000-ws.jpg", imgs: ["/portals/g2000-ws.jpg"] },
    "SG-2": { img: "/portals/2300-ws.jpg", imgs: ["/portals/2300-ws.jpg"] },
    "SG-3": { img: "/portals/g2400-ws.jpg", imgs: ["/portals/g2400-ws.jpg"] },
    "SG-4": { img: "/portals/1370399-ws.jpg", imgs: ["/portals/1370399-ws.jpg"] },
    "SG-5": { img: "/portals/106674-ws.jpg", imgs: ["/portals/106674-ws.jpg"] },
    "SG-6": { img: "/portals/j7603-ws.jpg", imgs: ["/portals/j7603-ws.jpg"] },
    "SG-7": { img: "/88194-ws.png", imgs: ["/88194-ws.png"] },
    "SG-8": { img: "/portals/L00550-ws.jpg", imgs: ["/portals/L00550-ws.jpg"] },
    "SG-9": { img: "/portals/M748-ws.jpg", imgs: ["/portals/M748-ws.jpg"] },
    "SG-10": { img: "/portals/L00545-ws.jpg", imgs: ["/portals/L00545-ws.jpg"] },
    "SG-11": { img: "/portals/L00555-ws.jpg", imgs: ["/portals/L00555-ws.jpg"] },
    "SG-12": { img: "/portals/L01150-ws.jpg", imgs: ["/portals/L01150-ws.jpg"] },
    "SG-13": { img: "/portals/L01110-ws.jpg", imgs: ["/portals/L01110-ws.jpg"] },
    "SG-14": { img: "/portals/110M-ws.jpg", imgs: ["/portals/110M-ws.jpg"] },
    "SG-15": { img: "/portals/6110NU-ws.jpg", imgs: ["/portals/6110NU-ws.jpg"] },
    "SG-16": { img: "/portals/M585-ws.jpg", imgs: ["/portals/M585-ws.jpg"] },
    "SG-17": { img: "/portals/M585L-ws.jpg", imgs: ["/portals/M585L-ws.jpg"] },
    "SG-18": { img: "/portals/56795-ws.jpg", imgs: ["/portals/56795-ws.jpg"] },
    "SG-19": { img: "/portals/g8800-ws.jpg", imgs: ["/portals/g8800-ws.jpg"] },
    "SG-20": { img: "/portals/M723-ws.jpg", imgs: ["/portals/M723-ws.jpg"] },
    "SG-21": { img: "/portals/88193-ws.jpg", imgs: ["/portals/88193-ws.jpg"] },
    "SG-22": { img: "/portals/16398-ws.png", imgs: ["/portals/16398-ws.png"] },
    "SG-23": { img: "/portals/viceball-ws.jpg", imgs: ["/portals/viceball-ws.jpg"] },
  },
  portal4: {
    "SG-1": { img: "/portals/g2000-ps.jpg", imgs: ["/portals/g2000-ps.jpg"] },
    "SG-2": { img: "/portals/g2300-ps.jpg", imgs: ["/portals/g2300-ps.jpg"] },
    "SG-3": { img: "/portals/g2400-ps.jpg", imgs: ["/portals/g2400-ps.jpg"] },
    "SG-4": { img: "/portals/1370399-ps.jpg", imgs: ["/portals/1370399-ps.jpg"] },
    "SG-5": { img: "/portals/106674-ps.png", imgs: ["/portals/106674-ps.png"] },
    "SG-7": { img: "/88194-ps.png", imgs: ["/88194-ps.png"] },
    "SG-12": { img: "/portals/L01150-ps.jpg", imgs: ["/portals/L01150-ps.jpg"] },
    "SG-13": { img: "/portals/L01110-ps.jpg", imgs: ["/portals/L01110-ps.jpg"] },
    "SG-8": { img: "/portals/l00550-ps.png", imgs: ["/portals/l00550-ps.png"] },
    "SG-9": { img: "/portals/122307-ps.png", imgs: ["/portals/122307-ps.png"] },
    "SG-10": { img: "/portals/L00545-ps.webp", imgs: ["/portals/L00545-ps.webp"] },
    "SG-11": { img: "/portals/L00555-ps.webp", imgs: ["/portals/L00555-ps.webp"] },
    "SG-6": { img: "/portals/J7603-ps.jpg", imgs: ["/portals/J7603-ps.jpg"] },
    "SG-14": { img: "/portals/110M-ps.jpg", imgs: ["/portals/110M-ps.jpg"] },
    "SG-15": { img: "/portals/6110NU-ps.jpg", imgs: ["/portals/6110NU-ps.jpg"] },
    "SG-16": { img: "/portals/M585-ps.jpg", imgs: ["/portals/M585-ps.jpg"] },
    "SG-17": { img: "/portals/M585L-ps.jpg", imgs: ["/portals/M585L-ps.jpg"] },
    "SG-18": { img: "/portals/56795-ps.jpg", imgs: ["/portals/56795-ps.jpg"] },
    "SG-19": { img: "/portals/g8800-ps.jpg", imgs: ["/portals/g8800-ps.jpg"] },
    "SG-20": { img: "/portals/M723-ps.jpg", imgs: ["/portals/M723-ps.jpg"] },
    "SG-21": { img: "/portals/88193-ps.jpg", imgs: ["/portals/88193-ps.jpg"] },
    "SG-22": { img: "/portals/16398-ps.png", imgs: ["/portals/16398-ps.png"] },
    "SG-23": { img: "/portals/viceball-ps.jpg", imgs: ["/portals/viceball-ps.jpg"] },
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
