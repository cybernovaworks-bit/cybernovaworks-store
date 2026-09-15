// Swapfile — extended conversion engine for the large tool set.
// Loaded BEFORE app.js. Registers window.EXTRA_TOOLS; app.js merges them into TOOLS.

const PDF_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// ---------- Lazy script loader ----------
const _loadedLibs = new Set();
function loadScript(src) {
  if (_loadedLibs.has(src)) return Promise.resolve();
  _loadedLibs.add(src);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

// ---------- Status helper ----------
function toolStatus(msg) {
  const r = document.getElementById("results");
  if (!r) return;
  let p = r.querySelector(".tool-status");
  if (!p) {
    p = document.createElement("p");
    p.className = "result-note tool-status";
    r.appendChild(p);
  }
  p.textContent = msg;
}

function getResultsEl() {
  return document.getElementById("results");
}

// ---------- Small shared helpers (mirror app.js) ----------
function _baseName(name) {
  return name.replace(/\.[^/.]+$/, "");
}

function getExtension(name) {
  const m = name.match(/\.([A-Za-z0-9]+)$/);
  return m ? m[1].toLowerCase() : "";
}

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function readAsArrayBuffer(file) {
  return file.arrayBuffer();
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ---------- PDF helpers ----------
async function getPdfjs() {
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
    return pdfjsLib;
  }
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  return pdfjsLib;
}

async function pdfExtractText(pdf) {
  const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const text = tc.items.map((i) => i.str).join(" ");
    pages.push(text);
  }
  return pages;
}

// =====================================================================
// DOCUMENT CONVERSIONS
// =====================================================================

async function pdfToExcel(files) {
  const file = files[0];
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
  const pdfjs = await getPdfjs();
  const pdf = await pdfjs.getDocument({ data: await readAsArrayBuffer(file) }).promise;
  const wb = XLSX.utils.book_new();
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const rows = [];
    let line = "";
    for (const it of tc.items) {
      line += it.str + " ";
      if (it.hasEOL) {
        rows.push(line.trim());
        line = "";
      }
    }
    if (line.trim()) rows.push(line.trim());
    const sheet = XLSX.utils.aoa_to_sheet(rows.map((r) => r.split(/\s{2,}|\t/g)));
    XLSX.utils.book_append_sheet(wb, sheet, "Page " + p);
  }
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  downloadBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), _baseName(file.name) + ".xlsx");
  toolStatus("Text content placed on one sheet per page. Table layout is approximated — complex tables may need minor cleanup.");
}

async function excelToPdf(files) {
  const file = files[0];
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
  const wb = XLSX.read(await readAsArrayBuffer(file));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  let html = '<table style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:10px;">';
  let maxCols = 0;
  data.forEach((r) => (maxCols = Math.max(maxCols, r.length)));
  data.forEach((r, ri) => {
    html += "<tr>";
    for (let c = 0; c < maxCols; c++) {
      const v = r[c];
      const style = "border:0.5px solid #999;padding:3px 6px;" + (ri === 0 ? "font-weight:bold;background:#eef2f7;" : "");
      html += "<td style='" + style + "'>" + String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</td>";
    }
    html += "</tr>";
  });
  html += "</table>";
  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.background = "#fff";
  document.body.appendChild(container);
  try {
    const worker = html2pdf()
      .set({ margin: 12, filename: _baseName(file.name) + ".pdf", html2canvas: { scale: 2 }, jsPDF: { unit: "mm", format: "a4" } })
      .from(container);
    const blob = await worker.outputPdf("blob");
    downloadBlob(blob, _baseName(file.name) + ".pdf");
    toolStatus("First sheet rendered to PDF. Wide sheets may be split across pages.");
  } finally {
    document.body.removeChild(container);
  }
}

async function pptxToPdf(files) {
  const file = files[0];
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const zip = await JSZip.loadAsync(await readAsArrayBuffer(file));
  const slides = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));
  if (!slides.length) throw new Error("No slides found in this PPTX file.");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  for (let i = 0; i < slides.length; i++) {
    const xmlText = await zip.file(slides[i]).async("string");
    const dom = new DOMParser().parseFromString(xmlText, "application/xml");
    const texts = Array.from(dom.getElementsByTagName("a:t")).map((n) => n.textContent);
    if (i > 0) doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Slide " + (i + 1), margin, margin + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const body = texts.join("\n");
    const lines = doc.splitTextToSize(body || "(empty slide)", doc.internal.pageSize.getWidth() - margin * 2);
    doc.text(lines, margin, margin + 48);
  }
  const blob = doc.output("blob");
  downloadBlob(blob, _baseName(file.name) + ".pdf");
  toolStatus("Text content from each slide copied to the PDF. Images, charts and slide art are not preserved.");
}

async function pdfToPptx(files) {
  const file = files[0];
  await loadScript("https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js");
  const pdf = await (await getPdfjs()).getDocument({ data: await readAsArrayBuffer(file) }).promise;
  const texts = await pdfExtractText(pdf);
  const pptx = new PptxGenJS();
  texts.forEach((t, i) => {
    const slide = pptx.addSlide();
    slide.addText("Page " + (i + 1), { x: 0.5, y: 0.35, w: 9, h: 0.5, fontSize: 20, bold: true, color: "00E5FF" });
    slide.addText(t || "(no text)", { x: 0.5, y: 1.1, w: 9, h: 5.5, fontSize: 12, color: "333333", valign: "top" });
  });
  const blob = await pptx.write({ outputType: "blob" });
  downloadBlob(blob, _baseName(file.name) + ".pptx");
  toolStatus("One slide per PDF page, containing the extracted text.");
}

