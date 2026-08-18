// 4-portal configuration.
//
// Each portal is a separate "brand" a user can log into from the login page.
// All portals share the SAME product catalog and SKUs — only the branding
// (header logo + wordmark) and the per-SKU product images differ per portal.
//
// PLACEHOLDER CONTENT: replace `name`, `sub`, and the logo files in
// public/portals/<id>.svg with the real brand names + logos. Passwords are read
// from env vars (PORTAL1_PASSWORD … PORTAL4_PASSWORD) in layout.tsx `useLogin`;
// a dev fallback (the portal id) is used when the env var is unset.

export interface Portal {
  /** Stable id — also the value stored in the auth cookie and the key used for
   *  per-portal product images (see portal-images.ts). */
  id: string;
  /** Primary wordmark line shown next to the header logo. */
  name: string;
  /** Secondary wordmark line. */
  sub: string;
  /** Header / login logo image (in /public). */
  logo: string;
  /** Optional split header lockup: a standalone square symbol (`headerMark`) and
   *  a separate wordmark (`headerWord`). When set, the header renders the symbol
   *  to the LEFT of the wordmark, and on mobile stacks the wordmark above the
   *  APPAREL tag so both match the symbol's height. Only the header uses these —
   *  login tiles + footer keep `logo`. */
  headerMark?: string;
  headerWord?: string;
  /** Accent colour used for the portal tile + selected states. */
  accent: string;
  /** Set when the logo is light/white and needs a dark backdrop to be visible
   *  (e.g. a reversed/knockout logo). */
  dark?: boolean;
  /** Full-bleed field photo shown behind the login when this portal is
   *  selected (scraped from the company's own site). */
  hero: string;
}

export const PORTALS: Portal[] = [
  { id: "portal1", name: "Airtech", sub: "Synergy", logo: "/portals/portal1.png", headerMark: "/airtech-mark.png", headerWord: "/airtech-word.png", accent: "#1f6fb2", dark: true, hero: "/airtech-hero.webp" },
  // All logos are reversed to white on a dark tile (matching Airtech), so every
  // portal is dark:true. Corflow's hero is a placeholder (its site is down).
  { id: "portal2", name: "Corflow", sub: "Synergy", logo: "/corflow-reversed.png", headerMark: "/corflow-mark.png", headerWord: "/corflow-word.png", accent: "#ae1f2a", dark: true, hero: "/airtech-chillers.webp" },
  { id: "portal4", name: "Powered", sub: "Synergy", logo: "/powered-reversed.png", headerMark: "/powered-mark.png", headerWord: "/powered-word.png", accent: "#d9a441", dark: true, hero: "/powered-hero.webp" },
  { id: "portal3", name: "Wired", sub: "Synergy", logo: "/wired-logo-white-text.png", headerMark: "/wired-mark.png", headerWord: "/wired-word.png", accent: "#4f8a4d", dark: true, hero: "/wired-hero.webp" },
];

export const PORTAL_IDS = PORTALS.map((p) => p.id);

export const DEFAULT_PORTAL = PORTALS[0];

/** Resolve a portal by id, falling back to the first portal. */
export function getPortal(id?: string | null): Portal {
  return PORTALS.find((p) => p.id === id) ?? DEFAULT_PORTAL;
}

/** Full brand name for titles/metadata, e.g. "Corflow Synergy Apparel". */
export function portalBrand(id?: string | null): string {
  const p = getPortal(id);
  return `${p.name} ${p.sub} Apparel`;
}
