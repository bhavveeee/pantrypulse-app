import fs from "fs";
import path from "path";
import crypto from "crypto";
import zlib from "zlib";

/*
  READ-ONLY stock feed for other Curious apps.
  Source = the exact workbook baked into private/pantrypulse.html (the same data the PantryPulse app
  shows), so it is always in sync with the latest push. Nothing is written anywhere.

  Auth: set STOCK_FEED_KEY in Vercel (Settings -> Environment Variables), then call with
     Authorization: Bearer <STOCK_FEED_KEY>
  If STOCK_FEED_KEY is not set, every request is refused (fail closed).

  GET /api/stock                      -> all households
  GET /api/stock?household=h18        -> one household (id or name, case-insensitive)
  GET /api/stock?in_stock=1           -> only rows with quantity > 0 and not "out"
*/

let CACHE = { embed: null, data: null };

// --- minimal .xlsx reader (zip + XML), no dependencies -------------------------------------
function unzip(buf) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  const n = buf.readUInt16LE(eocd + 10), cd = buf.readUInt32LE(eocd + 16);
  const files = {};
  let p = cd;
  for (let i = 0; i < n; i++) {
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20);
    const nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32);
    const off = buf.readUInt32LE(p + 42), name = buf.toString("utf8", p + 46, p + 46 + nl);
    const lnl = buf.readUInt16LE(off + 26), lel = buf.readUInt16LE(off + 28);
    const data = buf.subarray(off + 30 + lnl + lel, off + 30 + lnl + lel + csize);
    files[name] = () => (method === 8 ? zlib.inflateRawSync(data) : data).toString("utf8");
    p += 46 + nl + el + cl;
  }
  return files;
}
const unxml = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&amp;/g, "&");
function colIdx(ref) { let c = 0; for (const ch of ref.replace(/\d+/g, "")) c = c * 26 + (ch.charCodeAt(0) - 64); return c; }
function readBook(buf) {
  const z = unzip(buf);
  const shared = [];
  if (z["xl/sharedStrings.xml"]) for (const si of z["xl/sharedStrings.xml"]().match(/<si>[\s\S]*?<\/si>/g) || [])
    shared.push(unxml((si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map((t) => t.replace(/<[^>]+>/g, "")).join("")));
  const rels = {};
  for (const r of z["xl/_rels/workbook.xml.rels"]().match(/<Relationship [^>]+>/g) || []) {
    const id = (r.match(/Id="([^"]+)"/) || [])[1], t = (r.match(/Target="([^"]+)"/) || [])[1];
    if (id && t) rels[id] = t.replace(/^\/?xl\//, "").replace(/^\//, "");
  }
  const sheets = {};
  for (const s of z["xl/workbook.xml"]().match(/<sheet [^>]+>/g) || []) {
    const name = unxml((s.match(/name="([^"]+)"/) || [])[1] || ""), rid = (s.match(/r:id="([^"]+)"/) || [])[1];
    const file = "xl/" + rels[rid];
    sheets[name] = () => {
      const rows = {};
      for (const row of z[file]().match(/<row [\s\S]*?<\/row>|<row [^>]*\/>/g) || []) {
        const rn = +(row.match(/ r="(\d+)"/) || [])[1];
        const cells = {};
        for (const c of row.match(/<c [^>]*\/>|<c [\s\S]*?<\/c>/g) || []) {
          const ref = (c.match(/ r="([A-Z]+\d+)"/) || [])[1]; if (!ref) continue;
          const t = (c.match(/ t="([^"]+)"/) || [])[1];
          let v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
          if (t === "s") v = shared[+v];
          else if (t === "inlineStr") v = unxml(((c.match(/<t[^>]*>([\s\S]*?)<\/t>/) || [])[1]) || "");
          else if (t === "str" || t === "e") v = v != null ? unxml(v) : null;
          else if (t === "b") v = v === "1";
          else if (v != null) v = Number(v);
          cells[colIdx(ref)] = v ?? null;
        }
        rows[rn] = cells;
      }
      return rows;
    };
  }
  return sheets;
}
// -------------------------------------------------------------------------------------------

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function load() {
  const html = fs.readFileSync(path.join(process.cwd(), "private", "pantrypulse.html"), "utf8");
  const embed = (html.match(/PP_EMBED::(MASTER_[0-9A-Za-z]+::v21_\d+)/) || [])[1] || "unknown";
  if (CACHE.embed === embed && CACHE.data) return CACHE.data;
  const m = html.match(/window\.__EMBEDDED_WB_B64__\s*=\s*"([A-Za-z0-9+/=]+)"/);
  if (!m) throw new Error("embedded workbook not found");
  const build = (html.match(/const BUILD='([^']+)'/) || [])[1] || null;
  const builtAt = (html.match(/BUILD_TS='(\d{4}-\d\d-\d\dT\d\d:\d\d)'/) || [])[1] || null;
  const book = readBook(Buffer.from(m[1], "base64"));
  const idx = book["Index"]();
  const households = [];
  for (const rn of Object.keys(idx).map(Number).sort((a, b) => a - b)) {
    if (rn < 5) continue;
    const row = idx[rn], tab = row[1], name = row[2], id = row[3];
    if (!tab || !id || !book[String(tab)]) continue;
    const ws = book[String(tab)]();
    const items = [];
    for (const r of Object.keys(ws).map(Number).sort((a, b) => a - b)) {
      if (r < 2) continue;
      const c = ws[r]; if (!c[2]) continue;
      const q = c[3];
      const lu = c[10] ?? c[9];
      items.push({
        category: c[1] ?? null,
        item: String(c[2]),
        quantity: typeof q === "number" ? q : (Number(q) || 0),
        unit: c[4] ?? null,
        status: c[5] ?? null,
        last_updated: lu == null ? null : String(lu).slice(0, 10),
      });
    }
    households.push({ id: String(id), name: String(name || tab), items });
  }
  const data = { source: "pantrypulse", build, built_at_ist: builtAt, embed, households };
  CACHE = { embed, data };
  return data;
}

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") { res.status(405).json({ error: "read-only: GET only" }); return; }
  const key = process.env.STOCK_FEED_KEY;
  if (!key) { res.status(503).json({ error: "feed not configured (STOCK_FEED_KEY unset)" }); return; }
  const auth = String(req.headers.authorization || "");
  const given = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!given || !safeEqual(given, key)) { res.status(401).json({ error: "unauthorized" }); return; }
  try {
    const data = load();
    let hs = data.households;
    const h = String(req.query.household || "").trim().toLowerCase();
    if (h) hs = hs.filter((x) => x.id.toLowerCase() === h || x.name.toLowerCase() === h);
    const inStock = ["1", "true", "yes"].includes(String(req.query.in_stock || "").toLowerCase());
    if (inStock) hs = hs.map((x) => ({ ...x, items: x.items.filter((it) => it.quantity > 0 && it.status !== "out") }));
    res.status(200).json({ ...data, households: hs, count: hs.reduce((a, x) => a + x.items.length, 0) });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