async function pdfToText(files) {
  const file = files[0];
  const pdf = await (await getPdfjs()).getDocument({ data: await readAsArrayBuffer(file) }).promise;
  const texts = await pdfExtractText(pdf);
  const txt = texts.map((t, i) => "=== PAGE " + (i + 1) + " ===\n" + t).join("\n\n");
  downloadBlob(new Blob([txt], { type: "text/plain;charset=utf-8" }), _baseName(file.name) + ".txt");
  toolStatus("All detected text saved as a .txt file.");
}

async function textToPdf(files) {
  const file = files[0];
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const text = await readAsText(file);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(text || "(empty file)", doc.internal.pageSize.getWidth() - 80);
  let y = 60;
  let pageH = doc.internal.pageSize.getHeight();
  for (const ln of lines) {
    if (y > pageH - 60) {
      doc.addPage();
      y = 60;
    }
    doc.text(ln, 40, y);
    y += 15;
  }
  const blob = doc.output("blob");
  downloadBlob(blob, _baseName(file.name) + ".pdf");
  toolStatus("Text saved as a PDF document.");
}

async function htmlToPdf(files) {
  const file = files[0];
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
  const html = await readAsText(file);
  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.background = "#fff";
  document.body.appendChild(container);
  try {
    const worker = html2pdf()
      .set({ margin: 10, filename: _baseName(file.name) + ".pdf", html2canvas: { scale: 2 }, jsPDF: { unit: "mm", format: "a4" } })
      .from(container);
    const blob = await worker.outputPdf("blob");
    downloadBlob(blob, _baseName(file.name) + ".pdf");
    toolStatus("HTML page rendered to PDF. External CSS and images hosted elsewhere may not load.");
  } finally {
    document.body.removeChild(container);
  }
}

async function pdfToHtml(files) {
  const file = files[0];
  const pdf = await (await getPdfjs()).getDocument({ data: await readAsArrayBuffer(file) }).promise;
  const texts = await pdfExtractText(pdf);
  const html =
    "<!DOCTYPE html><html><head><meta charset='utf-8'><title>" +
    _baseName(file.name) +
    "</title><style>body{font-family:Arial,Helvetica,sans-serif;max-width:800px;margin:auto;padding:2rem;color:#222}h2{color:#00a8d6;border-bottom:1px solid #ddd;padding-bottom:4px}</style></head><body>" +
    texts
      .map((t, i) => "<h2>Page " + (i + 1) + "</h2><p>" + t.replace(/\n/g, "<br>") + "</p>")
      .join("") +
    "</body></html>";
  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), _baseName(file.name) + ".html");
  toolStatus("Text content exported as a styled HTML page.");
}

