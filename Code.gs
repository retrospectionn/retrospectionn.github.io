// ============================================================
//  FamilyVault — Google Apps Script Backend
//  Paste this entire file into your Apps Script editor
//  Deploy as Web App (Anyone, even anonymous)
// ============================================================

const SHEET_NAME_TRANSACTIONS = "Transactions";
const SHEET_NAME_MEMBERS      = "Members";
const SHEET_NAME_CATEGORIES   = "Categories";
const SHEET_NAME_SETTINGS     = "Settings";

// ── Entry point ──────────────────────────────────────────────
function doGet(e)  { return handle(e); }
function doPost(e) { return handle(e); }

function handle(e) {
  try {
    const params = e.parameter || {};
    const body   = e.postData ? JSON.parse(e.postData.contents || "{}") : {};
    const action = params.action || body.action;
    const result = dispatch(action, params, body);
    return json(result);
  } catch(err) {
    return json({ ok: false, error: err.message });
  }
}

function dispatch(action, p, b) {
  switch(action) {
    // ── READ ──
    case "getData":         return getData();
    case "ping":            return { ok: true, ts: Date.now() };

    // ── TRANSACTIONS ──
    case "addTransaction":  return addTransaction(b.data);
    case "editTransaction": return editTransaction(b.id, b.data);
    case "deleteTransaction": return deleteRow(SHEET_NAME_TRANSACTIONS, b.id);
    case "resetTransactions": return resetTransactions(b.month);

    // ── MEMBERS ──
    case "addMember":       return addMember(b.data);
    case "editMember":      return editMember(b.id, b.data);
    case "deleteMember":    return deleteRow(SHEET_NAME_MEMBERS, b.id);

    // ── CATEGORIES ──
    case "addCategory":     return addCategory(b.data);
    case "editCategory":    return editCategory(b.id, b.data);
    case "deleteCategory":  return deleteRow(SHEET_NAME_CATEGORIES, b.id);

    // ── SETTINGS ──
    case "saveSetting":     return saveSetting(b.key, b.value);

    // ── IMPORT ──
    case "importCSV":       return importCSV(b.rows, b.sheet);

    default:
      throw new Error("Unknown action: " + action);
  }
}

// ── Sheet helpers ─────────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    writeHeaders(sh, name);
  }
  return sh;
}

function writeHeaders(sh, name) {
  const headers = {
    [SHEET_NAME_TRANSACTIONS]: ["id","type","amount","desc","category","memberId","date","notes","month","createdAt"],
    [SHEET_NAME_MEMBERS]:      ["id","name","role","color","isAdmin","pin","createdAt"],
    [SHEET_NAME_CATEGORIES]:   ["id","name","icon","color","budget","createdAt"],
    [SHEET_NAME_SETTINGS]:     ["key","value","updatedAt"],
  };
  if (headers[name]) sh.appendRow(headers[name]);
}

function sheetToObjects(sh) {
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function findRowById(sh, id) {
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1; // 1-indexed
  }
  return -1;
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function newId() {
  return Date.now() + "_" + Math.random().toString(36).slice(2,7);
}

// ── getData ───────────────────────────────────────────────────
function getData() {
  ensureSheets();
  return {
    ok: true,
    transactions: sheetToObjects(getSheet(SHEET_NAME_TRANSACTIONS)),
    members:      sheetToObjects(getSheet(SHEET_NAME_MEMBERS)),
    categories:   sheetToObjects(getSheet(SHEET_NAME_CATEGORIES)),
    settings:     settingsObject(),
  };
}

function settingsObject() {
  const rows = sheetToObjects(getSheet(SHEET_NAME_SETTINGS));
  const obj = {};
  rows.forEach(r => obj[r.key] = r.value);
  return obj;
}

// ── Ensure sheets exist with seed data ───────────────────────
function ensureSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Members
  if (!ss.getSheetByName(SHEET_NAME_MEMBERS)) {
    const sh = ss.insertSheet(SHEET_NAME_MEMBERS);
    writeHeaders(sh, SHEET_NAME_MEMBERS);
    sh.appendRow([newId(),"Admin","Head of Household","p",true,"",""+new Date()]);
  }

  // Categories
  if (!ss.getSheetByName(SHEET_NAME_CATEGORIES)) {
    const sh = ss.insertSheet(SHEET_NAME_CATEGORIES);
    writeHeaders(sh, SHEET_NAME_CATEGORIES);
    const cats = [
      ["house",   "House Payments","🏠","#c9a96e",80000],
      ["edu",     "Education",     "📚","#5c8fad",30000],
      ["util",    "Utilities",     "⚡","#e0935c",20000],
      ["help",    "House Help",    "🧹","#5cad7f",15000],
      ["fuel",    "Fuel",          "⛽","#e05c5c",25000],
      ["grocery", "Groceries",     "🛒","#5cadaa",40000],
      ["health",  "Health",        "🏥","#ad5c8f",15000],
      ["clothes", "Clothing",      "👗","#8f5cad",10000],
      ["dining",  "Dining Out",    "🍽️","#e0c95c",12000],
      ["entertain","Entertainment","🎭","#5c8fad", 8000],
      ["savings", "Savings",       "💰","#5cad7f",50000],
      ["other",   "Other",         "📦","#7a7a7a",10000],
    ];
    cats.forEach(c => sh.appendRow([c[0],c[1],c[2],c[3],c[4],""+new Date()]));
  }

  // Transactions
  if (!ss.getSheetByName(SHEET_NAME_TRANSACTIONS)) {
    const sh = ss.insertSheet(SHEET_NAME_TRANSACTIONS);
    writeHeaders(sh, SHEET_NAME_TRANSACTIONS);
  }

  // Settings
  if (!ss.getSheetByName(SHEET_NAME_SETTINGS)) {
    const sh = ss.insertSheet(SHEET_NAME_SETTINGS);
    writeHeaders(sh, SHEET_NAME_SETTINGS);
    sh.appendRow(["currency","PKR",""+new Date()]);
    sh.appendRow(["activePeriod",currentMonth(),""+new Date()]);
  }
}

