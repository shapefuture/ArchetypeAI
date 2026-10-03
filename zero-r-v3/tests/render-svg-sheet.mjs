/**
 * Dev tool: rasterises the engine's SVG stickers so they can be eyeballed without a
 * browser. The engine only ever emits polygons (M/L/Z), polylines and circles, so a
 * small PIL-backed painter is enough — gradients and the felt-noise filter are skipped,
 * which costs shading, not shape.
 *
 *   node ./tests/render-svg-sheet.mjs [out.png]
 */
import { build as esbuild } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const out = process.argv[2] ?? path.join(os.tmpdir(), "zero-r-felt-sheet.png");
const bundle = path.join(os.tmpdir(), `zero-r-sheet-${process.pid}.mjs`);
await esbuild({
  entryPoints: { sheet: path.join(root, "tests/felt-probe-entry.ts") },
  outfile: bundle, bundle: true, format: "esm", platform: "node", target: "es2022",
  nodePaths: [path.join(root, "node_modules")],
  alias: { "felt-atelier": path.resolve(root, "../felt-atelier/src") },
  logLevel: "silent",
});
const { PARTS, dnaForPart, dnaForSelf, buildData, toSVG } = await import(new URL("file://" + bundle).href);
fs.rmSync(bundle, { force: true });

// ---- minimal SVG painter -------------------------------------------------------
const python = `
import json, sys
from PIL import Image, ImageDraw
data = json.load(sys.stdin)
img = Image.new("RGBA", (data["w"], data["h"]), tuple(data["bg"]))
d = ImageDraw.Draw(img, "RGBA")
for op in data["ops"]:
    pts = [(round(x), round(y)) for x, y in op["pts"]]
    fill = op["fill"]; stroke = op.get("stroke"); width = max(1, int(round(op.get("width", 1))))
    if op["kind"] == "poly" and len(pts) > 2:
        d.polygon(pts, fill=fill, outline=stroke)
    elif op["kind"] == "line":
        for i in range(len(pts) - 1):
            d.line([pts[i], pts[i + 1]], fill=stroke or fill, width=width)
    elif op["kind"] == "dot" and pts:
        r = max(1, int(round(op["r"]))); x, y = pts[0]
        d.ellipse([x - r, y - r, x + r, y + r], fill=fill)
img.save(data["out"])
`;
const painter = path.join(os.tmpdir(), `zero-r-paint-${process.pid}.py`);

function parse(svg, size) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const [vx, vy, vw, vh] = viewBox;
  const scale = size / Math.max(vw, vh);
  const ox = (size - vw * scale) / 2, oy = (size - vh * scale) / 2;
  const project = (x, y) => [(x - vx) * scale + ox, (y - vy) * scale + oy];
  const hex = (c) => {
    if (!c || c === "none") return null;
    const m = c.replace("#", "");
    if (m.length !== 6) return null;
    const n = parseInt(m, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},255)`;
  };
  const ops = [];
  const alpha = (el) => {
    const a = /opacity="\.?(\d*\.?\d+)"/.exec(el);
    return a ? Number("0." + (a[1].length === 1 ? a[1] + "0" : a[1])) : 1;
  };
  for (const el of svg.match(/<(path|circle)[^>]*>/g) ?? []) {
    if (/filter=/.test(el)) continue; // the felt-noise overlay: shading only
    if (/url\(#/.test(el)) continue; // gradient overlays
    const a = alpha(el);
    if (a < 0.4) continue;
    if (el.startsWith("<circle")) {
      const cx = +/cx="([^"]+)"/.exec(el)[1], cy = +/cy="([^"]+)"/.exec(el)[1], r = +/r="([^"]+)"/.exec(el)[1];
      ops.push({ kind: "dot", pts: [project(cx, cy)], r: r * scale, fill: hex((/fill="([^"]+)"/.exec(el) ?? [])[1]) });
      continue;
    }
    const dAttr = / d="([^"]+)"/.exec(el)[1];
    const fill = hex((/fill="([^"]+)"/.exec(el) ?? [])[1]);
    const stroke = hex((/stroke="([^"]+)"/.exec(el) ?? [])[1]);
    const width = Math.max(1, (Number((/stroke-width="([^"]+)"/.exec(el) ?? [0, "1"])[1]) || 0.002) * scale);
    for (const sub of dAttr.split("M").filter(Boolean)) {
      const pts = sub.replace(/Z$/, "").split("L").map((p) => p.trim().split(/[\s,]+/).map(Number)).map(([x, y]) => project(x, y));
      if (pts.length < 2) continue;
      ops.push({ kind: sub.includes("Z") && fill ? "poly" : "line", pts, fill, stroke, width });
    }
  }
  return ops;
}

async function paint(svg, file, size, bg) {
  fs.writeFileSync(painter, python);
  const payload = JSON.stringify({ w: size, h: size, bg, out: file, ops: parse(svg, size) });
  const { execFileSync } = await import("node:child_process");
  execFileSync("python3", [painter], { input: payload });
}

// ---- build the sheet -----------------------------------------------------------
const CELL = 260, COLS = 3;
const items = [];
for (const part of PARTS) items.push({ label: part.name, data: buildData(dnaForPart(part), { lod: "map" }) });
items.push({ label: "Self", data: buildData(dnaForSelf(), { lod: "map" }) });
items.push({ label: "The Planner · hero", data: buildData(dnaForPart(PARTS[0]), { lod: "hero" }) });

const dir = path.join(os.tmpdir(), `zero-r-cells-${process.pid}`);
fs.mkdirSync(dir, { recursive: true });
const files = [];
for (const [i, item] of items.entries()) {
  const file = path.join(dir, `cell-${i}.png`);
  await paint(toSVG(item.data.flat, { id: `c${i}` }), file, CELL, [20, 18, 26, 255]);
  files.push({ file, label: item.label });
}
fs.writeFileSync(painter + ".json", JSON.stringify({ files, out, cols: COLS, cell: CELL, labels: files.map((f) => f.label) }));

const montage = `
import json
from PIL import Image, ImageDraw
cfg = json.load(open("${painter}.json"))
cols, cell, pad = cfg["cols"], cfg["cell"], 26
rows = (len(cfg["files"]) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (cell + pad) + pad, rows * (cell + pad + 22) + pad), (20, 18, 26))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(cfg["files"]):
    im = Image.open(f["file"]).convert("RGBA")
    x = pad + (i % cols) * (cell + pad); y = pad + (i // cols) * (cell + pad + 22)
    sheet.paste(im, (x, y), im)
    d.text((x + 4, y + cell + 4), cfg["labels"][i], fill=(220, 214, 230))
sheet.save(cfg["out"])
print(cfg["out"])
`;
const montageFile = path.join(os.tmpdir(), `zero-r-montage-${process.pid}.py`);
fs.writeFileSync(montageFile, montage);
const { execFileSync } = await import("node:child_process");
console.log(execFileSync("python3", [montageFile]).toString().trim());
fs.rmSync(painter, { force: true });
fs.rmSync(painter + ".json", { force: true });
fs.rmSync(montageFile, { force: true });
fs.rmSync(dir, { recursive: true, force: true });