async function epubToPdf(files) {
  const file = files[0];
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const zip = await JSZip.loadAsync(await readAsArrayBuffer(file));
  const chapterNames = Object.keys(zip.files)
    .filter((n) => /\.(x?html?)$/i.test(n) && !/container\.xml$/i.test(n))
    .sort();
  if (!chapterNames.length) throw new Error("No chapter content found in this EPUB.");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageH = doc.internal.pageSize.getHeight();
  let y = margin;
  for (const name of chapterNames) {
    const xmlText = await zip.file(name).async("string");
    const dom = new DOMParser().parseFromString(xmlText, "text/html");
    const title = dom.querySelector("h1,h2,h3,title");
    const body = dom.body ? dom.body.textContent : "";
    if (title && title.textContent.trim()) {
      if (y > pageH - 40) { doc.addPage(); y = margin; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      const tl = doc.splitTextToSize(title.textContent.trim(), doc.internal.pageSize.getWidth() - margin * 2);
      doc.text(tl, margin, y);
      y += tl.length * 18 + 10;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(body || "", doc.internal.pageSize.getWidth() - margin * 2);
    for (const ln of lines) {
      if (y > pageH - 50) { doc.addPage(); y = margin; }
      doc.text(ln, margin, y);
      y += 14;
    }
    y += 24;
  }
  const blob = doc.output("blob");
  downloadBlob(blob, _baseName(file.name) + ".pdf");
  toolStatus("Book text rendered to PDF. Images and special formatting are simplified.");
}

async function pdfToEpub(files) {
  const file = files[0];
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
  const pdf = await (await getPdfjs()).getDocument({ data: await readAsArrayBuffer(file) }).promise;
  const texts = await pdfExtractText(pdf);
  const zip = new JSZip();
  let chapterHtml = "";
  texts.forEach((t, i) => {
    chapterHtml += "<h2>Page " + (i + 1) + "</h2>\n<p>" + t.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</p>\n";
  });
  zip.file("mimetype", "application/epub+zip");
  zip.file("META-INF/container.xml", '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  zip.file(
    "OEBPS/content.opf",
    '<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>' +
      _baseName(file.name) +
      '</dc:title><dc:language>en</dc:language></metadata><manifest><item id="c1" href="content.xhtml" media-type="application/xhtml+xml"/><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/></manifest><spine toc="ncx"><itemref idref="c1"/></spine></package>'
  );
  zip.file(
    "OEBPS/toc.ncx",
    '<?xml version="1.0"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/"><navMap><navPoint id="np1" playOrder="1"><navLabel><text>' +
      _baseName(file.name) +
      "</text></navLabel><content src=\"content.xhtml\"/></navPoint></navMap></ncx>"
  );
  zip.file(
    "OEBPS/content.xhtml",
    '<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>' +
      _baseName(file.name) +
      "</title></head><body>" + chapterHtml + "</body></html>"
  );
  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
  downloadBlob(blob, _baseName(file.name) + ".epub");
  toolStatus("Text-only EPUB generated — open it in any e-reader or Calibre.");
}

async function wordToText(files) {
  const file = files[0];
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
  const result = await mammoth.extractRawText({ arrayBuffer: await readAsArrayBuffer(file) });
  downloadBlob(new Blob([result.value || ""], { type: "text/plain;charset=utf-8" }), _baseName(file.name) + ".txt");
  toolStatus("Raw text extracted from the Word document.");
}

async function odtToPdf(files) {
  const file = files[0];
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const zip = await JSZip.loadAsync(await readAsArrayBuffer(file));
  if (!zip.file("content.xml")) throw new Error("Not a valid ODT file.");
  const xmlText = await zip.file("content.xml").async("string");
  const dom = new DOMParser().parseFromString(xmlText, "application/xml");
  const paragraphs = Array.from(dom.getElementsByTagName("text:p")).map((n) => n.textContent);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(paragraphs.join("\n") || "(no text)", doc.internal.pageSize.getWidth() - 80);
  let y = 60;
  const pageH = doc.internal.pageSize.getHeight();
  for (const ln of lines) {
    if (y > pageH - 60) { doc.addPage(); y = 60; }
    doc.text(ln, 40, y);
    y += 15;
  }
  downloadBlob(doc.output("blob"), _baseName(file.name) + ".pdf");
  toolStatus("Text exported from the OpenDocument file to PDF.");
}

// =====================================================================
// AUDIO CONVERSIONS (Web Audio decode → WAV or MP3 via lamejs)
// =====================================================================

let _lameLoaded = null;
function ensureLame() {
  if (!_lameLoaded) {
    _lameLoaded = loadScript("https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js");
  }
  return _lameLoaded;
}

async function decodeAudio(file) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const buf = await ctx.decodeAudioData(await readAsArrayBuffer(file));
  await ctx.close();
  return buf;
}

function floatTo16(buffer) {
  const out = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    let s = Math.max(-1, Math.min(1, buffer[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function encodeWav(audioBuffer) {
  const numCh = Math.min(2, audioBuffer.numberOfChannels);
  const sr = audioBuffer.sampleRate;
  const len = audioBuffer.length;
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = len * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const dv = new DataView(ab);
  function writeStr(o, s) { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); }
  writeStr(0, "RIFF");
  dv.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, numCh, true);
  dv.setUint32(24, sr, true);
  dv.setUint32(28, sr * blockAlign, true);
  dv.setUint16(32, blockAlign, true);
  dv.setUint16(34, 16, true);
  writeStr(36, "data");
  dv.setUint32(40, dataSize, true);
  const channels = [];
  for (let c = 0; c < numCh; c++) channels.push(floatTo16(audioBuffer.getChannelData(c)));
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) dv.setInt16(off, channels[c][i], true), (off += 2);
  }
  return new Blob([ab], { type: "audio/wav" });
}

async function encodeMp3(audioBuffer, bitrate) {
  await ensureLame();
  const numCh = Math.min(2, audioBuffer.numberOfChannels);
  const sr = audioBuffer.sampleRate;
  const encoder = new lamejs.Mp3Encoder(numCh, sr, bitrate || 128);
  const chunks = [];
  const blockSize = 1152;
  const left = audioBuffer.getChannelData(0);
  const right = numCh > 1 ? audioBuffer.getChannelData(1) : left;
  for (let i = 0; i < left.length; i += blockSize) {
    const l = left.subarray(i, i + blockSize);
    const r = right.subarray(i, i + blockSize);
    const buf = encoder.encodeBuffer(l, r);
    if (buf.length) chunks.push(new Int8Array(buf));
  }
  const end = encoder.flush();
  if (end.length) chunks.push(new Int8Array(end));
  return new Blob(chunks, { type: "audio/mpeg" });
}

async function audioToWav(files) {
  const file = files[0];
  toolStatus("Decoding audio…");
  const buf = await decodeAudio(file);
  const blob = encodeWav(buf);
  downloadBlob(blob, _baseName(file.name) + ".wav");
  toolStatus(_baseName(file.name) + ".wav ready to download.");
}

async function audioToMp3(files) {
  const file = files[0];
  toolStatus("Decoding audio…");
  const buf = await decodeAudio(file);
  toolStatus("Encoding MP3…");
  const blob = await encodeMp3(buf, 128);
  downloadBlob(blob, _baseName(file.name) + ".mp3");
  toolStatus(_baseName(file.name) + ".mp3 ready to download (128 kbps).");
}

// =====================================================================
// TEXT-TO-SPEECH via meSpeak (offline, WAV output)
// =====================================================================

let _mespeakReady = null;
function ensureMeSpeak() {
  if (!_mespeakReady) {
    _mespeakReady = (async () => {
      await loadScript("https://cdn.jsdelivr.net/npm/mespeak@1.2.5/mespeak.min.js");
      meSpeak.loadConfig("https://cdn.jsdelivr.net/npm/mespeak@1.2.5/mespeak_config.json");
      await new Promise((res) => meSpeak.loadVoice("https://cdn.jsdelivr.net/npm/mespeak@1.2.5/voices/en/en.json", res));
    })();
  }
  return _mespeakReady;
}

function mespeakWav(text) {
  const parts = [];
  let i = 0;
  const step = 1800;
  while (i < text.length) {
    const chunkWav = meSpeak.speak(text.slice(i, i + step), { rawdata: "array", amplitude: 90, wordgap: 3 });
    if (!chunkWav) break;
    parts.push(chunkWav);
    i += step;
    if (parts.length > 60) break; // safety cap (~2 min audio)
  }
  if (!parts.length) throw new Error("Speech synthesis produced no audio.");
  const body = [];
  let dataLen = 0;
  parts.forEach((p, idx) => {
    const arr = p instanceof ArrayBuffer ? new Uint8Array(p) : new Uint8Array(p.buffer || p);
    const start = idx === 0 ? 0 : 44; // strip WAV headers of subsequent chunks
    body.push(arr.slice(start));
    dataLen += arr.length - start;
  });
  const total = 44 + dataLen;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  function writeStr(o, s) { for (let j = 0; j < s.length; j++) out.setUint8(o + j, s.charCodeAt(j)); }
  writeStr(0, "RIFF");
  dv.setUint32(4, total - 8, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, 22050, true);
  dv.setUint32(28, 22050 * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  writeStr(36, "data");
  dv.setUint32(40, dataLen, true);
  let off = 44;
  body.forEach((b) => { out.set(b, off); off += b.length; });
  return new Blob([out.buffer], { type: "audio/wav" });
}

async function textToAudio(files) {
  const file = files[0];
  toolStatus("Loading speech engine…");
  await ensureMeSpeak();
  const text = (await readAsText(file)).slice(0, 200000);
  toolStatus("Speaking…");
  const blob = mespeakWav(text);
  downloadBlob(blob, _baseName(file.name) + "-speech.wav");
  toolStatus("Generated " + _baseName(file.name) + "-speech.wav (mono, 22.05 kHz WAV).");
}

async function pdfToAudiobook(files) {
  const file = files[0];
  await ensureMeSpeak();
  const pdf = await (await getPdfjs()).getDocument({ data: await readAsArrayBuffer(file) }).promise;
  const texts = await pdfExtractText(pdf);
  toolStatus("Generating speech…");
  const blob = mespeakWav(texts.join("\n\n"));
  downloadBlob(blob, _baseName(file.name) + "-audiobook.wav");
  toolStatus("Audiobook saved as " + _baseName(file.name) + "-audiobook.wav.");
}

// =====================================================================
// IMAGE CONVERSIONS (canvas-based + specialty decoders)
// =====================================================================

async function canvasToBlob(canvas, mime, quality) {
  return new Promise((res) => canvas.toBlob(res, mime, quality));
}

async function imageToPng(files) {
  for (const file of files) {
    const img = await loadImage(await readAsDataURL(file));
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    c.getContext("2d").drawImage(img, 0, 0);
    downloadBlob(await canvasToBlob(c, "image/png"), _baseName(file.name) + ".png");
  }
}

async function imageToJpg(files) {
  for (const file of files) {
    const img = await loadImage(await readAsDataURL(file));
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    downloadBlob(await canvasToBlob(c, "image/jpeg", 0.92), _baseName(file.name) + ".jpg");
  }
}

async function webpToJpg(files) {
  await imageToJpg(files);
}

async function bmpToJpg(files) {
  await imageToJpg(files);
}

async function tiffToJpg(files) {
  await loadScript("https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.min.js");
  for (const file of files) {
    const ab = await readAsArrayBuffer(file);
    const ifds = UTIF.decode(ab);
    if (!ifds.length) throw new Error("Could not decode TIFF: " + file.name);
    UTIF.decodeImage(ab, ifds[0]);
    const rgba = UTIF.toRGBA8(ifds[0]);
    const w = ifds[0].width, h = ifds[0].height;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer), w, h), 0, 0);
    downloadBlob(await canvasToBlob(c, "image/jpeg", 0.92), _baseName(file.name) + ".jpg");
  }
}

