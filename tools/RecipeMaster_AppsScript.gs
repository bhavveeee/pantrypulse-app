/**
 * PantryPulse <-> Recipe Master bridge  — v2 (fast)
 *
 * WHY v2: v1 read all ~81,700 ingredient rows on EVERY query to build its lookup,
 * which made each call take ~30 seconds. v2 reads only the dish-name column once,
 * caches a compact index, and then fetches just the handful of rows for the matched
 * dish. Typical query drops from ~30s to ~1s (a few seconds on a cold cache).
 *
 * Same contract as v1 — nothing on the PantryPulse side needs to change:
 *   READ  : GET  ?key=SECRET&q=<dish>  -> { q, matches:[{dish, score, rows:[[ing,qty,unit,class],...]}] }
 *   WRITE : POST {key, dish, rows:[[ingredient, perAdultQty, unit, class],...]}
 *   Extra : GET  ?key=SECRET&warm=1    -> rebuilds the cache, returns timing
 *
 * Safety is unchanged: shared secret, append-only, duplicate-dish guard,
 * class whitelist, max 40 rows, never touches any other tab.
 */

var SECRET = 'pp';                 // <-- keep in sync with APPS_KEY in Vercel
var MASTER = 'Recipe Master';
var CACHE_TTL = 21600;             // 6 hours (Apps Script maximum)
var CACHE_PREFIX = 'ppidx_v2_';
var CHUNK = 90000;                 // stay under the 100KB-per-cache-key limit

var DESCRIPTORS = ['homemade','dhaba','style','easy','quick','simple','authentic','restaurant','healthy',
  'special','classic','best','tasty','instant','traditional','famous','desi','veg','the','and','with'];

function _norm(s) {
  s = String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
  return s.split(/\s+/).filter(function (w) { return w.length > 2 && DESCRIPTORS.indexOf(w) < 0; });
}
function _out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Index = [[dishName, startRow, rowCount], ...]
 * Rows for a dish are contiguous in Recipe Master, so we only store where each block begins.
 */
function _buildIndex() {
  var sh = SpreadsheetApp.getActive().getSheetByName(MASTER);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var names = sh.getRange(2, 1, last - 1, 1).getValues();   // ONE column only — this is the speed win
  var idx = [], cur = null, start = 2, count = 0;
  for (var i = 0; i < names.length; i++) {
    var d = String(names[i][0] || '');
    if (d !== cur) {
      if (cur !== null && cur !== '') idx.push([cur, start, count]);
      cur = d; start = i + 2; count = 1;
    } else { count++; }
  }
  if (cur !== null && cur !== '') idx.push([cur, start, count]);
  return idx;
}

function _saveIndex(idx) {
  var cache = CacheService.getScriptCache();
  var json = JSON.stringify(idx);
  var parts = Math.ceil(json.length / CHUNK);
  var map = {};
  for (var i = 0; i < parts; i++) map[CACHE_PREFIX + i] = json.substr(i * CHUNK, CHUNK);
  map[CACHE_PREFIX + 'n'] = String(parts);
  cache.putAll(map, CACHE_TTL);
}

function _loadIndex() {
  var cache = CacheService.getScriptCache();
  var n = cache.get(CACHE_PREFIX + 'n');
  if (n) {
    var keys = [];
    for (var i = 0; i < Number(n); i++) keys.push(CACHE_PREFIX + i);
    var got = cache.getAll(keys), json = '', ok = true;
    for (var j = 0; j < keys.length; j++) {
      if (got[keys[j]] === undefined || got[keys[j]] === null) { ok = false; break; }
      json += got[keys[j]];
    }
    if (ok) { try { return JSON.parse(json); } catch (e) {} }
  }
  var idx = _buildIndex();
  _saveIndex(idx);
  return idx;
}

function _clearIndex() {
  var cache = CacheService.getScriptCache();
  var n = cache.get(CACHE_PREFIX + 'n');
  if (!n) return;
  var keys = [CACHE_PREFIX + 'n'];
  for (var i = 0; i < Number(n); i++) keys.push(CACHE_PREFIX + i);
  cache.removeAll(keys);
}

function doGet(e) {
  var t0 = Date.now();
  if ((e.parameter.key || '') !== SECRET) return _out({ error: 'bad key' });

  if (e.parameter.warm) {                      // pre-warm the cache after an edit
    _clearIndex();
    var idx0 = _loadIndex();
    return _out({ ok: true, dishes: idx0.length, ms: Date.now() - t0 });
  }

  var q = (e.parameter.q || '').trim();
  if (!q) return _out({ error: 'q required' });

  var idx = _loadIndex();
  var qt = _norm(q);
  var scored = [];
  for (var i = 0; i < idx.length; i++) {
    var dt = _norm(idx[i][0]);
    if (!dt.length) continue;
    var inter = 0;
    for (var k = 0; k < dt.length; k++) if (qt.indexOf(dt[k]) >= 0) inter++;
    if (!inter) continue;
    scored.push([inter / Math.max(dt.length, qt.length, 1) + 0.05 * inter, i]);
  }
  scored.sort(function (a, b) { return b[0] - a[0]; });

  var sh = SpreadsheetApp.getActive().getSheetByName(MASTER);
  var top = scored.slice(0, 3).map(function (x) {
    var meta = idx[x[1]];
    // read ONLY this dish's block — a dozen rows, not the whole sheet
    var vals = sh.getRange(meta[1], 1, meta[2], 5).getValues();
    return {
      dish: meta[0],
      score: Math.round(x[0] * 100) / 100,
      rows: vals.map(function (r) { return [r[1], r[2], r[3], r[4]]; })
    };
  });
  return _out({ q: q, matches: top, ms: Date.now() - t0 });
}

function doPost(e) {
  try {
    var b = JSON.parse(e.postData.contents);
    if ((b.key || '') !== SECRET) return _out({ error: 'bad key' });
    var dish = String(b.dish || '').trim();
    var rows = b.rows || [];
    if (!dish || !rows.length || rows.length > 40) return _out({ error: 'bad payload' });

    var CL = ['Hero', 'Base', 'Base-Optional', 'Fat', 'Garnish', 'Optional'];
    var sh = SpreadsheetApp.getActive().getSheetByName(MASTER);

    // duplicate guard via the cached index (fast) instead of re-reading the sheet
    var idx = _loadIndex();
    for (var i = 0; i < idx.length; i++) {
      if (String(idx[i][0]).toLowerCase() === dish.toLowerCase()) {
        return _out({ error: 'dish exists', dish: dish });
      }
    }

    var clean = rows.map(function (r) {
      var q = Number(r[1]);
      return [dish, String(r[0]).slice(0, 60), isFinite(q) ? q : 0,
              String(r[2] || 'g').slice(0, 6), CL.indexOf(r[3]) >= 0 ? r[3] : 'Base'];
    }).filter(function (r) { return r[1]; });

    sh.getRange(sh.getLastRow() + 1, 1, clean.length, 5).setValues(clean);
    _clearIndex();                      // index is stale now; next read rebuilds it
    return _out({ ok: true, appended: clean.length, dish: dish });
  } catch (err) { return _out({ error: String(err) }); }
}
