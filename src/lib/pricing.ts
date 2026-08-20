/**
 * Authoritative catalog pricing. The server MUST price orders from here, never
 * from the client-supplied `price` on a cart line (which a tampered request can
 * set to anything). Also the single source of truth for the PDP's Tall upcharge.
 */
import { allProducts } from "../routes/apparel/products";

/** Tall-variant upcharges, keyed by SKU (base price otherwise). */
export const TALL_PRICE: Record<string, number> = {
  "SG-1": 18,
  "SG-20": 99.99,
  "SG-24": 139.99,
};

const PRICE_BY_SKU: Record<string, number> = Object.fromEntries(
  allProducts.map((p) => [p.sku, Number(p.price) || 0]),
);

/**
 * Catalog unit price for a cart line. Returns null for an unknown SKU so the
 * caller can reject the order rather than charging a made-up amount.
 */
export function unitPrice(sku: string | null | undefined, variant?: string | null): number | null {
  if (!sku || !(sku in PRICE_BY_SKU)) return null;
  if (variant === "Tall" && TALL_PRICE[sku] != null) return TALL_PRICE[sku];
  return PRICE_BY_SKU[sku];
}