async function svgToPng(files) {
  for (const file of files) {
    const text = await readAsText(file);
    const blob = new Blob([text], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    try {
      const img = await loadImage(url);
      const size = { w: img.width || 800, h: img.height || 600 };
      const c = document.createElement("canvas");
      c.width = size.w; c.height = size.h;
      c.getContext("2d").drawImage(img, 0, 0, size.w, size.h);
      downloadBlob(await canvasToBlob(c, "image/png"), _baseName(file.name) + ".png");
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

async function pngToSvg(files) {
  await loadScript("https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.js");
  for (const file of files) {
    const url = await readAsDataURL(file);
    const svg = await new Promise((resolve, reject) => {
      ImageTracer.imageToSVG(url, (svgstr) => resolve(svgstr), { ltres: 0.5, qtres: 1, pathomit: 4, blurradius: 0 }, () => reject(new Error("Vectorization failed for " + file.name)));
    });
    downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), _baseName(file.name) + ".svg");
  }
  toolStatus("Vector version created by tracing the bitmap. Complex photos may produce many paths.");
}

async function imageToBase64(files) {
  for (const file of files) {
    const dataUrl = await readAsDataURL(file);
    downloadBlob(new Blob([dataUrl], { type: "text/plain;charset=utf-8" }), _baseName(file.name) + "-base64.txt");
  }
  toolStatus("Base64 data-URLs saved as .txt files — paste straight into code or <img src>.");
}

// =====================================================================
// DATA CONVERSIONS (SheetJS + XML helpers)
// =====================================================================

function ensureXlsx() {
  return loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
}

async function csvToExcel(files) {
  const file = files[0];
  await ensureXlsx();
  const csv = await readAsText(file);
  const wb = XLSX.read(csv, { type: "string" });
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  downloadBlob(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), _baseName(file.name) + ".xlsx");
  toolStatus("CSV converted to an .xlsx spreadsheet (first sheet).");
}

async function excelToCsv(files) {
  const file = files[0];
  await ensureXlsx();
  const wb = XLSX.read(await readAsArrayBuffer(file));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const csv = XLSX.utils.sheet_to_csv(ws);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), _baseName(file.name) + ".csv");
  toolStatus("First sheet exported as CSV.");
}

