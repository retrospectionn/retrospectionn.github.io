// ============================================================
//  FamilyVault — Google Apps Script Backend  v2.1 (FIXED)
//
//  ROOT CAUSE OF "Unknown action: undefined":
//  When a browser POSTs to Apps Script, Google issues a redirect.
//  The browser follows the redirect but drops the POST body,
//  so e.postData becomes null and action is never read.
//
//  THE FIX: The PWA now sends ALL requests as GET with the
//  action and payload encoded directly in the URL query string.
//  GET requests are never redirected by Google Apps Script.
//
//  REDEPLOY STEPS (required after any code change):
//  1. Paste this whole file into the Apps Script editor
//  2. Click Save (Ctrl+S)
//  3. Click Deploy → New Deployment
//  4. Type: Web app | Execute as: Me | Access: Anyone
//  5. Click Deploy → copy the new Web App URL
//  6. Paste the new URL into FamilyVault → Settings
// ============================================================

const SHEET_TRANSACTIONS = "Transactions";
const SHEET_MEMBERS      = "Members";
const SHEET_CATEGORIES   = "Categories";
const SHEET_SETTINGS     = "Settings";

// ─── Entry point (GET only — POST kept as fallback) ──────────
function doGet(e) {
  return handle(e);
}

function doPost(e) {
  return handle(e);
}

function handle(e) {
  const params   = e.parameter || {};
  const callback = params.callback; // JSONP callback name (e.g. _fv_cb_123)

  try {
    // Action is always in the URL: ?action=getData
    const action = params.action;

    // Payload is the JSON body passed as ?payload=encoded-json
    let body = {};
    if (params.payload) {
      try {
        body = JSON.parse(decodeURIComponent(params.payload));
      } catch (parseErr) {
        throw new Error("Invalid payload JSON: " + parseErr.message);
      }
    } else if (e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (_) {}
    }

    if (!action) throw new Error("No action specified in URL params");

    const result = dispatch(action, body);
    return respond(result, callback);

  } catch (err) {
    return respond({ ok: false, error: err.message }, callback);
  }
}

function dispatch(action, b) {
  switch (action) {
    case "ping":               return { ok: true, ts: Date.now() };
    case "getData":            return getData();

    case "addTransaction":     return addTransaction(b.data);
    case "editTransaction":    return editTransaction(b.id, b.data);
    case "deleteTransaction":  return deleteById(SHEET_TRANSACTIONS, b.id);
    case "resetTransactions":  return resetTransactions(b.month);

    case "addMember":          return addMember(b.data);
    case "editMember":         return editMember(b.id, b.data);
    case "deleteMember":       return deleteById(SHEET_MEMBERS, b.id);

    case "addCategory":        return addCategory(b.data);
    case "editCategory":       return editCategory(b.id, b.data);
    case "deleteCategory":     return deleteById(SHEET_CATEGORIES, b.id);

    case "saveSetting":        return saveSetting(b.key, b.value);
    case "importCSV":          return importCSV(b.rows, b.sheet);

    default:
      throw new Error("Unknown action: " + action);
  }
}

// ─── Response helper — supports both plain JSON and JSONP ─────
// When a ?callback=fnName param is present (JSONP request from browser),
// wrap the JSON in fnName(...) so the browser executes it.
// This bypasses CORS entirely — the browser treats it as a script, not XHR.
function respond(data, callback) {
  const json = JSON.stringify(data);
  if (callback) {
    // JSONP: return JavaScript that calls the callback
    return ContentService
      .createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  // Plain JSON (for direct URL testing in browser)
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Utilities ───────────────────────────────────────────────
function uid() {
  return Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

function now() {
  return new Date().toString();
}

function ym() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

// ─── Sheet helpers ───────────────────────────────────────────
function sheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    const HEADERS = {
      [SHEET_TRANSACTIONS]: ["id","type","amount","desc","category","memberId","date","notes","month","createdAt"],
      [SHEET_MEMBERS]:      ["id","name","role","color","isAdmin","pin","createdAt"],
      [SHEET_CATEGORIES]:   ["id","name","icon","color","budget","createdAt"],
      [SHEET_SETTINGS]:     ["key","value","updatedAt"],
    };
    if (HEADERS[name]) sh.appendRow(HEADERS[name]);
  }
  return sh;
}

function toObjects(sh) {
  const vals = sh.getDataRange().getValues();
  if (vals.length < 2) return [];
  const headers = vals[0];
  return vals.slice(1).map(row => {
    const o = {};
    headers.forEach((h, i) => { o[h] = row[i]; });
    return o;
  });
}

function rowOf(sh, id) {
  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(id)) return i + 1; // 1-indexed
  }
  return -1;
}

