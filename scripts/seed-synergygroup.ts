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
  { sku: "SG-1", name: "Gildan Short Sleeve T-Shirt", category: "T-Shirts", sizes: "S - 4XL / LT - 4XLT", colors: ["#1a1a18"], price: 9.5, img: "/sku/tshirt.png", imgs: ["/sku/tshirt.png"], material: "100% US cotton, 18 singles, 6 oz/yd² ", details: "Classic fit, rib collar, taped neck and shoulders, tear-away label, no optical brighteners for consistent dye adherence, #2000 / #2000T" },
  { sku: "SG-2", name: "Gildan Ultra Cotton® Pocket T-Shirt", category: "T-Shirts", sizes: "S - 3XL", colors: ["#1a1a18"], price: 16, img: "/tshirtblack.png", imgs: ["/tshirtblack.png"], material: "100% cotton", details: "Unisex, Classic fit, Rib collar, Taped neck and shoulders, Left chest pocket, #2300" },
  { sku: "SG-3", name: "Gildan Long Sleeve T-Shirt", category: "T-Shirts", sizes: "S - 5XL", colors: ["#1a1a18"], price: 19.5, img: "/2400.jpg", imgs: ["/2400.jpg"], material: "100% U.S. cotton, 18 singles, 10.1 oz/L yd (CA)", details: "Classic fit, Classic width rib collar, Taped neck and shoulders, Rib cuffs, Tear away label, #2400" },
  { sku: "SG-4", name: "Men's Under Armour Tech Polo", category: "Polos", sizes: "S - 4XL", colors: ["#1a1a18"], price: 65, img: "/portals/1370399-as.jpg", imgs: ["/portals/1370399-as.jpg"], material: "5.3 oz/yd² (US), 8.8 oz/L yd (CA), 100% polyester", details: "Moisture-management properties, Anti-odor technology, Textured fabric that's soft, light and breathable, Self-fabric collar, Three-button placket, #1370399" },
  { sku: "SG-8", name: "Carhartt Winter Jacket - Black", category: "Jackets", sizes: "S - 4XL", colors: ["#1a1a18"], price: 198.49, img: "/portals/106674-as.png", imgs: ["/portals/106674-as.png"], material: "12 oz 100% ringspun cotton duck shell, quilted nylon lining, Arctic-weight polyester insulation", details: "Two-way brass zip, pleated bi-swing back, internal rib-knit storm cuffs, four exterior pockets, two interior pockets, triple-stitched seams, #106674" },
  { sku: "SG-9", name: "Men's Cole Harbour Soft Shell Jacket", category: "Jackets", sizes: "XS - 6XL", colors: ["#1a1a18"], price: 65, img: "/j7603model.webp", imgs: ["/j7603model.webp", "/sku/mens-jacket.webp"], material: "100% polyester woven soft shell bonded to 100% polyester microfleece", details: "Center front reverse coil zipper, chin guard, princess seams, two front zippered pockets, interior pocket, open cuffs and hem, anti-pill microfleece interior, Port Authority, #J7603" },
  // Core 365 88194 — net-new item from the order sheet. Base image is the
  // Airtech mockup (placeholder for the other portals until their versions land;
  // per-portal overrides live in src/portal-images.ts).
  { sku: "SG-11", name: "Men's Optimum Short Sleeve Twill Dress Shirt", category: "Polos", sizes: "S - 5XL", colors: ["#1a1a18"], price: 50, img: "/88194-as.png", imgs: ["/88194-as.png"], material: "4.4 oz/yd² / 150 gsm (US), 7.3 oz/L yd (CA), 55/45 cotton/polyester twill", details: "UPF 40+ protection, Button-down collar, Adjustable cuffs, Left-chest pocket, Durable flat-felled side and underarm seams, Back yoke with box pleat, #88194" },
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
  // CX2 Hi-Vis "Scout" L01150 hi-vis vest. No per-portal logo — one shared
  // image for all four portals (no portal-images.ts overrides).
  // TODO: swap /L01150-black.webp for a logo-free version (current file carries
  // the Powered logo).
  { sku: "SG-16", name: "Scout Hi-Vis Zipper Front Vest", category: "Safety", sizes: "S - 4XL", colors: ["#1a1a18"], price: 25, img: "/L01150-black.webp", imgs: ["/L01150-black.webp"], material: "130 gsm, 3.8 oz/yd² (6.5 oz/lin yd), 100% polyester tricot knit", details: "Mesh panel on upper back for ventilation, 4 front storage pockets, Radio-clip straps on front shoulders, YKK zipper closure, Durable binding, 4\" contrast hi-vis tape with 2\" reflective tape front and back, Meets CSA standards, #L01150" },
  // CX2 Champion L01110 heavy-duty insulated bomber. Net-new item. Base image is
  // the Airtech mockup (placeholder for Wired until theirs lands); Airtech +
  // Corflow + Powered overrides live in src/portal-images.ts.
  { sku: "SG-17", name: "Champion Heavy Duty Insulated Bomber Jacket", category: "Jackets", sizes: "S - 5XL", colors: ["#1a1a18"], price: 179, img: "/portals/L01110-as.jpg", imgs: ["/portals/L01110-as.jpg"], material: "275 gsm, 8.1 oz/yd² (13.5 oz/lin yd), 100% polyester oxford (3000 mm waterproof, wind-resistant, water-repellent); 3M Thinsulate insulation — 200 gsm body, 170 gsm sleeves", details: "Detachable, adjustable hood, Inner fleece storm cuffs with gusset, Adjustable double-snap outer cuffs, Double overlapping storm-flap placket, Zippered patch pockets, Sleeve pencil pocket, Two inner chest pockets, #L01110" },
  // Flexfit 110M "110® Mesh-Back Cap". Net-new item. Base image is the Airtech
  // mockup (placeholder for Wired until theirs lands); Airtech + Corflow +
  // Powered overrides live in src/portal-images.ts.
  { sku: "SG-18", name: "Flexfit 110® Mesh-Back Cap", category: "Headwear", sizes: "One Size", colors: ["#1a1a18"], price: 22.04, img: "/portals/110M-as.jpg", imgs: ["/portals/110M-as.jpg"], material: "74/26 polyester/cotton; Mélange colors are 80/19/1 polyester/rayon/PU spandex", details: "Structured, six-panel, mid-profile, Permacurv® visor, silver undervisor, Flexfit® Tech + snapback closure, #110M" },
  // Flexfit 6110NU "NU® Adjustable Cap". Net-new item. Base image is the Airtech
  // mockup (placeholder for Wired until theirs lands); Airtech + Corflow +
  // Powered overrides live in src/portal-images.ts.
  { sku: "SG-19", name: "Flexfit NU® Adjustable Cap", category: "Headwear", sizes: "One Size", colors: ["#1a1a18"], price: 27.28, img: "/portals/6110NU-as.jpg", imgs: ["/portals/6110NU-as.jpg"], material: "79/18/3 polyester/rayon/PU spandex", details: "FLEXFIT THE ONE AND ONLY ORIGINAL®, Reimagined Flexfit® Baseball cap, ACTIVEGUARD™ Technology, Flexfit® Technology, Cool & Dry Technology, Structured, six-panel, mid profile, Permacurv® visor, YP four-bar logo placed on the wearer's right side of the cap, Flexfit® Tech + snapback closure, #6110NU" },
  // Harriton M585 "Advantage IL Short Sleeve Work Shirt". Net-new item. Base
  // image is the Airtech mockup (placeholder for Wired until theirs lands);
  // Airtech + Corflow + Powered overrides live in src/portal-images.ts.
  { sku: "SG-20", name: "Men's Advantage IL Short Sleeve Work Shirt", category: "Polos", sizes: "S - 5XL", colors: ["#1a1a18"], price: 55, img: "/portals/M585-as.jpg", imgs: ["/portals/M585-as.jpg"], material: "4.5 oz/yd²/155 gsm (US), 7.4 oz./L yd (CA), 55% cotton, 45% polyester twill", details: "Tested to 50 industrial washes in accordance with AATCC industry standards, Wrinkle resistant fabric properties for a crisp, polished look, Stain release fabric properties allows stains to detach during washing, Structured collar stand with integrated collar stays, Button-down collar, Dyed-to-match pearl buttons, Double chest pockets with button closures and pen slot, Left-chest zippered pocket at placket, Side vents, Carbon neutral style in partnership with Green Story third party verified carbon offset program, #M585" },
  // Harriton M585L "Advantage IL Workshirt" (long sleeve). Net-new item. Base
  // image is the Airtech mockup (placeholder for Wired until theirs lands);
  // Airtech + Corflow + Powered overrides live in src/portal-images.ts.
  { sku: "SG-21", name: "Men's Advantage IL Workshirt", category: "Polos", sizes: "S - 5XL", colors: ["#1a1a18"], price: 59, img: "/portals/M585L-as.jpg", imgs: ["/portals/M585L-as.jpg"], material: "4.5 oz./yd²/155 gsm (US), 7.5 oz./L yd (CA), 55% cotton, 45% polyester twill", details: "Tested to 50 industrial washes in accordance with AATCC industry standards, Wrinkle resistant fabric properties for a crisp, polished look, Stain release fabric properties allows stains to detach during washing, Structured collar stand with integrated collar stays, Button-down collar, Double chest pockets with button closures and pen slot, Left-chest zippered pocket at placket, Carbon neutral style in partnership with Green Story third party verified carbon offset program, #M585L" },
  // Sportsman SP12FL 12" Fleece Lined Cuffed Beanie (alphabroder item #56795 —
  // the image filenames use that number). Net-new item. Base image is the
  // Airtech mockup (placeholder for Wired until theirs lands); Airtech + Corflow
  // + Powered overrides live in src/portal-images.ts.
  { sku: "SG-22", name: "Sportsman 12\" Fleece Lined Cuffed Beanie", category: "Headwear", sizes: "One Size", colors: ["#1a1a18"], price: 11.78, img: "/portals/56795-as.jpg", imgs: ["/portals/56795-as.jpg"], material: "100% acrylic exterior, Black 100% polyester fleece lining", details: "12\" cuffed knit beanie, Fleece lined for warmth, One size fits most, #SP12FL" },
  // Trimark M-MAXSON Softshell Jacket (style #19534). Net-new item. Base image is
  // the Airtech mockup (placeholder for Wired until theirs lands); Airtech +
  // Corflow + Powered overrides live in src/portal-images.ts.
  { sku: "SG-23", name: "Men's Maxson Softshell Jacket", category: "Jackets", sizes: "S - 5XL", colors: ["#1a1a18"], price: 90, img: "/portals/19534-as.webp", imgs: ["/portals/19534-as.webp"], material: "270 g/m² (8 oz/yd²), 100% polyester mechanical-stretch woven bonded to 100% polyester anti-pill microfleece with waterproof (8000 mm) breathable membrane and water-repellent finish; 100% polyester brushed tricot lining", details: "Three-layer waterproof, breathable construction, Articulated elbows and ergonomic sleeves, Centre-front exposed contrast reverse-coil zipper with interior zipper flap, Polyester brushed tricot upper storm flap, Lower welt pockets with coil zipper, Adjustable cuff tabs with hook-and-loop closure, Easy-grip zipper pull, Contrast hanger loop at inside back neck, Heat-transfer tagless label, Warmth Level 1 (10°C to -5°C), #19534" },
  // Gildan 8800 DryBlend® unisex polo. Net-new item. Base image is the Airtech
  // mockup (placeholder for Wired until theirs lands); Airtech + Corflow +
  // Powered overrides live in src/portal-images.ts.
  { sku: "SG-24", name: "Gildan Unisex DryBlend® Polo", category: "Polos", sizes: "S - 5XL", colors: ["#1a1a18"], price: 17.24, img: "/portals/g8800-as.jpg", imgs: ["/portals/g8800-as.jpg"], material: "6 oz./yd² (US), 10 oz./L yd (CA), 52/48 ring-spun cotton/polyester knit, 20 singles", details: "Moisture-wicking DryBlend® ring-spun cotton/poly blend, Modern classic fit, Contoured welt collar and cuffs, Clean-finished placket with dyed-to-match buttons, Tear-away label, #8800" },
  // Trimark M-STIRLING short-sleeve woven work dress shirt (style #17745). Net-new
  // item. Base image is the Airtech mockup (placeholder for Wired until theirs
  // lands); Airtech + Corflow + Powered overrides live in src/portal-images.ts.
  { sku: "SG-26", name: "Men's Stirling Short Sleeve Work Shirt", category: "Polos", sizes: "S - 5XL", colors: ["#1a1a18"], price: 54, img: "/portals/17745-as.webp", imgs: ["/portals/17745-as.webp"], material: "65% polyester, 35% combed cotton woven twill, 145 g/m² (4.3 oz/yd²)", details: "Button-down shirt collar, Contrast inner yoke, Centre-back box pleat, Flat-felled seams, Back yoke, Upper patch pocket, Left-chest pocket, #17745" },
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