async function jsonToCsv(files) {
  const file = files[0];
  await ensureXlsx();
  const data = JSON.parse(await readAsText(file));
  const rows = Array.isArray(data) ? data : [data];
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), _baseName(file.name) + ".csv");
  toolStatus("Array of objects written to CSV (keys become columns).");
}

async function csvToJson(files) {
  const file = files[0];
  await ensureXlsx();
  const csv = await readAsText(file);
  const wb = XLSX.read(csv, { type: "string" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws);
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), _baseName(file.name) + ".json");
  toolStatus("CSV converted to a JSON array of objects.");
}

function xmlToPlainObj(node) {
  const obj = {};
  if (node.attributes) {
    for (const a of Array.from(node.attributes)) obj["@" + a.name] = a.value;
  }
  const children = Array.from(node.childNodes).filter((n) => n.nodeType === 1);
  if (!children.length && node.textContent.trim()) {
    return node.textContent.trim();
  }
  const text = Array.from(node.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
  if (text && !children.length) {
    obj["#text"] = text;
  }
  children.forEach((child) => {
    const key = child.nodeName;
    const val = xmlToPlainObj(child);
    if (obj[key] === undefined) obj[key] = val;
    else if (Array.isArray(obj[key])) obj[key].push(val);
    else obj[key] = [obj[key], val];
  });
  return obj;
}

async function xmlToJson(files) {
  const file = files[0];
  const text = await readAsText(file);
  const dom = new DOMParser().parseFromString(text, "application/xml");
  const root = dom.documentElement;
  const out = { [root.nodeName]: xmlToPlainObj(root) };
  downloadBlob(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }), _baseName(file.name) + ".json");
}

function jsonToXmlBody(key, val) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  if (Array.isArray(val)) return val.map((v) => jsonToXmlBody(key, v)).join("");
  if (val && typeof val === "object") {
    const attrs = Object.keys(val).filter((k) => k.startsWith("@")).map((k) => " " + k.slice(1) + '="' + esc(val[k]) + '"').join("");
    const txt = val["#text"];
    const children = Object.keys(val).filter((k) => !k.startsWith("@") && k !== "#text");
    if (!children.length && txt !== undefined) return "<" + key + attrs + ">" + esc(txt) + "</" + key + ">";
    const inner = children.map((k) => jsonToXmlBody(k, val[k])).join("");
    return "<" + key + attrs + ">" + inner + "</" + key + ">";
  }
  return "<" + key + ">" + esc(val) + "</" + key + ">";
}

async function jsonToXml(files) {
  const file = files[0];
  const data = JSON.parse(await readAsText(file));
  let body = "";
  for (const key of Object.keys(data)) body += jsonToXmlBody(key, data[key]);
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + body;
  downloadBlob(new Blob([xml], { type: "application/xml" }), _baseName(file.name) + ".xml");
  toolStatus("JSON converted to XML. Object keys become element names.");
}

async function excelToSheets(files) {
  const file = files[0];
  await ensureXlsx();
  const wb = XLSX.read(await readAsArrayBuffer(file));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const csv = XLSX.utils.sheet_to_csv(ws);
  downloadBlob(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), _baseName(file.name) + "-google-sheets.csv");
  toolStatus("Saved as CSV — open Google Sheets → File → Import → Upload to bring it in with formatting intact.");
}

// =====================================================================
// VIDEO CONVERSIONS (lazy-loaded FFmpeg.wasm — first run downloads codec)
// =====================================================================

let _ffmpegPromise = null;
function loadFFmpeg() {
  if (_ffmpegPromise) return _ffmpegPromise;
  _ffmpegPromise = (async () => {
    toolStatus("Loading video engine… (first use downloads ~30 MB, one-time)");
    await loadScript("https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js");
    await loadScript("https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js");
    const ffmpeg = new FFmpegWASM.FFmpeg();
    ffmpeg.on("log", ({ message }) => { /* quiet */ });
    const coreURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js";
    const wasmURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm";
    await ffmpeg.load({
      coreURL: await FFmpegUtil.toBlobURL(coreURL, "text/javascript"),
      wasmURL: await FFmpegUtil.toBlobURL(wasmURL, "application/wasm"),
    });
    return ffmpeg;
  })();
  _ffmpegPromise.catch(() => { _ffmpegPromise = null; });
  return _ffmpegPromise;
}

function ffmpegMime(out) {
  if (out.endsWith(".gif")) return "image/gif";
  if (out.endsWith(".mp4")) return "video/mp4";
  if (out.endsWith(".avi")) return "video/x-msvideo";
  if (out.endsWith(".mov")) return "video/quicktime";
  if (out.endsWith(".webm")) return "video/webm";
  if (out.endsWith(".mkv")) return "video/x-matroska";
  if (out.endsWith(".3gp")) return "video/3gpp";
  if (out.endsWith(".flv")) return "video/x-flv";
  if (out.endsWith(".mp3")) return "audio/mpeg";
  if (out.endsWith(".wav")) return "audio/wav";
  return "application/octet-stream";
}

async function runFfmpegCommand(file, args, outName, note) {
  const ffmpeg = await loadFFmpeg();
  const inName = "input_" + (file.name.replace(/[^\w.-]/g, "_"));
  await ffmpeg.writeFile(inName, await FFmpegUtil.fetchFile(file));
  await ffmpeg.exec(["-i", inName, ...args]);
  await ffmpeg.deleteFile(inName);
  const data = await ffmpeg.readFile(outName);
  await ffmpeg.deleteFile(outName);
  const blob = new Blob([data.buffer], { type: ffmpegMime(outName) });
  downloadBlob(blob, _baseName(file.name) + "-" + outName);
  if (note) toolStatus(note);
}

