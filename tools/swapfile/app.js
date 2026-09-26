// ---------- Tool definitions ----------
const TOOLS = {
  img2pdf: {
    accept: "image/png,image/jpeg,image/webp",
    multiple: true,
    dropLabel: "Drop images here, or click to browse",
    dropHint: ".jpg .png .webp — multiple files become one PDF",
    convert: imagesToPdf,
  },
  pdf2img: {
    accept: "application/pdf",
    multiple: false,
    dropLabel: "Drop a PDF here, or click to browse",
    dropHint: "Each page becomes a downloadable PNG",
    convert: pdfToImages,
  },
  doc2pdf: {
    accept: ".doc,.docx",
    multiple: false,
    dropLabel: "Drop a Word file here, or click to browse",
    dropHint: ".doc .docx — layout may shift slightly",
    convert: wordToPdf,
  },
  pdf2doc: {
    accept: "application/pdf",
    multiple: false,
    dropLabel: "Drop a PDF here, or click to browse",
    dropHint: "Text only — images and complex layout aren't preserved",
    convert: pdfToWord,
  },
  pdfmerge: {
    accept: "application/pdf",
    multiple: true,
    dropLabel: "Drop two or more PDFs here, or click to browse",
    dropHint: "They're merged in the order you add them",
    convert: mergePdfs,
  },
  pdfsplit: {
    accept: "application/pdf",
    multiple: false,
    dropLabel: "Drop a PDF here, or click to browse",
    dropHint: "Every page downloads as its own PDF",
    convert: splitPdf,
  },
  pdfcompress: {
    accept: "application/pdf",
    multiple: false,
    dropLabel: "Drop a PDF here, or click to browse",
    dropHint: "Shrinks file size — pages become images, so text is no longer selectable",
    convert: compressPdf,
  },
  imgcompress: {
    accept: "image/*",
    multiple: true,
    dropLabel: "Drop images here, or click to browse",
    dropHint: "Reduces file size for sharing or uploading",
    convert: compressImages,
  },
  heic2jpg: {
    accept: ".heic,.heif",
    multiple: true,
    dropLabel: "Drop iPhone HEIC photos here, or click to browse",
    dropHint: "Converts to standard JPG",
    convert: heicToJpg,
  },
};

// Extra tools registered by converts.js (loaded before app.js on new tool pages).
if (typeof EXTRA_TOOLS !== "undefined") Object.assign(TOOLS, EXTRA_TOOLS);

const PDF_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

// ---------- State ----------
let currentTool = document.body.dataset.tool;
let selectedFiles = [];

// ---------- Elements ----------
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const dropLabel = document.getElementById("dropLabel");
const dropHint = document.getElementById("dropHint");
const fileListEl = document.getElementById("fileList");
const convertBtn = document.getElementById("convertBtn");
const resultsEl = document.getElementById("results");

// ---------- Setup ----------
// Pages without a converter (like the homepage) have no dropzone — skip wiring in that case.
if (currentTool && TOOLS[currentTool] && dropzone) {
  applyTool(currentTool);

  dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

["dragover", "dragenter"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  })
);
["dragleave", "dragend", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, () => dropzone.classList.remove("dragover"))
);
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener("change", () => handleFiles(fileInput.files));

convertBtn.addEventListener("click", runConversion);
}

// ---------- UI helpers ----------
function applyTool(toolKey) {
  const tool = TOOLS[toolKey];
  fileInput.accept = tool.accept || "";
  fileInput.multiple = tool.multiple;
  fileInput.removeAttribute("webkitdirectory");
  if (tool.folderMode) {
    fileInput.setAttribute("webkitdirectory", "");
    fileInput.setAttribute("directory", "");
  }
  dropLabel.textContent = tool.dropLabel;
  dropHint.textContent = tool.dropHint;
  selectedFiles = [];
  fileInput.value = "";
  renderFileList();
  resultsEl.innerHTML = "";
  updateConvertState();
}

function handleFiles(fileListLike) {
  const tool = TOOLS[currentTool];
  const incoming = Array.from(fileListLike);
  selectedFiles = tool.multiple ? selectedFiles.concat(incoming) : incoming.slice(0, 1);
  resultsEl.innerHTML = "";
  renderFileList();
  updateConvertState();
  // Tools with an options panel (e.g. video resize) use this to read the picked files.
  if (typeof tool.onFiles === "function") tool.onFiles(selectedFiles);
}

function renderFileList() {
  fileListEl.innerHTML = "";
  selectedFiles.forEach((file, idx) => {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.className = "fname";
    name.textContent = file.name;
    const size = document.createElement("span");
    size.className = "fsize";
    size.textContent = formatBytes(file.size);
    const remove = document.createElement("button");
    remove.className = "remove";
    remove.setAttribute("aria-label", "Remove " + file.name);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      selectedFiles.splice(idx, 1);
      renderFileList();
      updateConvertState();
    });
    li.append(name, size, remove);
    fileListEl.appendChild(li);
  });
}