function setFields(sh, rowNum, data) {
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  Object.keys(data).forEach(key => {
    const col = headers.indexOf(key) + 1;
    if (col > 0) sh.getRange(rowNum, col).setValue(data[key]);
  });
}

// ─── Bootstrap sheets on first run ───────────────────────────
function ensureSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss.getSheetByName(SHEET_MEMBERS)) {
    const sh = sheet(SHEET_MEMBERS);
    sh.appendRow([uid(), "Admin", "Head of Household", "p", true, "", now()]);
  }

  if (!ss.getSheetByName(SHEET_CATEGORIES)) {
    const sh = sheet(SHEET_CATEGORIES);
    [
      ["house",     "House Payments", "🏠", "#c9a96e", 80000],
      ["edu",       "Education",      "📚", "#5c8fad", 30000],
      ["util",      "Utilities",      "⚡", "#e0935c", 20000],
      ["help",      "House Help",     "🧹", "#5cad7f", 15000],
      ["fuel",      "Fuel",           "⛽", "#e05c5c", 25000],
      ["grocery",   "Groceries",      "🛒", "#5cadaa", 40000],
      ["health",    "Health",         "🏥", "#ad5c8f", 15000],
      ["clothes",   "Clothing",       "👗", "#8f5cad", 10000],
      ["dining",    "Dining Out",     "🍽️", "#e0c95c", 12000],
      ["entertain", "Entertainment",  "🎭", "#5c8fad",  8000],
      ["savings",   "Savings",        "💰", "#5cad7f", 50000],
      ["other",     "Other",          "📦", "#7a7a7a", 10000],
    ].forEach(c => sh.appendRow([c[0], c[1], c[2], c[3], c[4], now()]));
  }

  if (!ss.getSheetByName(SHEET_TRANSACTIONS)) sheet(SHEET_TRANSACTIONS);

  if (!ss.getSheetByName(SHEET_SETTINGS)) {
    const sh = sheet(SHEET_SETTINGS);
    sh.appendRow(["currency",     "PKR",  now()]);
    sh.appendRow(["activePeriod", ym(),   now()]);
  }
}

// ─── getData ─────────────────────────────────────────────────
function getData() {
  ensureSheets();
  const settingsRows = toObjects(sheet(SHEET_SETTINGS));
  const settings = {};
  settingsRows.forEach(r => { settings[r.key] = r.value; });

  return {
    ok:           true,
    transactions: toObjects(sheet(SHEET_TRANSACTIONS)),
    members:      toObjects(sheet(SHEET_MEMBERS)),
    categories:   toObjects(sheet(SHEET_CATEGORIES)),
    settings,
  };
}

// ─── Transactions ─────────────────────────────────────────────
function addTransaction(d) {
  if (!d) throw new Error("Missing transaction data");
  const sh = sheet(SHEET_TRANSACTIONS);
  const id = uid();
  sh.appendRow([
    id,
    d.type     || "expense",
    d.amount   || 0,
    d.desc     || "",
    d.category || "",
    d.memberId || "",
    d.date     || "",
    d.notes    || "",
    d.month    || ym(),
    now(),
  ]);
  return { ok: true, id };
}