async function avi2mp4(files) { await runFfmpegCommand(files[0], ["-c:v", "libx264", "-crf", "23", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "out.mp4"], "converted.mp4", "AVI re-encoded to MP4."); }
async function mov2mp4(files) { await runFfmpegCommand(files[0], ["-c:v", "copy", "-c:a", "copy", "-movflags", "+faststart", "out.mp4"], "converted.mp4", "MOV remuxed to MP4 (fast, no re-encode)."); }
async function mkv2mp4(files) { await runFfmpegCommand(files[0], ["-c:v", "libx264", "-crf", "23", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "out.mp4"], "converted.mp4", "MKV re-encoded to MP4."); }
async function webm2mp4(files) { await runFfmpegCommand(files[0], ["-c:v", "libx264", "-crf", "23", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "out.mp4"], "converted.mp4", "WEBM re-encoded to MP4."); }
async function mp42avi(files) { await runFfmpegCommand(files[0], ["-c:v", "ffv1", "-c:a", "pcm_s16le", "out.avi"], "converted.avi", "MP4 converted to lossless AVI."); }
async function mp42mov(files) { await runFfmpegCommand(files[0], ["-c:v", "copy", "-c:a", "copy", "out.mov"], "converted.mov", "MP4 remuxed to MOV."); }
async function mp42gif(files) { await runFfmpegCommand(files[0], ["-vf", "fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", "-loop", "0", "out.gif"], "converted.gif", "MP4 converted to an animated GIF."); }
async function gif2mp4(files) { await runFfmpegCommand(files[0], ["-movflags", "+faststart", "-pix_fmt", "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "out.mp4"], "converted.mp4", "GIF converted to MP4 video."); }
async function media2mp3(files) { await runFfmpegCommand(files[0], ["-vn", "-acodec", "libmp3lame", "-q:a", "2", "out.mp3"], "audio.mp3", "Audio extracted and saved as MP3."); }
async function compressVideo(files) { await runFfmpegCommand(files[0], ["-c:v", "libx264", "-crf", "32", "-preset", "slow", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "out.mp4"], "compressed.mp4", "Video re-encoded at a lower bitrate."); }
async function threeGp2mp4(files) { await runFfmpegCommand(files[0], ["-c:v", "libx264", "-crf", "24", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "out.mp4"], "converted.mp4", "3GP converted to MP4."); }
async function flv2mp4(files) { await runFfmpegCommand(files[0], ["-c:v", "libx264", "-crf", "24", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "out.mp4"], "converted.mp4", "FLV converted to MP4."); }

async function folderToZip(files) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
  const zip = new JSZip();
  for (const file of files) {
    const relPath = file.webkitRelativePath || file.name;
    const ab = await readAsArrayBuffer(file);
    zip.file(relPath, ab);
  }
  toolStatus("Zipping " + files.length + " files…");
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  downloadBlob(blob, "folder.zip");
  toolStatus("folder.zip created with all " + files.length + " files.");
}

// =====================================================================
// FONT: TTF → WOFF
// =====================================================================

async function ttfToWoff(files) {
  const file = files[0];
  await loadScript("https://cdn.jsdelivr.net/npm/fonteditor-core@2.1.2/dist/fonteditor.min.js");
  const ab = await readAsArrayBuffer(file);
  let fontObj;
  if (typeof fonteditor !== "undefined" && fonteditor.ttf && fonteditor.ttf.read) {
    fontObj = fonteditor.ttf.read(ab);
  } else {
    throw new Error("Font library not available in this browser.");
  }
  const woffAb = fonteditor.woff.write(fontObj);
  downloadBlob(new Blob([woffAb], { type: "font/woff" }), _baseName(file.name) + ".woff");
  toolStatus("Web font (.woff) created from the TTF file.");
}

// =====================================================================
// SPECIAL: OCR, OBJ→STL
// =====================================================================

async function imageToText(files) {
  const file = files[0];
  await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js");
  const url = await readAsDataURL(file);
  toolStatus("Running OCR (first run downloads the language model)…");
  const result = await Tesseract.recognize(url, "eng", { logger: (m) => { if (m.status === "recognizing text") toolStatus("Recognizing… " + Math.round(m.progress * 100) + "%"); } });
  const text = (result && result.data && result.data.text) || "";
  downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), _baseName(file.name) + "-text.txt");
  toolStatus("OCR complete — text saved as " + _baseName(file.name) + "-text.txt");
}

async function objToStl(files) {
  const file = files[0];
  const text = await readAsText(file);
  const verts = [];
  const faces = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    if (parts[0] === "v") verts.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
    else if (parts[0] === "f") {
      const idx = parts.slice(1).map((p) => parseInt(p.split("/")[0], 10));
      for (let i = 1; i < idx.length - 1; i++) faces.push([idx[0], idx[i], idx[i + 1]]);
    }
  }
  if (!verts.length || !faces.length) throw new Error("No valid vertices/faces found in the OBJ file.");
  const triCount = faces.length;
  const headerBytes = 80;
  const buf = new ArrayBuffer(headerBytes + 4 + triCount * 50);
  const dv = new DataView(buf, headerBytes);
  dv.setUint32(0, triCount, true);
  let off = 4;
  function vec(a, b, c) {
    const ab = [verts[b - 1][0] - verts[a - 1][0], verts[b - 1][1] - verts[a - 1][1], verts[b - 1][2] - verts[a - 1][2]];
    const ac = [verts[c - 1][0] - verts[a - 1][0], verts[c - 1][1] - verts[a - 1][1], verts[c - 1][2] - verts[a - 1][2]];
    const n = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
    const len = Math.hypot(n[0], n[1], n[2]) || 1;
    return [n[0] / len, n[1] / len, n[2] / len];
  }
  for (const f of faces) {
    const n = vec(f[0], f[1], f[2]);
    dv.setFloat32(off, n[0], true); dv.setFloat32(off + 4, n[1], true); dv.setFloat32(off + 8, n[2], true); off += 12;
    for (const vi of f) {
      const v = verts[vi - 1];
      dv.setFloat32(off, v[0], true); dv.setFloat32(off + 4, v[1], true); dv.setFloat32(off + 8, v[2], true); off += 12;
    }
    dv.setUint16(off, 0, true); off += 2;
  }
  downloadBlob(new Blob([buf], { type: "model/stl" }), _baseName(file.name) + ".stl");
  toolStatus("Binary STL exported — ready for most 3D printers and slicers (" + triCount + " triangles).");
}

