// Guards the two failure modes that each shipped a fully dead toolset while
// `node --check` stayed green on every individual file:
//
//  1. CROSS-SCRIPT COLLISION. converts.js and app.js are classic <script> tags
//     sharing ONE global lexical scope. A top-level `const`/`let`/`class` in both
//     is a parse-time SyntaxError that aborts ALL of app.js -- including the
//     TOOLS merge and the dropzone wiring.
//
//  2. DEAD WIRING. Even with both scripts alive, if `TOOLS[tool]` is missing or
//     the dropzone is absent, app.js skips the whole bootstrap silently. The page
//     renders, the static "Drop a file here, or click to browse" label stays, and
//     clicking does nothing -- with no visible error anywhere.
//
// So this test loads both files into one shared context, seeded with each page's
// REAL static markup, then asserts the page was actually wired up.
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const dir = process.argv[2] || ".";
let pass = 0, fail = 0;
const ok = (m) => { console.log("  ok   " + m); pass++; };
const bad = (m) => { console.log("  FAIL " + m); fail++; };

// Elements are memoised per id, so the stub has stable identity and mutations
// made by app.js are observable afterwards. A stub that returns a fresh object
// per getElementById cannot assert anything about rendered output.
function makeDoc(seed = {}) {
  const byId = new Map();
  const listeners = new Map();

  function el(id) {
    if (byId.has(id)) return byId.get(id);
    const node = {
      id, dataset: {}, style: {}, children: [], childNodes: [], value: "",
      checked: false, disabled: false, textContent: "", innerHTML: "",
      files: [], className: "", hidden: false, attrs: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      addEventListener(ev) {
        if (!listeners.has(id)) listeners.set(id, []);
        listeners.get(id).push(ev);
      },
      removeEventListener() {},
      appendChild(c) { return c; }, removeChild(c) { return c; },
      setAttribute(k, v) { node.attrs[k] = v; }, removeAttribute(k) { delete node.attrs[k]; },
      getAttribute(k) { return k in node.attrs ? node.attrs[k] : null; },
      hasAttribute(k) { return k in node.attrs; },
      querySelector() { return null; }, querySelectorAll() { return []; },
      closest() { return null; }, focus() {}, click() {}, remove() {},
      getBoundingClientRect() { return { width: 800, height: 600, top: 0, left: 0 }; },
      scrollIntoView() {}, insertBefore(c) { return c; }, replaceChildren() {},
      getContext() { return null; }, toBlob(cb) { cb(null); },
    };
    if (id in seed) node.textContent = seed[id];
    byId.set(id, node);
    return node;
  }

  const body = el("body");
  const doc = {
    body, readyState: "complete", documentElement: el("html"),
    getElementById: (id) => el(id),
    querySelector: () => el("__qs"),
    querySelectorAll: () => [],
    createElement: (t) => el("__ce_" + t),
    createTextNode: () => ({}),
    addEventListener(ev, fn) { if (ev === "DOMContentLoaded") fn(); },
    removeEventListener() {},
    createObjectURL: () => "blob:x", revokeObjectURL() {}, execCommand: () => true,
    __el: el, __listeners: listeners, __byId: byId,
  };
  return doc;
}

function makeSandbox(doc) {
  const sb = {
    document: doc, console, setTimeout, clearTimeout, setInterval, clearInterval,
    navigator: { userAgent: "node", onLine: true, clipboard: {} },
    location: { href: "https://cybernovaworks.store/tools/swapfile/", origin: "https://cybernovaworks.store" },
    URL: { createObjectURL: () => "blob:x", revokeObjectURL() {} },
    Blob: class {}, File: class {},
    FileReader: class { readAsDataURL() {} readAsArrayBuffer() {} addEventListener() {} },
    FormData: class { append() {} }, Image: class { set src(v) {} },
    fetch: () => Promise.reject(new Error("offline")),
    alert() {}, confirm: () => true, prompt: () => null,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    performance: { now: () => 0 }, crypto: { getRandomValues: (a) => a },
    atob: (s) => Buffer.from(s, "base64").toString("binary"),
    btoa: (s) => Buffer.from(s, "binary").toString("base64"),
    TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, DataView, SharedArrayBuffer,
    Math, JSON, Date, Promise, Error, Object, Array, String, Number, Boolean, RegExp,
    Map, Set, Symbol, Proxy, Reflect, parseInt, parseFloat, isNaN, isFinite,
    encodeURIComponent, decodeURIComponent, Intl, WeakMap, WeakSet, BigInt, Function,
    TypeError, RangeError, SyntaxError, ReferenceError, queueMicrotask,
  };
  sb.window = sb; sb.self = sb; sb.globalThis = sb; sb.top = sb; sb.parent = sb;
  return sb;
}

function boot(tool, seed) {
  const doc = makeDoc(seed);
  doc.body.dataset = { tool };
  const ctx = vm.createContext(makeSandbox(doc));
  for (const f of ["converts.js", "app.js"]) {
    vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), ctx, { filename: f });
  }
  return { ctx, doc };
}

const pages = fs.readdirSync(dir)
  .filter((f) => f.endsWith(".html") && !/^(index|home-tools)\.html$/.test(f));

// --- 1. both scripts must coexist in one global scope ---
console.log("-- shared global scope --");
let probe;
try {
  probe = boot("trimvideo", {});
  ok("converts.js + app.js load together in one global scope");
} catch (e) {
  bad(`app.js died loading after converts.js: ${e.constructor.name}: ${e.message}`);
  console.log("       duplicate top-level const/let/class in the two files causes this");
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(1);
}

