/**
 * PantryPulse <-> "final recipes" bridge  — v4
 *
 * NEW SOURCE: the "final recipes" Google Sheet
 *   Sheet ID : 1GRg8DatwihrcQEZqtjBi4eIG2OI6SZWIN-q0EvDxlcM
 *   Tab "Dish breakdown" (gid 1292717284):
 *       A dish name | B yt link | C source of breakdown | D ingridient | E quantity for 1 person
 *   Tab "Dish overview" (gid 0): dish name | youtube link   (1,411 dishes)
 *
 * WHAT CHANGED vs v2/v3: the recipe LINK is now read from column B of every breakdown row
 * and returned as `link` on each match, so the handover shows the EXACT link from the sheet
 * instead of falling back to a YouTube search. Ingredient rows come from the same tab.
 *
 * Contract (unchanged on the PantryPulse side):
 *   READ : GET ?key=SECRET&q=<dish> -> { q, matches:[{dish, score, link, rows:[[ing,qty,unit,class],...]}] }
 *   Extra: GET ?key=SECRET&warm=1   -> rebuild the cache
 *
 * Deploy: bind this script to the "final recipes" spreadsheet (Extensions -> Apps Script),
 * deploy as Web App (execute as me, anyone with link), and put the /exec URL into Vercel APPS_URL.
 */

var SECRET = 'pp';                      // keep in sync with APPS_KEY in Vercel
var TAB    = 'Dish breakdown';
var CACHE_TTL = 21600;
var CACHE_PREFIX = 'ppidx_v4_';
var CHUNK = 90000;

var DESCRIPTORS = ['homemade','dhaba','style','easy','quick','simple','authentic','restaurant','healthy',
  'special','classic','best','tasty','instant','traditional','famous','desi','veg','the','and','with'];

function _norm(s) {
  s = String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
  return s.split(/\s+/).filter(function (w) { return w.length > 2 && DESCRIPTORS.indexOf(w) < 0; });
}
function _out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** "40 g" -> [40,'g'];  "1" -> [1,'pc'];  "a pinch" -> [1,'pinch'];  "3-4" -> [4,'pc'] (upper bound) */
function _parseQty(s) {
  s = String(s || '').trim().toLowerCase();
  if (!s) return [0, 'g'];
  if (/pinch/.test(s)) return [1, 'pinch'];
  var m = s.match(/([\d.]+)\s*-\s*([\d.]+)\s*([a-z]*)/);            // range -> upper
  if (m) return [Number(m[2]), m[3] || 'pc'];
  m = s.match(/([\d.]+)\s*([a-z]+)?/);
  if (!m) return [0, 'g'];
  var u = (m[2] || 'pc');
  if (u === 'gm' || u === 'gms' || u === 'grams' || u === 'gram') u = 'g';
  if (u === 'litre' || u === 'liter' || u === 'l') u = 'ml';
  if (u === 'nos' || u === 'no' || u === 'piece' || u === 'pieces' || u === 'pcs') u = 'pc';
  return [Number(m[1]), u];
}

/** Index = [[dishName, startRow, rowCount, link], ...]  — dish rows are contiguous */
function _buildIndex() {
  var sh = SpreadsheetApp.getActive().getSheetByName(TAB);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, 2).getValues();          // dish name + link only
  var idx = [], cur = null, start = 2, count = 0, link = '';
  for (var i = 0; i < vals.length; i++) {
    var d = String(vals[i][0] || '').trim();
    if (d !== cur) {
      if (cur !== null && cur !== '') idx.push([cur, start, count, link]);
      cur = d; start = i + 2; count = 1; link = String(vals[i][1] || '').trim();
    } else { count++; if (!link) link = String(vals[i][1] || '').trim(); }
  }
  if (cur !== null && cur !== '') idx.push([cur, start, count, link]);
  return idx;
}
function _saveIndex(idx) {
  var cache = CacheService.getScriptCache(), json = JSON.stringify(idx), parts = Math.ceil(json.length / CHUNK), map = {};
  for (var i = 0; i < parts; i++) map[CACHE_PREFIX + i] = json.substr(i * CHUNK, CHUNK);
  map[CACHE_PREFIX + 'n'] = String(parts);
  cache.putAll(map, CACHE_TTL);
}
function _loadIndex() {
  var cache = CacheService.getScriptCache(), n = cache.get(CACHE_PREFIX + 'n');
  if (n) {
    var keys = []; for (var i = 0; i < Number(n); i++) keys.push(CACHE_PREFIX + i);
    var got = cache.getAll(keys), json = '', ok = true;
    for (var j = 0; j < keys.length; j++) { if (got[keys[j]] == null) { ok = false; break; } json += got[keys[j]]; }
    if (ok) { try { return JSON.parse(json); } catch (e) {} }
  }
  var idx = _buildIndex(); _saveIndex(idx); return idx;
}
function _clearIndex() {
  var cache = CacheService.getScriptCache(), n = cache.get(CACHE_PREFIX + 'n');
  if (!n) return;
  var keys = [CACHE_PREFIX + 'n']; for (var i = 0; i < Number(n); i++) keys.push(CACHE_PREFIX + i);
  cache.removeAll(keys);
}

function doGet(e) {
  var t0 = Date.now();
  if ((e.parameter.key || '') !== SECRET) return _out({ error: 'bad key' });
  if (e.parameter.warm) { _clearIndex(); var idx0 = _loadIndex(); return _out({ ok: true, dishes: idx0.length, ms: Date.now() - t0 }); }

  var q = (e.parameter.q || '').trim();
  if (!q) return _out({ error: 'q required' });

  var idx = _loadIndex(), qt = _norm(q), scored = [];
  for (var i = 0; i < idx.length; i++) {
    var dt = _norm(idx[i][0]); if (!dt.length) continue;
    var inter = 0; for (var k = 0; k < dt.length; k++) if (qt.indexOf(dt[k]) >= 0) inter++;
    if (!inter) continue;
    scored.push([inter / Math.max(dt.length, qt.length, 1) + 0.05 * inter, i]);
  }
  scored.sort(function (a, b) { return b[0] - a[0]; });

  var sh = SpreadsheetApp.getActive().getSheetByName(TAB);
  var top = scored.slice(0, 3).map(function (x) {
    var meta = idx[x[1]];
    var vals = sh.getRange(meta[1], 1, meta[2], 5).getValues();   // this dish's block only
    return {
      dish : meta[0],
      score: Math.round(x[0] * 100) / 100,
      link : meta[3] || '',                                        // <-- the EXACT link from the sheet
      rows : vals.map(function (r) { var pq = _parseQty(r[4]); return [String(r[3] || '').trim(), pq[0], pq[1], 'Base']; })
                 .filter(function (r) { return r[0]; })
    };
  });
  return _out({ q: q, matches: top, ms: Date.now() - t0 });
}