// =====================================================================
// REGISTRY — merged into TOOLS by app.js
// =====================================================================

const EXTRA_TOOLS = {
  pdf2excel: { accept: "application/pdf", multiple: false, dropLabel: "Drop a PDF here, or click to browse", dropHint: "Text → spreadsheet, one sheet per page", convert: pdfToExcel },
  excel2pdf: { accept: ".xlsx,.xlsm,.xls", multiple: false, dropLabel: "Drop an Excel file here, or click to browse", dropHint: "First sheet rendered to PDF", convert: excelToPdf },
  pptx2pdf: { accept: ".pptx", multiple: false, dropLabel: "Drop a PowerPoint file here, or click to browse", dropHint: "Slide text exported to PDF", convert: pptxToPdf },
  pdf2pptx: { accept: "application/pdf", multiple: false, dropLabel: "Drop a PDF here, or click to browse", dropHint: "One slide per page", convert: pdfToPptx },
  pdf2text: { accept: "application/pdf", multiple: false, dropLabel: "Drop a PDF here, or click to browse", dropHint: "Saves all detected text as .txt", convert: pdfToText },
  text2pdf: { accept: ".txt,.md,.text", multiple: false, dropLabel: "Drop a text file here, or click to browse", dropHint: "Turns plain text into a PDF", convert: textToPdf },
  html2pdf: { accept: ".html,.htm", multiple: false, dropLabel: "Drop an HTML file here, or click to browse", dropHint: "Renders the page to PDF", convert: htmlToPdf },
  pdf2html: { accept: "application/pdf", multiple: false, dropLabel: "Drop a PDF here, or click to browse", dropHint: "Exports content as a styled web page", convert: pdfToHtml },
  epub2pdf: { accept: ".epub", multiple: false, dropLabel: "Drop an EPUB book here, or click to browse", dropHint: "Book text rendered to PDF", convert: epubToPdf },
  pdf2epub: { accept: "application/pdf", multiple: false, dropLabel: "Drop a PDF here, or click to browse", dropHint: "Creates a text-only EPUB", convert: pdfToEpub },
  word2text: { accept: ".doc,.docx", multiple: false, dropLabel: "Drop a Word file here, or click to browse", dropHint: "Extracts plain text", convert: wordToText },
  odt2pdf: { accept: ".odt", multiple: false, dropLabel: "Drop an OpenDocument (.odt) file here, or click to browse", dropHint: "Text exported to PDF", convert: odtToPdf },

  mp42mp3: { accept: "audio/*,video/mp4,video/x-m4v,video/quicktime", multiple: true, dropLabel: "Drop MP4 (or other audio/video) files here", dropHint: "Takes the audio track, saves 128kbps MP3", convert: audioToMp3 },
  mp32wav: { accept: "audio/*,video/*", multiple: true, dropLabel: "Drop audio files here, or click to browse", dropHint: "Converts to uncompressed WAV", convert: audioToWav },
  wav2mp3: { accept: "audio/*,video/*", multiple: true, dropLabel: "Drop WAV (or any audio) files here", dropHint: "Encodes 128kbps MP3", convert: audioToMp3 },
  m4a2mp3: { accept: "audio/*,video/*", multiple: true, dropLabel: "Drop M4A (or any audio) files here", dropHint: "Encodes 128kbps MP3", convert: audioToMp3 },
  aac2mp3: { accept: "audio/*,video/*", multiple: true, dropLabel: "Drop AAC audio files here", dropHint: "Encodes 128kbps MP3", convert: audioToMp3 },
  flac2mp3: { accept: "audio/*,video/*", multiple: true, dropLabel: "Drop FLAC audio files here", dropHint: "Encodes 128kbps MP3", convert: audioToMp3 },
  ogg2mp3: { accept: "audio/*,video/*", multiple: true, dropLabel: "Drop OGG (or any audio) files here", dropHint: "Encodes 128kbps MP3", convert: audioToMp3 },
  txt2audio: { accept: ".txt,.md,.text", multiple: false, dropLabel: "Drop a text file here, or click to browse", dropHint: "Speaks it aloud and saves a WAV file", convert: textToAudio },
  pdf2audio: { accept: "application/pdf", multiple: false, dropLabel: "Drop a PDF book/article here, or click to browse", dropHint: "Turns it into a spoken WAV audiobook", convert: pdfToAudiobook },

  jpg2png: { accept: "image/*", multiple: true, dropLabel: "Drop images here, or click to browse", dropHint: "Converts to PNG", convert: imageToPng },
  png2jpg: { accept: "image/*", multiple: true, dropLabel: "Drop images here, or click to browse", dropHint: "Converts to JPG", convert: imageToJpg },
  webp2jpg: { accept: ".webp", multiple: true, dropLabel: "Drop WEBP images here", dropHint: "Converts to JPG", convert: webpToJpg },
  bmp2jpg: { accept: ".bmp", multiple: true, dropLabel: "Drop BMP images here", dropHint: "Converts to JPG", convert: bmpToJpg },
  svg2png: { accept: ".svg", multiple: true, dropLabel: "Drop SVG files here, or click to browse", dropHint: "Renders to PNG", convert: svgToPng },
  tiff2jpg: { accept: ".tif,.tiff", multiple: true, dropLabel: "Drop TIFF files here", dropHint: "Converts to JPG", convert: tiffToJpg },
  png2svg: { accept: ".png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff", multiple: true, dropLabel: "Drop a bitmap image here, or click to browse", dropHint: "Traces it into a vector SVG", convert: pngToSvg },
  img2base64: { accept: "image/*", multiple: true, dropLabel: "Drop images here, or click to browse", dropHint: "Saves Base64 data-URLs as .txt", convert: imageToBase64 },

  csv2excel: { accept: ".csv,.tsv,.txt", multiple: false, dropLabel: "Drop a CSV file here, or click to browse", dropHint: "Saves as .xlsx", convert: csvToExcel },
  excel2csv: { accept: ".xlsx,.xls,.xlsm,.csv", multiple: false, dropLabel: "Drop an Excel file here, or click to browse", dropHint: "First sheet → CSV", convert: excelToCsv },
  json2csv: { accept: ".json,.txt", multiple: false, dropLabel: "Drop a JSON file here, or click to browse", dropHint: "Array of objects → CSV", convert: jsonToCsv },
  csv2json: { accept: ".csv,.tsv,.txt", multiple: false, dropLabel: "Drop a CSV file here, or click to browse", dropHint: "Saves as JSON", convert: csvToJson },
  xml2json: { accept: ".xml,.txt", multiple: false, dropLabel: "Drop an XML file here, or click to browse", dropHint: "Converts to JSON", convert: xmlToJson },
  json2xml: { accept: ".json,.txt", multiple: false, dropLabel: "Drop a JSON file here, or click to browse", dropHint: "Converts to XML", convert: jsonToXml },
  excel2sheets: { accept: ".xlsx,.xls,.xlsm", multiple: false, dropLabel: "Drop an Excel file here, or click to browse", dropHint: "Exports a clean CSV for Google Sheets", convert: excelToSheets },

  folder2zip: { accept: "", multiple: true, folderMode: true, dropLabel: "Choose a folder, or drop files to zip", dropHint: "Keeps the folder structure inside the ZIP", convert: folderToZip },
  ttf2woff: { accept: ".ttf,.otf", multiple: false, dropLabel: "Drop a TTF font here, or click to browse", dropHint: "Saves a .woff web font", convert: ttfToWoff },
  img2text: { accept: "image/*", multiple: false, dropLabel: "Drop a scanned image or photo here, or click to browse", dropHint: "Extracts text with OCR", convert: imageToText },
  obj2stl: { accept: ".obj", multiple: false, dropLabel: "Drop a 3D model (.obj) here, or click to browse", dropHint: "Exports a binary STL for 3D printing", convert: objToStl },

  avi2mp4: { accept: ".avi", multiple: false, dropLabel: "Drop an AVI video here, or click to browse", dropHint: "Re-encodes to web-friendly MP4", convert: avi2mp4 },
  mov2mp4: { accept: ".mov,.qt", multiple: false, dropLabel: "Drop a MOV video here, or click to browse", dropHint: "Remuxes to MP4 (fast)", convert: mov2mp4 },
  mkv2mp4: { accept: ".mkv", multiple: false, dropLabel: "Drop an MKV video here, or click to browse", dropHint: "Re-encodes to MP4", convert: mkv2mp4 },
  webm2mp4: { accept: ".webm", multiple: false, dropLabel: "Drop a WEBM video here, or click to browse", dropHint: "Re-encodes to MP4", convert: webm2mp4 },
  mp42avi: { accept: "video/mp4", multiple: false, dropLabel: "Drop an MP4 video here, or click to browse", dropHint: "Converts to lossless AVI", convert: mp42avi },
  mp42mov: { accept: "video/mp4", multiple: false, dropLabel: "Drop an MP4 video here, or click to browse", dropHint: "Remuxes to MOV (fast)", convert: mp42mov },
  mp42gif: { accept: "video/mp4", multiple: false, dropLabel: "Drop an MP4 video here, or click to browse", dropHint: "Makes an animated GIF", convert: mp42gif },
  gif2mp4: { accept: "image/gif", multiple: false, dropLabel: "Drop a GIF here, or click to browse", dropHint: "Converts to MP4 video", convert: gif2mp4 },
  video2audio: { accept: "video/*", multiple: false, dropLabel: "Drop a video here, or click to browse", dropHint: "Extracts the audio as MP3", convert: media2mp3 },
  videocompress: { accept: "video/*", multiple: false, dropLabel: "Drop a video here, or click to browse", dropHint: "Re-encodes at a lower size", convert: compressVideo },
  threegp2mp4: { accept: ".3gp,.3ga", multiple: false, dropLabel: "Drop a 3GP video here, or click to browse", dropHint: "Converts to MP4", convert: threeGp2mp4 },
  flv2mp4: { accept: ".flv", multiple: false, dropLabel: "Drop an FLV video here, or click to browse", dropHint: "Converts to MP4", convert: flv2mp4 },
};

window.EXTRA_TOOLS = EXTRA_TOOLS;