/**
 * Whiten a product photo's background: flood-fill the light region connected to
 * the image border and paint it pure white. Because it only fills pixels reachable
 * from the edge, it never touches the product or any light detail enclosed by it.
 *
 * Usage: npx tsx scripts/whiten-bg.ts [--threshold N] <file.jpg> [file2.jpg ...]
 * Originals are backed up once to <dir>/_bg-orig/ before overwriting. The matching
 * .webp sibling is regenerated from the whitened pixels.
 */
import sharp from "sharp";
import { existsSync, mkdirSync, copyFileSync, renameSync } from "fs";
import path from "path";

async function whiten(file: string, threshold: number) {
  const dir = path.dirname(file);
  const base = path.basename(file);
  const backupDir = path.join(dir, "_bg-orig");
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  // Back up the original jpg + its webp sibling ONCE (don't clobber a prior backup).
  const webp = file.replace(/\.(jpe?g|png)$/i, ".webp");
  for (const src of [file, webp]) {
    if (existsSync(src)) {
      const bk = path.join(backupDir, path.basename(src));
      if (!existsSync(bk)) copyFileSync(src, bk);
    }
  }

  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const light = (i: number) => data[i] >= threshold && data[i + 1] >= threshold && data[i + 2] >= threshold;
  const visited = new Uint8Array(width * height);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p] || !light(p * channels)) return;
    visited[p] = 1; stack.push(p);
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
  let filled = 0;
  while (stack.length) {
    const p = stack.pop()!;
    const i = p * channels;
    data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
    filled++;
    const x = p % width, y = (p / width) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  const raw = { raw: { width, height, channels } };
  await sharp(data, raw).jpeg({ quality: 90 }).toFile(file + ".tmp");
  renameSync(file + ".tmp", file);
  await sharp(data, raw).webp({ quality: 82 }).toFile(webp);
  console.log(`${base}: filled ${(100 * filled / (width * height)).toFixed(1)}% of pixels -> white (${width}x${height})`);
}

async function main() {
  const args = process.argv.slice(2);
  let threshold = 170;
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--threshold") { threshold = Number(args[++i]); continue; }
    files.push(args[i]);
  }
  if (!files.length) { console.error("no files given"); process.exit(1); }
  console.log(`threshold=${threshold}`);
  for (const f of files) await whiten(f, threshold);
}
main().catch((e) => { console.error(e); process.exit(1); });
