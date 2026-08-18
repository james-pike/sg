import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

// ONE-TIME migration — reconciles the synergygroup catalog to the 23-item order
// sheet, then renumbers SG-1..SG-23 contiguously:
//   • REMOVE the 3 items not on the sheet: Maxson (SG-19), Stirling (SG-21),
//     Wilshire (SG-23).
//   • RE-ADD the Vice Pro Plus golf balls (dropped in c7570a7) as the last item.
//   • Keep the two shirt additions (Operate #88193, Dade #M-DADE).
//   • Renumber survivors, in catalog order, to SG-1..SG-23 (sort_order 1..23).
//
// Guarded so it can't corrupt an already-migrated DB: it aborts unless SG-19 /
// SG-21 / SG-23 still hold Maxson / Stirling / Wilshire. Run once:
//   npx tsx scripts/finalize-synergy-catalog.ts
//
// Keys that move (mirror these in src/portal-images.ts + product-catalog.tsx):
//   SG-20→SG-19 (DryBlend), SG-24→SG-20 (ClimaBloc), SG-25→SG-21 (Operate),
//   SG-26→SG-22 (Dade), new Vice golf balls → SG-23.
const db = createClient({
  url: process.env.TURSO_URL || process.env.VITE_TURSO_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN || undefined,
});

// Vice Pro Plus golf balls — recovered from the pre-drop catalog (commit c7570a7).
// TODO: price is a placeholder ($0, as it was before) — set the real order-sheet
// figure before launch (a $0 item is orderable for free through checkout).
const GOLF = {
  name: "Vice Pro Plus Golf Balls (12)",
  category: "Accessories",
  sizes: "Box of 12",
  badge: "",
  colors: JSON.stringify([]),
  price: 0,
  img: "/portals/viceball-cf.png",
  imgs: JSON.stringify(["/portals/viceball-cf.png"]),
  material: "",
  details: "Box of 12 custom-printed Vice Pro Plus golf balls",
  pdf: null as string | null,
};

async function main() {
  const cur = await db.execute("SELECT * FROM products WHERE vendor='synergygroup' ORDER BY sort_order ASC");
  const rows = cur.rows as any[];

  // Guard: only run against the un-migrated state.
  const bySku = Object.fromEntries(rows.map((r) => [r.sku, r]));
  const guard: [string, string][] = [["SG-19", "Maxson"], ["SG-21", "Stirling"], ["SG-23", "Wilshire"]];
  for (const [sku, needle] of guard) {
    if (!bySku[sku] || !String(bySku[sku].name).includes(needle)) {
      throw new Error(`Aborting: ${sku} is not "${needle}" (already migrated or unexpected state). No changes made.`);
    }
  }

  const REMOVE = new Set(["SG-19", "SG-21", "SG-23"]); // Maxson, Stirling, Wilshire
  const survivors = rows.filter((r) => !REMOVE.has(r.sku)); // already in sort_order

  // Final ordered list: survivors (catalog order) then the golf balls.
  const finalRows = [
    ...survivors.map((r) => ({
      name: r.name, category: r.category, sizes: r.sizes, badge: r.badge ?? "",
      colors: r.colors ?? "[]", price: r.price, img: r.img, imgs: r.imgs ?? "[]",
      material: r.material ?? "", details: r.details ?? "", pdf: r.pdf ?? null,
    })),
    { ...GOLF },
  ];

  const now = new Date().toISOString();
  await db.execute({ sql: "DELETE FROM products WHERE vendor='synergygroup'", args: [] });
  for (let i = 0; i < finalRows.length; i++) {
    const p = finalRows[i];
    const sku = `SG-${i + 1}`;
    await db.execute({
      sql: `INSERT INTO products (vendor, sku, name, category, sizes, badge, colors, price, img, imgs, material, details, pdf, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["synergygroup", sku, p.name, p.category, p.sizes, p.badge, p.colors, p.price, p.img, p.imgs, p.material, p.details, p.pdf, i + 1, now, now],
    });
  }

  const check = await db.execute("SELECT sku, name, category, price, sort_order FROM products WHERE vendor='synergygroup' ORDER BY sort_order");
  console.log(`synergygroup finalized: ${check.rows.length} products`);
  for (const r of check.rows) console.log(`  ${String(r.sort_order).padStart(2)} | ${r.sku} | ${r.category} | $${r.price} | ${r.name}`);
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
