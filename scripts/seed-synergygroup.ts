import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

// Synergy Group Apparel — first batch: the clean "repeat" SKUs from the order
// sheet, reusing the already-optimized Modern Niagara (mn2) / Carmichael (cm)
// product data (names, prices, sizes, colours, material, details, images).
// All 4 portals share these SKUs; per-portal logo image sets are layered on top
// in src/portal-images.ts. The ~14 net-new items from the sheet are held for a
// later batch once their data + images exist.
const rows = [
  { sku: "SG-1", name: "Gildan Short Sleeve T-Shirt - Navy", category: "T-Shirts", sizes: "S - 4XL / LT - 4XLT", colors: ["#2c3e50"], price: 9.5, img: "/sku/tshirt.png", imgs: ["/sku/tshirt.png"], material: "100% US cotton, 18 singles, 6 oz/yd² ", details: "Classic fit, rib collar, taped neck and shoulders, tear-away label, no optical brighteners for consistent dye adherence, #2000 / #2000T" },
  { sku: "SG-2", name: "Gildan Ultra Cotton® Pocket T-Shirt - Black", category: "T-Shirts", sizes: "S - 3XL", colors: [], price: 16, img: "/tshirtblack.png", imgs: ["/tshirtblack.png"], material: "100% cotton", details: "Unisex, Classic fit, Rib collar, Taped neck and shoulders, Left chest pocket, #2300" },
  { sku: "SG-3", name: "Gildan Long Sleeve T-Shirt - Navy", category: "T-Shirts", sizes: "S - 5XL", colors: ["#2c3e50"], price: 19.5, img: "/2400.jpg", imgs: ["/2400.jpg"], material: "100% U.S. cotton, 18 singles, 10.1 oz/L yd (CA)", details: "Classic fit, Classic width rib collar, Taped neck and shoulders, Rib cuffs, Tear away label, #2400" },
  { sku: "SG-4", name: "Men's Under Armour Tech Polo", category: "Polos", sizes: "S - 4XL", colors: ["#2c3e50", "#1a1a18", "#ffffff", "#b8b8b8", "#6b3fa0", "#c0392b", "#1e40af"], price: 65, img: "/uapolomodel.webp", imgs: ["/uapolomodel.webp"], material: "5.3 oz/yd² (US), 8.8 oz/L yd (CA), 100% polyester", details: "Moisture-management properties, Anti-odor technology, Textured fabric that's soft, light and breathable, Self-fabric collar, Three-button placket, #1370399" },
  { sku: "SG-5", name: "Women's Under Armour Tech Polo", category: "Polos", sizes: "XS - 2XL", colors: ["#2c3e50", "#1a1a18", "#ffffff", "#b8b8b8", "#6b3fa0", "#c0392b", "#1e40af"], price: 65, img: "/sku/ua-womens.jpg", imgs: ["/sku/ua-womens.jpg"], material: "5.3 oz/yd² (US), 8.8 oz/L yd (CA), 100% polyester", details: "Moisture-management properties, Anti-odor technology, Textured fabric that's soft, light and breathable, Self-fabric collar, Three-button placket, #1370431" },
  { sku: "SG-6", name: "Flexfit Trucker Ball Cap - Navy", category: "Headwear", sizes: "One Size", colors: ["#2c3e50"], price: 23.5, img: "/swag/cap.png", imgs: ["/swag/cap.png"], material: "Poly/spandex blend with performance mesh back", details: "Mid-profile structured trucker cap, shapeable pre-curved visor, UV protection, moisture wicking, 110 Technology® sweatband, adjustable plastic snapback, grey under visor, #i8502" },
  { sku: "SG-7", name: "Carhartt Flip Toque - Navy", category: "Headwear", sizes: "One Size", colors: ["#2c3e50"], price: 18.5, img: "/sku/toque.png", imgs: ["/sku/toque.png"], material: "100% acrylic rib knit", details: "Stretchy thick knit, fold-up cuff with Carhartt patch, one-size-fits-most, #A18" },
  { sku: "SG-8", name: "Carhartt Winter Jacket - Navy", category: "Jackets", sizes: "S - 4XL", colors: ["#2c3e50"], price: 198.49, img: "/sku/mwinterjacket.png", imgs: ["/sku/mwinterjacket.png", "/sku/winterjacket.png"], material: "12 oz 100% ringspun cotton duck shell, quilted nylon lining, Arctic-weight polyester insulation", details: "Two-way brass zip, pleated bi-swing back, internal rib-knit storm cuffs, four exterior pockets, two interior pockets, triple-stitched seams, #106674" },
  { sku: "SG-9", name: "Men's Cole Harbour Soft Shell Jacket", category: "Jackets", sizes: "XS - 6XL", colors: ["#1a1a18", "#6e6e6e", "#2c3e50"], price: 65, img: "/j7603model.webp", imgs: ["/j7603model.webp", "/sku/mens-jacket.webp"], material: "100% polyester woven soft shell bonded to 100% polyester microfleece", details: "Center front reverse coil zipper, chin guard, princess seams, two front zippered pockets, interior pocket, open cuffs and hem, anti-pill microfleece interior, Port Authority, #J7603" },
  { sku: "SG-10", name: "Women's Cole Harbour Soft Shell Jacket", category: "Jackets", sizes: "XS - 4XL", colors: ["#1a1a18", "#6e6e6e", "#2c3e50"], price: 65, img: "/womensjacket1.webp", imgs: ["/womensjacket1.webp", "/sku/women-jacket.jpg"], material: "100% polyester woven soft shell bonded to 100% polyester microfleece", details: "Center front reverse coil zipper, chin guard, princess seams, two front zippered pockets, interior pocket, open cuffs and hem, anti-pill microfleece interior, Port Authority, #L7603" },
  // Core 365 88194 — net-new item from the order sheet. Base image is the
  // Airtech mockup (placeholder for the other portals until their versions land;
  // per-portal overrides live in src/portal-images.ts).
  { sku: "SG-11", name: "Men's Optimum Short Sleeve Twill Dress Shirt", category: "T-Shirts", sizes: "S - 5XL", colors: ["#1a1a18"], price: 50, img: "/88194-as.png", imgs: ["/88194-as.png"], material: "4.4 oz/yd² / 150 gsm (US), 7.3 oz/L yd (CA), 55/45 cotton/polyester twill", details: "UPF 40+ protection, Button-down collar, Adjustable cuffs, Left-chest pocket, Durable flat-felled side and underarm seams, Back yoke with box pleat, #88194" },
  // Canada Sportswear CSW 24/7 "Vault" L00550 pullover hoodie. Net-new item.
  // TODO: image is a temporary hoodie placeholder — swap for the real Vault
  // shots (bare + per-portal) once provided. Price is the order-sheet figure.
  { sku: "SG-12", name: "Vault Pullover Hooded Sweatshirt - Black", category: "Sweaters", sizes: "XS - 4XL", colors: ["#1a1a18"], price: 30, img: "/pullovermodel.png", imgs: ["/pullovermodel.png"], material: "280 gsm, 8.3 oz/yd² (14 oz/lin. yd), 70% ring-spun combed cotton / 30% polyester fleece (heathers 60/40)", details: "Self-fabric lined hood with drawcord, 100% ring-spun combed cotton face for a superior print surface, Rib-knit cuff and hem, Kangaroo pocket, Tear-away label, #L00550" },
  // Harriton M748 Advantage Snag Protection Plus quarter-zip. Net-new item.
  // Base image is the Powered mockup (placeholder for Airtech/Wired until theirs
  // land); Corflow + Powered overrides live in src/portal-images.ts.
  { sku: "SG-13", name: "Men's Advantage Snag Protection Plus Quarter-Zip Pullover", category: "Sweaters", sizes: "S - 6XL", colors: ["#1a1a18"], price: 50, img: "/portals/122307-ps.png", imgs: ["/portals/122307-ps.png"], material: "6.6 oz/yd² / 225 gsm (US), 11 oz/L yd (CA), 100% polyester jersey", details: "Relaxed fit, Snag-protection-plus fabric resists snags and keeps a smooth look, Moisture-wicking, Antimicrobial odor control, Center-front coil zipper with auto-lock slider, Side vents, UPF 15-39, Tested to 75 industrial washes (AATCC), #M748" },
  // Canada Sportswear CSW 24/7 "Flux" L00545 quarter-zip sweatshirt. Net-new
  // item. Base image is the Powered mockup (placeholder for Airtech/Wired until
  // theirs land); Corflow + Powered overrides live in src/portal-images.ts.
  { sku: "SG-14", name: "Flux Quarter-Zip Sweatshirt - Black", category: "Sweaters", sizes: "XS - 4XL", colors: ["#1a1a18"], price: 35, img: "/portals/L00545-ps.webp", imgs: ["/portals/L00545-ps.webp"], material: "280 gsm, 8.3 oz/yd² (14 oz/lin. yd), 70% ring-spun combed cotton / 30% polyester fleece (heathers 60/40)", details: "100% ring-spun combed cotton face for a superior print surface, Rib-knit cuff and hem, Metal YKK front zipper closure, Tear-away label, #L00545" },
  // Canada Sportswear CSW 24/7 "Surfer" L00555 full-zip hoodie. Net-new item.
  // Base image is the Powered mockup (placeholder for Airtech/Wired until theirs
  // land); Corflow + Powered overrides live in src/portal-images.ts.
  { sku: "SG-15", name: "Surfer Full-Zip Hooded Sweatshirt - Black", category: "Sweaters", sizes: "XS - 4XL", colors: ["#1a1a18"], price: 41, img: "/portals/L00555-ps.webp", imgs: ["/portals/L00555-ps.webp"], material: "280 gsm, 8.3 oz/yd² (14 oz/lin. yd), 70% ring-spun combed cotton / 30% polyester fleece (heathers 60/40)", details: "100% ring-spun combed cotton face for a superior print surface, Self-fabric lined hood with drawcord, Rib-knit cuff and hem, Kangaroo pocket, YKK zipper, Tear-away label, #L00555" },
];

async function main() {
  const url = process.env.TURSO_URL || process.env.VITE_TURSO_URL || "";
  if (!url) throw new Error("No TURSO_URL");
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN || undefined });
  const now = new Date().toISOString();

  // Idempotent: clear any prior synergygroup rows, then insert this batch.
  await db.execute({ sql: "DELETE FROM products WHERE vendor = ?", args: ["synergygroup"] });

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    await db.execute({
      sql: `INSERT INTO products (sku, name, category, sizes, badge, colors, price, img, imgs, material, details, pdf, sort_order, created_at, updated_at, vendor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [r.sku, r.name, r.category, r.sizes, "", JSON.stringify(r.colors), r.price, r.img, JSON.stringify(r.imgs), r.material, r.details, null, i + 1, now, now, "synergygroup"],
    });
  }

  const check = await db.execute({ sql: "SELECT sku, name, category, price FROM products WHERE vendor = ? ORDER BY sort_order", args: ["synergygroup"] });
  console.log(`Inserted ${check.rows.length} synergygroup products:`);
  for (const p of check.rows) console.log(`  ${p.sku} | ${p.name} | ${p.category} | $${p.price}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