function updateConvertState() {
  convertBtn.disabled = selectedFiles.length === 0;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function baseName(name) {
  return name.replace(/\.[^/.]+$/, "");
}

async function runConversion() {
  if (selectedFiles.length === 0) return;
  resultsEl.innerHTML = "";
  convertBtn.classList.add("busy");
  convertBtn.disabled = true;
  try {
    await TOOLS[currentTool].convert(selectedFiles);
  } catch (err) {
    console.error(err);
    const note = document.createElement("p");
    note.className = "error-note";
    note.textContent = "Something went wrong converting that file: " + (err.message || err);
    resultsEl.appendChild(note);
  } finally {
    convertBtn.classList.remove("busy");
    convertBtn.disabled = false;
  }
}

function addResult(filename, blob, note) {
  const url = URL.createObjectURL(blob);
  const item = document.createElement("div");
  item.className = "result-item";
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.textContent = "Download " + filename;
  item.appendChild(link);
  resultsEl.appendChild(item);
  if (note) {
    const noteEl = document.createElement("p");
    noteEl.className = "result-note";
    noteEl.textContent = note;
    resultsEl.appendChild(noteEl);
  }
}

// ---------- Conversions ----------

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

async function imagesToPdf(files) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const dataUrl = await readAsDataURL(file);
    const img = await loadImage(dataUrl);
    const format = file.type.includes("png") ? "PNG" : "JPEG";
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / img.width, pageH / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;
    if (i > 0) pdf.addPage();
    pdf.addImage(dataUrl, format, x, y, w, h);
  }
  const blob = pdf.output("blob");
  addResult("converted.pdf", blob, files.length + " image(s) merged into one PDF.");
}

async function pdfToImages(files) {
  const file = files[0];
  const arrayBuffer = await file.arrayBuffer();
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    addResult(`${baseName(file.name)}-page-${pageNum}.png`, blob);
  }
}

async function wordToPdf(files) {
  const file = files[0];
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
  const container = document.createElement("div");
  container.innerHTML = html || "<p></p>";
  container.style.padding = "32pt";
  container.style.fontFamily = "Georgia, serif";
  container.style.color = "#111";
  container.style.background = "#fff";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  document.body.appendChild(container);
  try {
    const worker = html2pdf()
      .from(container)
      .set({
        margin: 0,
        filename: baseName(file.name) + ".pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "pt", format: "a4" },
      });
    const blob = await worker.outputPdf("blob");
    addResult(baseName(file.name) + ".pdf", blob, "Formatting is approximated — complex layouts may shift.");
  } finally {
    document.body.removeChild(container);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.innerText = str;
  return div.innerHTML;
}

async function pdfToWord(files) {
  const file = files[0];
  const arrayBuffer = await file.arrayBuffer();
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let bodyHtml = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item) => item.str).join(" ");
    bodyHtml += `<p>${escapeHtml(text)}</p>`;
    if (pageNum < pdf.numPages) {
      bodyHtml += '<br clear="all" style="page-break-before:always">';
    }
  }
  const doc =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
    "<head><meta charset=\"utf-8\"><title>Converted document</title></head>" +
    `<body>${bodyHtml}</body></html>`;
  const blob = new Blob(["\ufeff", doc], { type: "application/msword" });
  addResult(baseName(file.name) + ".doc", blob, "Text only — opens as an editable Word document.");
}

async function mergePdfs(files) {
  const { PDFDocument } = PDFLib;
  const merged = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const src = await PDFDocument.load(bytes);
    const copied = await merged.copyPages(src, src.getPageIndices());
    copied.forEach((page) => merged.addPage(page));
  }
  const outBytes = await merged.save();
  const blob = new Blob([outBytes], { type: "application/pdf" });
  addResult("merged.pdf", blob, files.length + " PDFs merged, in the order you added them.");
}

async function splitPdf(files) {
  const { PDFDocument } = PDFLib;
  const file = files[0];
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes);
  const pageCount = src.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    const outBytes = await doc.save();
    const blob = new Blob([outBytes], { type: "application/pdf" });
    addResult(`${baseName(file.name)}-page-${i + 1}.pdf`, blob);
  }
}

async function compressPdf(files) {
  const file = files[0];
  const arrayBuffer = await file.arrayBuffer();
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const { jsPDF } = window.jspdf;
  let outPdf;
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.55);
    if (!outPdf) {
      outPdf = new jsPDF({ unit: "pt", format: [viewport.width, viewport.height] });
    } else {
      outPdf.addPage([viewport.width, viewport.height]);
    }
    outPdf.addImage(dataUrl, "JPEG", 0, 0, viewport.width, viewport.height);
  }
  const blob = outPdf.output("blob");
  addResult(
    baseName(file.name) + "-compressed.pdf",
    blob,
    `${formatBytes(file.size)} → ${formatBytes(blob.size)}. Pages are rasterized, so text is no longer selectable — best for scanned or image-heavy PDFs.`
  );
}

async function compressImages(files) {
  for (const file of files) {
    const dataUrl = await readAsDataURL(file);
    const img = await loadImage(dataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.6));
    addResult(baseName(file.name) + "-compressed.jpg", blob, `${formatBytes(file.size)} → ${formatBytes(blob.size)}`);
  }
}

async function heicToJpg(files) {
  for (const file of files) {
    try {
      const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
      const blobs = Array.isArray(result) ? result : [result];
      blobs.forEach((blob, idx) => {
        const suffix = blobs.length > 1 ? `-${idx + 1}` : "";
        addResult(`${baseName(file.name)}${suffix}.jpg`, blob);
      });
    } catch (err) {
      throw new Error(`Couldn't convert ${file.name} — ${err.message || "unsupported HEIC variant"}`);
    }
  }
}

// ---------- Service worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