function editTransaction(id, d) {
  if (!id) throw new Error("Missing transaction id");
  if (!d)  throw new Error("Missing transaction data");
  const sh  = sheet(SHEET_TRANSACTIONS);
  const row = rowOf(sh, id);
  if (row < 0) throw new Error("Transaction not found: " + id);
  setFields(sh, row, d);
  return { ok: true };
}

function resetTransactions(month) {
  const sh   = sheet(SHEET_TRANSACTIONS);
  const vals = sh.getDataRange().getValues();
  for (let i = vals.length - 1; i >= 1; i--) {
    if (!month || String(vals[i][8]) === String(month)) sh.deleteRow(i + 1);
  }
  return { ok: true };
}

// ─── Members ──────────────────────────────────────────────────
function addMember(d) {
  if (!d) throw new Error("Missing member data");
  const sh = sheet(SHEET_MEMBERS);
  if (toObjects(sh).length >= 7) throw new Error("Maximum 7 members allowed");
  const id = uid();
  sh.appendRow([id, d.name || "", d.role || "Member", d.color || "p", d.isAdmin || false, d.pin || "", now()]);
  return { ok: true, id };
}

function editMember(id, d) {
  if (!id) throw new Error("Missing member id");
  if (!d)  throw new Error("Missing member data");
  const sh  = sheet(SHEET_MEMBERS);
  const row = rowOf(sh, id);
  if (row < 0) throw new Error("Member not found: " + id);
  setFields(sh, row, d);
  return { ok: true };
}

// ─── Categories ───────────────────────────────────────────────
function addCategory(d) {
  if (!d) throw new Error("Missing category data");
  const sh = sheet(SHEET_CATEGORIES);
  const id = uid();
  sh.appendRow([id, d.name || "", d.icon || "📦", d.color || "#7a7a7a", d.budget || 0, now()]);
  return { ok: true, id };
}

function editCategory(id, d) {
  if (!id) throw new Error("Missing category id");
  if (!d)  throw new Error("Missing category data");
  const sh  = sheet(SHEET_CATEGORIES);
  const row = rowOf(sh, id);
  if (row < 0) throw new Error("Category not found: " + id);
  setFields(sh, row, d);
  return { ok: true };
}

// ─── Generic delete ───────────────────────────────────────────
function deleteById(sheetName, id) {
  if (!id) throw new Error("Missing id for delete");
  const sh  = sheet(sheetName);
  const row = rowOf(sh, id);
  if (row < 0) throw new Error("Row not found: " + id);
  sh.deleteRow(row);
  return { ok: true };
}

// ─── Settings ─────────────────────────────────────────────────
function saveSetting(key, value) {
  if (!key) throw new Error("Missing key");
  const sh   = sheet(SHEET_SETTINGS);
  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0] === key) {
      sh.getRange(i + 1, 2).setValue(value);
      sh.getRange(i + 1, 3).setValue(now());
      return { ok: true };
    }
  }
  sh.appendRow([key, value, now()]);
  return { ok: true };
}

// ─── CSV Import ───────────────────────────────────────────────
function importCSV(rows, target) {
  if (!rows || !rows.length) throw new Error("No rows to import");
  const shName =
    target === "members"    ? SHEET_MEMBERS    :
    target === "categories" ? SHEET_CATEGORIES :
    SHEET_TRANSACTIONS;

  const sh = sheet(shName);
  let count = 0;

  rows.forEach(r => {
    const id = uid();
    if (target === "transactions") {
      sh.appendRow([id, r.type||"expense", r.amount||0, r.desc||"",
                    r.category||"", r.memberId||"", r.date||"",
                    r.notes||"", r.month||ym(), now()]);
    } else if (target === "members" && toObjects(sh).length < 7) {
      sh.appendRow([id, r.name||"", r.role||"Member", r.color||"p", false, "", now()]);
    } else if (target === "categories") {
      sh.appendRow([id, r.name||"", r.icon||"📦", r.color||"#7a7a7a", r.budget||0, now()]);
    }
    count++;
  });

  return { ok: true, imported: count };
}