// --- 2. the registry merge ---
console.log("\n-- registry merge --");
const reg = vm.runInContext(
  "typeof EXTRA_TOOLS !== 'undefined' ? Object.keys(EXTRA_TOOLS).length : 0", probe.ctx);
reg === 57 ? ok(`EXTRA_TOOLS published with ${reg} tools`) : bad(`EXTRA_TOOLS has ${reg}, expected 57`);

const keys = vm.runInContext("Object.keys(TOOLS)", probe.ctx);
keys.length === 66 ? ok(`merged TOOLS has all ${keys.length} tools`)
                   : bad(`merged TOOLS has ${keys.length}, expected 66`);

const noConv = vm.runInContext(
  "Object.entries(TOOLS).filter(([k,v]) => typeof v.convert !== 'function').map(([k]) => k)",
  probe.ctx);
noConv.length === 0 ? ok("every registered tool has a callable convert()")
                    : bad(`no convert(): ${noConv.join(", ")}`);

// --- 3. THE USER-VISIBLE SYMPTOM: each page must be really wired ---
// Seed each page's real static markup, load, then require that app.js replaced
// the generic placeholder and attached the click handler.
console.log("\n-- every page is actually wired (not just rendered) --");
const STALE = "Drop a file here, or click to browse";
let unwired = [], staleLabel = [], noHandler = [], vacuous = [];

for (const f of pages) {
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  const m = /data-tool="([^"]*)"/.exec(html);
  if (!m) { unwired.push(`${f}: no data-tool`); continue; }
  const tool = m[1];
  if (!keys.includes(tool)) { unwired.push(`${f}: '${tool}' not in TOOLS`); continue; }

  // seed the static placeholder exactly as the page ships it
  const staticLabel = /id="dropLabel"[^>]*>([^<]*)</.exec(html);
  const seeded = staticLabel ? staticLabel[1] : "";
  const expected = vm.runInContext(`TOOLS[${JSON.stringify(tool)}].dropLabel`, probe.ctx);

  if (!expected) { unwired.push(`${f}: tool has no dropLabel`); continue; }
  if (seeded === expected) vacuous.push(f); // assertion below would prove nothing

  const { doc } = boot(tool, { dropLabel: seeded, dropHint: "" });

  const label = doc.__el("dropLabel").textContent;
  if (label !== expected) staleLabel.push(`${f}: showing "${label}"`);
  if (!(doc.__listeners.get("dropzone") || []).includes("click")) noHandler.push(f);
}

unwired.length === 0
  ? ok(`all ${pages.length} pages resolve to a real tool`)
  : bad(`unresolved: ${unwired.join("; ")}`);

staleLabel.length === 0
  ? ok(`all ${pages.length} pages replace the static "${STALE}" placeholder`)
  : bad(`still showing the static label on ${staleLabel.length}: ${staleLabel.slice(0, 3).join("; ")}`);

noHandler.length === 0
  ? ok(`all ${pages.length} dropzones have a click handler bound`)
  : bad(`no click handler on ${noHandler.length}: ${noHandler.slice(0, 5).join(", ")}`);

vacuous.length === 0
  ? ok("placeholder-vs-registry check is non-vacuous on every page")
  : console.log(`  note ${vacuous.length} hand-built page(s) ship a label that already matches the ` +
                `registry, so the label check proves nothing there -- the click-handler ` +
                `assertion above is what covers them`);

// --- 4. accept filter and fileInput wiring come from the same registry ---
console.log("\n-- file input configured from the registry --");
{
  const html = fs.readFileSync(path.join(dir, "trim-video.html"), "utf8");
  const tool = /data-tool="([^"]*)"/.exec(html)[1];
  const { doc } = boot(tool, { dropLabel: STALE });
  // `accept` is a reflected IDL attribute: applyTool assigns the property, which a
  // real browser mirrors onto the content attribute. Read the property.
  const accept = doc.__el("fileInput").accept;
  accept === "video/*"
    ? ok(`trim-video.html fileInput accept="${accept}"`)
    : bad(`trim-video.html accept is "${accept}", expected "video/*"`);
}

// --- 5. the 9 hand-built pages work WITHOUT converts.js ---
console.log("\n-- hand-built pages (no converts.js) --");
let nativeKeys = null;
try {
  const doc = makeDoc({});
  doc.body.dataset = { tool: "pdfmerge" };
  const ctx = vm.createContext(makeSandbox(doc));
  vm.runInContext(fs.readFileSync(path.join(dir, "app.js"), "utf8"), ctx, { filename: "app.js" });
  nativeKeys = vm.runInContext("Object.keys(TOOLS)", ctx);
  ok("app.js loads standalone (the 9 original tools)");
} catch (e) {
  bad(`app.js standalone: ${e.message}`);
}
if (nativeKeys) {
  const hand = pages.filter((f) =>
    !/<script[^>]*src="converts\.js"/.test(fs.readFileSync(path.join(dir, f), "utf8")));
  const broken = hand.filter((f) => {
    const t = /data-tool="([^"]*)"/.exec(fs.readFileSync(path.join(dir, f), "utf8"))[1];
    return !nativeKeys.includes(t);
  });
  broken.length === 0 ? ok(`all ${hand.length} hand-built pages resolve without converts.js`)
                      : bad(`hand-built unresolved: ${broken.join(", ")}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
