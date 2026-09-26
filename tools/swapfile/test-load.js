// Regression test for the bug that shipped a fully broken toolset:
//   converts.js and app.js are classic <script> tags sharing ONE global lexical
//   scope. A top-level `const` declared in both is a parse-time SyntaxError,
//   which aborts ALL of app.js -- so every tool silently stops working while
//   `node --check` on each file in isolation still passes.
//
// This test loads both files into one shared context, exactly like the browser,
// and asserts the merge actually produced a working tool for every generated page.
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const dir = process.argv[2] || ".";
let pass = 0, fail = 0;
const ok = (m) => { console.log("  ok   " + m); pass++; };
const bad = (m) => { console.log("  FAIL " + m); fail++; };

function makeEl() {
  const el = {
    dataset: {}, style: {}, children: [], childNodes: [], value: "", checked: false,
    disabled: false, textContent: "", innerHTML: "", files: [], className: "", hidden: false,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, removeEventListener() {}, appendChild(c) { return c; },
    removeChild(c) { return c; }, setAttribute() {}, removeAttribute() {},
    getAttribute() { return null; }, hasAttribute() { return false; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    closest() { return null; }, focus() {}, click() {}, remove() {},
    getBoundingClientRect() { return { width: 800, height: 600, top: 0, left: 0 }; },
    scrollIntoView() {}, insertBefore(c) { return c; }, replaceChildren() {},
    getContext() { return null; }, toBlob(cb) { cb(null); },
  };
  return new Proxy(el, {
    get: (t, k) => (k in t ? t[k] : k === "then" || k === Symbol.toPrimitive ? undefined : undefined),
    set: (t, k, v) => { t[k] = v; return true; },
  });
}

function makeSandbox(tool) {
  const body = makeEl();
  body.dataset = { tool };
  const sb = {
    document: {
      body, readyState: "complete", documentElement: makeEl(),
      getElementById: () => makeEl(), querySelector: () => makeEl(),
      querySelectorAll: () => [], createElement: (t) => makeEl(),
      createTextNode: () => ({}),
      addEventListener: (ev, fn) => { if (ev === "DOMContentLoaded") fn(); },
      removeEventListener() {}, createObjectURL: () => "blob:x", revokeObjectURL() {},
      execCommand: () => true,
    },
    console, setTimeout, clearTimeout, setInterval, clearInterval,
    navigator: { userAgent: "node", onLine: true, clipboard: {} },
    location: { href: "https://cybernovaworks.store/tools/swapfile/", origin: "https://cybernovaworks.store" },
    URL: { createObjectURL: () => "blob:x", revokeObjectURL() {} },
    Blob: class {}, File: class {}, FileReader: class { readAsDataURL() {} readAsArrayBuffer() {} addEventListener() {} },
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

function loadTogether(files, tool) {
  const ctx = vm.createContext(makeSandbox(tool));
  for (const f of files) {
    vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), ctx, { filename: f });
  }
  return ctx;
}

// --- 1. the actual bug: both scripts must coexist in one global scope ---
console.log("-- shared global scope (the shipped bug) --");
let mergedCtx = null;
try {
  mergedCtx = loadTogether(["converts.js", "app.js"], "trimvideo");
  ok("converts.js + app.js load together in one global scope");
} catch (e) {
  bad(`app.js died loading after converts.js: ${e.constructor.name}: ${e.message}`);
  console.log("       (a duplicate top-level const/let/class in the two files causes this)");
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(1);
}

// --- 2. the merge must have published the registry ---
console.log("\n-- registry merge --");
const reg = vm.runInContext("typeof EXTRA_TOOLS !== 'undefined' ? Object.keys(EXTRA_TOOLS).length : 0", mergedCtx);
reg === 57 ? ok(`EXTRA_TOOLS published with ${reg} tools`) : bad(`EXTRA_TOOLS has ${reg} tools, expected 57`);

// --- 3. app.js's own TOOLS must contain all of them ---
const keys = vm.runInContext("Object.keys(TOOLS)", mergedCtx);
keys.length === 66
  ? ok(`merged TOOLS has all ${keys.length} tools`)
  : bad(`merged TOOLS has ${keys.length} tools, expected 66`);

// --- 4. every tool must have a callable convert() ---
const noConv = vm.runInContext("Object.entries(TOOLS).filter(([k,v]) => typeof v.convert !== 'function').map(([k]) => k)", mergedCtx);
noConv.length === 0 ? ok("every registered tool has a callable convert()") : bad(`no convert(): ${noConv.join(", ")}`);

// --- 5. every generated page's data-tool must resolve, for all 66 pages ---
console.log("\n-- every page's data-tool resolves --");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html") && !/^(index|home-tools)\.html$/.test(f));
const unresolved = [];
for (const f of files) {
  const m = /data-tool="([^"]*)"/.exec(fs.readFileSync(path.join(dir, f), "utf8"));
  if (!m) { unresolved.push(`${f}: no data-tool`); continue; }
  if (!keys.includes(m[1])) unresolved.push(`${f}: '${m[1]}'`);
}
unresolved.length === 0
  ? ok(`all ${files.length} pages resolve to a real tool`)
  : bad(`unresolved: ${unresolved.join("; ")}`);

// --- 6. the 9 hand-built pages work WITHOUT converts.js ---
console.log("\n-- hand-built pages (no converts.js) --");
let nativeCtx;
try {
  nativeCtx = loadTogether(["app.js"], "pdfmerge");
  ok("app.js loads standalone (the 9 original tools)");
} catch (e) {
  bad(`app.js standalone: ${e.message}`);
}
if (nativeCtx) {
  const nativeKeys = vm.runInContext("Object.keys(TOOLS)", nativeCtx);
  const handBuilt = files.filter((f) => {
    const c = fs.readFileSync(path.join(dir, f), "utf8");
    return !/<script[^>]*src="converts\.js"/.test(c);
  });
  const broken = handBuilt.filter((f) => {
    const m = /data-tool="([^"]*)"/.exec(fs.readFileSync(path.join(dir, f), "utf8"));
    return !nativeKeys.includes(m[1]);
  });
  broken.length === 0
    ? ok(`all ${handBuilt.length} hand-built pages resolve without converts.js`)
    : bad(`hand-built unresolved: ${broken.join(", ")}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