function currentMonth() {
  const d = new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
}

// ── Transactions ──────────────────────────────────────────────
function addTransaction(data) {
  const sh = getSheet(SHEET_NAME_TRANSACTIONS);
  const id = newId();
  const now = ""+new Date();
  sh.appendRow([
    id,
    data.type    || "expense",
    data.amount  || 0,
    data.desc    || "",
    data.category|| "",
    data.memberId|| "",
    data.date    || "",
    data.notes   || "",
    data.month   || currentMonth(),
    now,
  ]);
  return { ok: true, id };
}

function editTransaction(id, data) {
  const sh  = getSheet(SHEET_NAME_TRANSACTIONS);
  const row = findRowById(sh, id);
  if (row < 0) throw new Error("Transaction not found: " + id);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  Object.keys(data).forEach(key => {
    const col = headers.indexOf(key) + 1;
    if (col > 0) sh.getRange(row, col).setValue(data[key]);
  });
  return { ok: true };
}

function resetTransactions(month) {
  const sh   = getSheet(SHEET_NAME_TRANSACTIONS);
  const data = sh.getDataRange().getValues();
  // Delete rows (bottom-up) matching month
  for (let i = data.length - 1; i >= 1; i--) {
    if (!month || String(data[i][8]) === String(month)) {
      sh.deleteRow(i + 1);
    }
  }
  return { ok: true };
}

// ── Members ───────────────────────────────────────────────────
function addMember(data) {
  const sh = getSheet(SHEET_NAME_MEMBERS);
  if (sheetToObjects(sh).length >= 7) throw new Error("Maximum 7 members allowed");
  const id  = newId();
  const now = ""+new Date();
  sh.appendRow([id, data.name||"", data.role||"Member", data.color||"p", data.isAdmin||false, data.pin||"", now]);
  return { ok: true, id };
}

function editMember(id, data) {
  const sh  = getSheet(SHEET_NAME_MEMBERS);
  const row = findRowById(sh, id);
  if (row < 0) throw new Error("Member not found: " + id);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  Object.keys(data).forEach(key => {
    const col = headers.indexOf(key) + 1;
    if (col > 0) sh.getRange(row, col).setValue(data[key]);
  });
  return { ok: true };
}

// ── Categories ────────────────────────────────────────────────
function addCategory(data) {
  const sh  = getSheet(SHEET_NAME_CATEGORIES);
  const id  = newId();
  const now = ""+new Date();
  sh.appendRow([id, data.name||"", data.icon||"📦", data.color||"#7a7a7a", data.budget||0, now]);
  return { ok: true, id };
}

function editCategory(id, data) {
  const sh  = getSheet(SHEET_NAME_CATEGORIES);
  const row = findRowById(sh, id);
  if (row < 0) throw new Error("Category not found: " + id);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  Object.keys(data).forEach(key => {
    const col = headers.indexOf(key) + 1;
    if (col > 0) sh.getRange(row, col).setValue(data[key]);
  });
  return { ok: true };
}

// ── Generic delete ────────────────────────────────────────────
function deleteRow(sheetName, id) {
  const sh  = getSheet(sheetName);
  const row = findRowById(sh, id);
  if (row < 0) throw new Error("Row not found: " + id);
  sh.deleteRow(row);
  return { ok: true };
}

// ── Settings ──────────────────────────────────────────────────
function saveSetting(key, value) {
  const sh   = getSheet(SHEET_NAME_SETTINGS);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sh.getRange(i+1, 2).setValue(value);
      sh.getRange(i+1, 3).setValue(""+new Date());
      return { ok: true };
    }
  }
  sh.appendRow([key, value, ""+new Date()]);
  return { ok: true };
}

// ── CSV Import ────────────────────────────────────────────────
function importCSV(rows, sheetTarget) {
  // rows = array of objects matching the sheet schema
  const sheetName = sheetTarget === "members"      ? SHEET_NAME_MEMBERS
                  : sheetTarget === "categories"   ? SHEET_NAME_CATEGORIES
                  : SHEET_NAME_TRANSACTIONS;
  const sh  = getSheet(sheetName);
  const now = ""+new Date();
  let count = 0;
  rows.forEach(row => {
    const id = newId();
    if (sheetTarget === "transactions") {
      sh.appendRow([id, row.type||"expense", row.amount||0, row.desc||"",
                    row.category||"", row.memberId||"", row.date||"",
                    row.notes||"", row.month||currentMonth(), now]);
    } else if (sheetTarget === "members") {
      if (sheetToObjects(sh).length < 7) {
        sh.appendRow([id, row.name||"", row.role||"Member", row.color||"p", false, "", now]);
      }
    } else if (sheetTarget === "categories") {
      sh.appendRow([id, row.name||"", row.icon||"📦", row.color||"#7a7a7a", row.budget||0, now]);
    }
    count++;
  });
  return { ok: true, imported: count };
}
