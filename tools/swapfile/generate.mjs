import { writeFileSync, readFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://cybernovaworks.store/tools/swapfile";
const SITE = "https://cybernovaworks.store";
const OG_IMAGE = `${SITE}/images/og-image.png`;
const OG_W = 1200;
const OG_H = 630;

// ---------- runtime metadata, read from converts.js ----------
// The copy on a tool page has to match what the tool actually accepts, so it is
// not typed in twice. This reads the real EXTRA_TOOLS table at build time, which
// means a changed `accept` in converts.js can never leave a stale sentence behind.
const RUNTIME = {};
{
  const src = readFileSync("converts.js", "utf8");
  const start = src.indexOf("const EXTRA_TOOLS = {");
  if (start === -1) throw new Error("converts.js: EXTRA_TOOLS not found");
  const block = src.slice(start, src.indexOf("\n};", start));
  const field = (line, name) => {
    const m = line.match(new RegExp(name + ':\\s*(?:"([^"]*)"|([a-z]+))'));
    return m ? (m[1] !== undefined ? m[1] : m[2]) : undefined;
  };
  for (const line of block.split("\n")) {
    const key = line.match(/^\s{2}(\w+):\s*\{/);
    if (!key) continue;
    RUNTIME[key[1]] = {
      accept: field(line, "accept") ?? "",
      multiple: field(line, "multiple") === "true",
      dropLabel: field(line, "dropLabel") ?? "",
      dropHint: field(line, "dropHint") ?? "",
    };
  }
}

// Turns an `accept` value into something a person can read.
const ACCEPT_LABEL = {
  "": "any file this browser can read",
  "application/pdf": "PDF documents",
  "image/*": "JPG, PNG, WEBP and other images",
  "audio/*": "any audio file",
  "video/*": "any video file",
  "audio/*,video/*": "any audio or video file",
};
const acceptLabel = (accept) => {
  if (ACCEPT_LABEL[accept]) return ACCEPT_LABEL[accept];
  const exts = accept.split(",").filter((a) => a.startsWith("."));
  if (exts.length) return exts.map((e) => e.slice(1).toUpperCase()).join(", ") + " files";
  return accept.split(",").map((a) => a.trim()).join(" or ");
};

// What comes out. Kept next to the page data because it is a product decision,
// not something that can be read off the drop handler.
const OUTPUT = {
  pdf2excel: "an editable .xlsx workbook", excel2pdf: "a PDF document",
  pptx2pdf: "a PDF of the slide text", pdf2pptx: "a .pptx deck",
  pdf2text: "a .txt file", text2pdf: "a PDF document",
  html2pdf: "a PDF that keeps the page styling", pdf2html: "a styled .html file",
  epub2pdf: "a PDF of the book", pdf2epub: "a text-only .epub",
  word2text: "a .txt file", odt2pdf: "a PDF document",
  mp42mp3: "a 128kbps MP3", mp32wav: "an uncompressed WAV",
  wav2mp3: "a 128kbps MP3", m4a2mp3: "a 128kbps MP3", aac2mp3: "a 128kbps MP3",
  flac2mp3: "a 128kbps MP3", ogg2mp3: "a 128kbps MP3",
  txt2audio: "a spoken WAV file", pdf2audio: "a spoken WAV audiobook",
  jpg2png: "PNG images", png2jpg: "JPG images", webp2jpg: "JPG images",
  bmp2jpg: "JPG images", svg2png: "PNG images", tiff2jpg: "JPG images",
  png2svg: "a vector .svg", img2base64: "a .txt file of Base64 data URLs",
  csv2excel: "an .xlsx workbook", excel2csv: "a .csv file",
  json2csv: "a .csv file", csv2json: "a .json file",
  xml2json: "a .json file", json2xml: "an .xml file",
  excel2sheets: "a clean .csv that pastes straight into Google Sheets",
  folder2zip: "a .zip archive", ttf2woff: "a .woff web font",
  img2text: "the extracted text", obj2stl: "a binary .stl for 3D printing",
  avi2mp4: "a web-friendly MP4", mov2mp4: "an MP4 (fast remux, no re-encode)",
  mkv2mp4: "an MP4", webm2mp4: "an MP4", mp42avi: "an AVI",
  mp42mov: "a MOV (fast remux)", mp42gif: "an animated GIF", gif2mp4: "an MP4 video",
  video2audio: "an MP3 of the audio track", videocompress: "a smaller video file",
  threegp2mp4: "an MP4", flv2mp4: "an MP4", videoresize: "a video at the size you pick",
  trimvideo: "a video cut to just the part you kept", rotatevideo: "a correctly oriented video",
  videoframe: "JPG stills from the video", watermarkvideo: "a watermarked video",
};

// The honest caveat, per tool. This is the part users actually get burned by, so
// it is stated plainly instead of being left to the FAQ.
const LIMIT = {
  pdf2excel: "A table that is really a drawing, or a multi-column layout, may come through with merged cells. Conversion runs on your own machine, so it costs nothing to try and check the result.",
  excel2pdf: "Only the first sheet is rendered, and layout is approximated by printing the page rather than by Excel's own renderer.",
  pptx2pdf: "Slide text is exported. Images, animations, speaker notes and transitions are not carried over.",
  pdf2pptx: "One slide per page, built from the text found on each page. This is a starting point for editing, not a faithful copy of the original deck.",
  pdf2text: "Only a real text layer is read. A scanned PDF has no text layer, so it comes back empty — run it through Image to Text (OCR) instead.",
  text2pdf: "Markdown basics such as headings and lists are recognised. Plain text is simply wrapped into paragraphs.",
  html2pdf: "Rendering depends on how much CSS the page uses, and anything pulled from the internet will not travel with the file.",
  pdf2html: "Content is exported as a styled web page. Complex multi-column layouts can need tidying afterwards.",
  epub2pdf: "The book's text is rendered to pages. Chapter art and original page styling are not reproduced.",
  pdf2epub: "The result is text only, so it is fine for reading on a phone but it is not the illustrated edition.",
  word2text: "Headers, footers and text boxes are skipped — you get the body text only.",
  odt2pdf: "Text is exported. Writer-specific styling, headers and footnotes are not reproduced.",
  mp42mp3: "The audio track is taken as-is and re-encoded, so a 5.1 source comes out as stereo.",
  mp32wav: "WAV is uncompressed, so the file gets dramatically larger — it is for editing, not for sharing.",
  wav2mp3: "128kbps is a deliberate quality/size trade-off. For anything archival, keep the original WAV.",
  m4a2mp3: "The file is re-encoded rather than repackaged, so the size drops but so does quality slightly.",
  aac2mp3: "128kbps stereo. Raise it if the source is a lossy file and you want to avoid stacking artefacts.",
  flac2mp3: "FLAC is lossless, so converting to 128kbps MP3 is a deliberate quality trade-off. Keep the FLAC as your master.",
  ogg2mp3: "128kbps stereo MP3, which plays everywhere including older phones and car stereos.",
  txt2audio: "Speech is synthesised, so pronunciation of names and jargon is a guess. Listen before relying on it.",
  pdf2audio: "Only the text is read aloud — images, tables and figures are skipped. A very long book takes a while.",
  jpg2png: "No quality is lost, but JPG artefacts cannot be undone. PNG is also much larger for photos.",
  png2jpg: "Transparency is flattened, because JPG cannot store it. Drop a background colour where it matters.",
  webp2jpg: "The result is larger than the WEBP it came from, which is the usual reason people convert.",
  bmp2jpg: "BMP is uncompressed and enormous, so this usually shrinks the file as well as converting it.",
  svg2png: "You choose the output width. Text in an SVG needs a font available to the renderer, or it can come out substituted.",
  tiff2jpg: "Multi-page TIFFs become a single JPG. Flatten the pages first if you need them all.",
  png2svg: "This is automatic tracing, not a redraw. Fine detail and gradients are simplified — complex photos trace poorly.",
  img2base64: "Base64 adds about a third to the file size. It is for embedding, not for shrinking.",
  csv2excel: "The first row is treated as the header. Multi-sheet workbooks are not supported.",
  excel2csv: "Only the first sheet is exported, and a cell containing a comma is quoted.",
  json2csv: "The JSON must be an array of flat objects. Nested objects and arrays are skipped rather than nested in the CSV.",
  csv2json: "Row values are kept as strings, so dates and numbers come out as text unless you cast them.",
  xml2json: "The XML must be well-formed and free of namespaces; comments and processing instructions are dropped.",
  json2xml: "A JSON object becomes XML elements using its keys as tag names, so keys must be valid XML names.",
  excel2sheets: "A CSV is a plain text format, so it only carries values. Formatting and formulas do not survive.",
  folder2zip: "The whole folder is read into memory, so very large folders can be slow on a phone.",
  ttf2woff: "Only convert fonts you are licensed to embed. The licence does not change by converting the file.",
  img2text: "Accuracy depends entirely on the image. Sharp, straight-on, well-lit text does well; angled phone photos of a screen do badly.",
  obj2stl: "STL stores geometry only. Materials, colours and texture maps are dropped, and very detailed models can produce enormous files.",
  avi2mp4: "The video is fully re-encoded, so it takes a while and the file shrinks. The first run also downloads a video engine.",
  mov2mp4: "This is a remux, so it is fast and lossless — but the source has to already be H.264, or the output will not play everywhere.",
  mkv2mp4: "Re-encoded, so expect to wait. Very long clips can exhaust the memory of a low-end phone.",
  webm2mp4: "Re-encoded to H.264 and AAC, which is what makes it play on iPhones and in older players.",
  mp42avi: "AVI is a much older container. It is lossless here, but the resulting file is far larger than the MP4 you started with.",
  mp42mov: "A remux, so it is fast and lossless. Use it only when a specific tool insists on MOV.",
  mp42gif: "GIF is limited to 256 colours, so gradients and skin tones band badly. Keep clips short.",
  gif2mp4: "One frame per frame of the GIF, so a long GIF becomes a long video — trim it if that matters.",
  video2audio: "You get the audio track only; the picture is discarded. Quality is fixed at a sensible 128kbps.",
  videocompress: "Re-encoding trades quality for size. Below about 720p it gets visibly soft, so the presets matter.",
  threegp2mp4: "3GP is an old, low-bitrate format, so the converted MP4 cannot restore detail that was never there.",
  flv2mp4: "FLV is an old Flash-era format. It re-encodes to H.264 so it plays in a browser or on a phone.",
  videoresize: "Every output dimension is rounded to an even number, because H.264 cannot encode odd sizes.",
  trimvideo: "The cut is frame-accurate but the clip is re-encoded, so trimming a large file takes time.",
  rotatevideo: "This re-encodes the clip. Rotation metadata in a phone video can also be cleared as a side effect.",
  videoframe: "You pick the timestamps. A JPG still is fine for a screenshot, but use a PNG if text in the frame has to stay sharp.",
  watermarkvideo: "The clip is re-encoded end to end. A JPG logo appears as a solid block — use a transparent PNG.",
};

const LIMIT_DEFAULT = "Output is produced locally, so nothing about your file is affected by an upload limit or a queue.";

const CATEGORIES = [
  { id: "doc", label: "Documents", blurb: "PDF, Word, Excel, PowerPoint & more", icon: "fa-file-lines",
    slug: "pdf-and-document-tools", title: "Free PDF & Document Tools",
    h1: "Free PDF & Document Tools",
    intro: "Every PDF, Word, Excel and PowerPoint converter here runs in your browser. Nothing is uploaded, nothing is watermarked, and there is no sign-up." },
  { id: "audio", label: "Audio", blurb: "Convert, extract & turn text into speech", icon: "fa-music",
    slug: "audio-converter-tools", title: "Free Audio Converter Tools",
    h1: "Free Audio Converter Tools",
    intro: "Convert between MP3, WAV, M4A, AAC, FLAC and OGG, pull the audio out of a video, or turn text into speech — all on your own device." },
  { id: "video", label: "Video", blurb: "Re-encode, remux, compress & rip", icon: "fa-video",
    slug: "video-converter-tools", title: "Free Video Converter Tools",
    h1: "Free Video Converter Tools",
    intro: "Convert MKV, AVI, MOV, WEBM, FLV and 3GP to MP4, compress a video for sharing, resize it, trim it, rotate it or pull stills out of it." },
  { id: "image", label: "Images", blurb: "Convert between every common format", icon: "fa-image",
    slug: "image-converter-tools", title: "Free Image Converter Tools",
    h1: "Free Image Converter Tools",
    intro: "Convert between JPG, PNG, WEBP, BMP, TIFF, HEIC and SVG, compress a photo for sharing, or trace a bitmap into a vector." },
  { id: "data", label: "Data & Spreadsheets", blurb: "CSV, JSON, XML & Excel", icon: "fa-table",
    slug: "csv-json-excel-tools", title: "Free CSV, JSON & Excel Tools",
    h1: "Free CSV, JSON & Excel Tools",
    intro: "Move data between CSV, JSON, XML and Excel without pasting it into a web form. Everything is parsed in the browser." },
  { id: "archive", label: "Archive", blurb: "Folders into compressed ZIPs", icon: "fa-box-archive",
    slug: "zip-and-archive-tools", title: "Free ZIP & Archive Tools",
    h1: "Free ZIP & Archive Tools",
    intro: "Turn a whole folder into a ZIP without uploading a single file to anyone else's server." },
  { id: "font", label: "Fonts & Code", blurb: "Web fonts & 3D models", icon: "fa-font",
    slug: "font-and-code-tools", title: "Free Font & Developer Tools",
    h1: "Free Font & Developer Tools",
    intro: "Convert a desktop TTF into a WOFF web font, or turn an OBJ model into an STL ready for a 3D printer." },
  { id: "special", label: "Accessibility & AI", blurb: "OCR, text-to-speech, vector tracing", icon: "fa-wand-magic-sparkles",
    slug: "ocr-and-accessibility-tools", title: "Free OCR & Accessibility Tools",
    h1: "Free OCR & Accessibility Tools",
    intro: "Read text out of a photo or a scan, and turn written text into spoken audio. Both run locally, so scanned documents never leave your device." },
];

const T = [];
const add = (t) => T.push(t);

// Existing pages — listed in hub, not regenerated
["img2pdf","pdf2img","doc2pdf","pdf2doc","pdfmerge","pdfsplit","pdfcompress","imgcompress","heic2jpg"]
  .forEach(() => {});

add({ key: "pdf2excel", cat: "doc", color: "tool-c-green", icon: "fa-file-excel", file: "pdf-to-excel.html",
  name: "PDF to Excel", h1: "PDF to Excel",
  tagline: "Pull tables and text out of a PDF and into a real, editable .xlsx spreadsheet — one sheet per page, ready in your browser.",
  desc: "Extract tables and text from a PDF into an editable Excel file, entirely in your browser.",
  steps: ["Drop in the PDF file you want converted.", "Text is pulled page by page into a spreadsheet.", "Press Convert and download the .xlsx file."],
  faq: [["Will my formatted tables stay intact?", "Basic tables and text convert well. Complex multi-column layouts may merge cells — conversion runs locally, so try it and check the result."], ["Is this really free and offline?", "Yes, everything runs with JavaScript in your browser. Nothing is uploaded to a server."]] });

add({ key: "excel2pdf", cat: "doc", color: "tool-c-red", icon: "fa-file-pdf", file: "excel-to-pdf.html",
  name: "Excel to PDF", h1: "Excel to PDF",
  tagline: "Turn an Excel workbook into a clean, shareable PDF. The first sheet is rendered and downloadable straight from your browser.",
  desc: "Turn an Excel workbook into a clean, shareable PDF without uploading it anywhere.",
  steps: ["Add the .xlsx, .xls or .xlsm file.", "The first sheet is rendered as a PDF.", "Download and share it — no account needed."],
  faq: [["Do all sheets get converted?", "Currently the active first sheet is rendered. Print your sheet from the browser for exact styling."], ["Can large workbooks convert?", "Yes, as long as they fit in your device's memory. Huge files take a few seconds more."]] });

add({ key: "pptx2pdf", cat: "doc", color: "tool-c-orange", icon: "fa-file-powerpoint", file: "powerpoint-to-pdf.html",
  name: "PowerPoint to PDF", h1: "PowerPoint to PDF",
  tagline: "Turn a .pptx deck into a PDF so it looks the same on any device. Slide text is extracted into a printable PDF.",
  desc: "Turn a PowerPoint .pptx deck into a PDF that shares cleanly. Runs fully in your browser.",
  steps: ["Choose your .pptx file.", "Slide text is extracted page by page.", "Download the finished PDF."],
  faq: [["Will animations and effects carry over?", "Animations are removed — the PDF captures the slide text in order, which is what most people need for sharing."], ["Does it work with .ppt files?", "For best results use the modern .pptx format; old .ppt files may open in Word and be re-saved."]] });

add({ key: "pdf2pptx", cat: "doc", color: "tool-c-orange", icon: "fa-object-group", file: "pdf-to-powerpoint.html",
  name: "PDF to PowerPoint", h1: "PDF to PowerPoint",
  tagline: "Turn a PDF back into an editable PowerPoint deck, one slide per page, generated entirely in your browser.",
  desc: "Turn a PDF into an editable PowerPoint file with one slide per page — no uploads.",
  steps: ["Drop in the PDF.", "Every page becomes a slide.", "Download the .pptx and edit it."],
  faq: [["Is the layout preserved perfectly?", "Text is kept and divided into slides. Complex graphics may be simplified."], ["Will images inside the PDF convert?", "Core text converts; images are best re-inserted manually for pixel-perfect results."]] });

add({ key: "pdf2text", cat: "doc", color: "tool-c-cyan", icon: "fa-file-lines", file: "pdf-to-text.html",
  name: "PDF to Text", h1: "PDF to Text",
  tagline: "Extract every word from a PDF into a plain .txt file. Fast, private, and it runs completely inside your browser.",
  desc: "Extract all visible text from a PDF into a plain .txt file, right in your browser.",
  steps: ["Add the PDF.", "Built-in text extraction finds every page's content.", "Download the .txt file."],
  faq: [["Does it work with scanned documents?", "Scanned pages contain no text layer, so use the Image to Text (OCR) tool for those."], ["Is my file kept private?", "Yes — extraction happens in your own browser and nothing is uploaded."]] });

add({ key: "text2pdf", cat: "doc", color: "tool-c-blue", icon: "fa-file", file: "text-to-pdf.html",
  name: "Text to PDF", h1: "Text to PDF",
  tagline: "Turn a .txt or .md note into a tidy PDF document you can email, print, or share.",
  desc: "Convert a plain text or Markdown file into a clean PDF in seconds.",
  steps: ["Drop in your .txt or .md file.", "Text is laid out into a formatted PDF.", "Download your document."],
  faq: [["Do headers and bullet points convert?", "Markdown basics like headings and lists are recognized. Plain text is wrapped into paragraphs."], ["Can I use it for long documents?", "Yes — long text wraps onto multiple pages automatically."]] });

add({ key: "html2pdf", cat: "doc", color: "tool-c-indigo", icon: "fa-file-code", file: "html-to-pdf.html",
  name: "HTML to PDF", h1: "HTML to PDF",
  tagline: "Export an HTML page or snippet as a PDF with styles intact. Rendered locally, printed to PDF.",
  desc: "Save an HTML file or snippet as a styled PDF document.",
  steps: ["Drop in your .html file", "The page is rendered and printed to PDF.", "Download it — styles included."],
  faq: [["Are CSS styles preserved?", "Yes, the page is rendered inside the browser before saving, so fonts, colors and layout carry across."], ["Does it run JavaScript on the page?", "Scripts that run when the page renders are executed; heavy external resources may be skipped."]] });

add({ key: "pdf2html", cat: "doc", color: "tool-c-indigo", icon: "fa-code", file: "pdf-to-html.html",
  name: "PDF to HTML", h1: "PDF to HTML",
  tagline: "Reveal a PDF as a readable, styled web page you can host, edit, or archive.",
  desc: "Convert the text of a PDF into a clean, styled HTML page.",
  steps: ["Add your PDF.", "Pages are turned into HTML sections.", "Download the .html file."],
  faq: [["Will the result look like the original?", "Formatting is rebuilt as clean web markup — prose converts beautifully, fine print layouts approximate."], ["Can I restyle it?", "Yes, it's a normal HTML file — adjust colors and fonts with any editor."]] });

add({ key: "epub2pdf", cat: "doc", color: "tool-c-purple", icon: "fa-book", file: "epub-to-pdf.html",
  name: "EPUB to PDF", h1: "EPUB to PDF",
  tagline: "Convert an EPUB ebook into a print-friendly PDF, complete with chapter breaks.",
  desc: "Read an EPUB ebook and export it as a paginated PDF.",
  steps: ["Drop in the .epub file.", "Chapters and text are extracted.", "Download the PDF ebook."],
  faq: [["Do covers and images convert?", "The core text and chapters convert reliably; embedded images are best placed manually."], ["Is it free for commercial ebooks?", "Only convert ebooks you have the right to convert."]] });

add({ key: "pdf2epub", cat: "doc", color: "tool-c-purple", icon: "fa-book-open", file: "pdf-to-epub.html",
  name: "PDF to EPUB", h1: "PDF to EPUB",
  tagline: "Turn a PDF into an EPUB ebook so it reflows on phones, tablets, and e-readers.",
  desc: "Build a text-based EPUB ebook from a PDF, optimized for reflowing readers.",
  steps: ["Add the PDF.", "Text is packaged into an EPUB container.", "Download the .epub and read it anywhere."],
  faq: [["Why is the EPUB text-only?", "Reflowable ebooks work best with text. Image-heavy PDFs keep their text but not pixel layouts."], ["Which e-readers accept it?", "Most modern ones — Kindle, Kobo, Apple Books and phone readers."]] });

add({ key: "word2text", cat: "doc", color: "tool-c-blue", icon: "fa-file-word", file: "word-to-text.html",
  name: "Word to Text", h1: "Word to Text",
  tagline: "Pull plain text out of a .doc or .docx file — perfect for drafts, scripts, and note-taking.",
  desc: "Extract plain text from a Word document in one click.",
  steps: ["Drop in the .doc or .docx file.", "Text is stripped from the document XML.", "Download the .txt file."],
  faq: [["Are tables and images included?", "No — this tool keeps the readable text only. Use Word to PDF for layout."], ["Is it private?", "Yes, extraction happens locally in your browser."]] });

add({ key: "odt2pdf", cat: "doc", color: "tool-c-blue", icon: "fa-file-lines", file: "odt-to-pdf.html",
  name: "ODT to PDF", h1: "ODT to PDF",
  tagline: "Open a LibreOffice .odt document and export it as a universal PDF.",
  desc: "Convert an OpenDocument text file into a PDF right in the browser.",
  steps: ["Choose your .odt file.", "Content is laid out onto pages.", "Download the PDF."],
  faq: [["Does it handle headings and lists?", "Yes — headings, paragraphs and lists are mapped into the PDF layout."], ["Is there a size limit?", "Only your device's memory. Regular documents convert instantly."]] });

// ---------- AUDIO ----------
add({ key: "mp42mp3", cat: "audio", color: "tool-c-pink", icon: "fa-music", file: "mp4-to-mp3.html",
  name: "MP4 to MP3", h1: "MP4 to MP3",
  tagline: "Strip the audio track off an MP4 (or any video) and save it as a 128 kbps MP3 — in seconds.",
  desc: "Extract the audio from an MP4 video and save it as an MP3.",
  steps: ["Drop in your video file.", "The audio track is decoded.", "Download your MP3."],
  faq: [["Can I convert other video types?", "Yes — MOV, and other browser-decodable videos work too."], ["What quality MP3 will I get?", "A balanced 128 kbps stereo MP3, good for music and podcasts."]] });

add({ key: "mp32wav", cat: "audio", color: "tool-c-cyan", icon: "fa-wave-square", file: "mp3-to-wav.html",
  name: "MP3 to WAV", h1: "MP3 to WAV",
  tagline: "Uncompress an MP3 back into studio-friendly WAV, lossless for editing.",
  desc: "Convert MP3 and other compressed audio to lossless WAV.",
  steps: ["Drop in your MP3 (or any audio).", "The audio is decoded to PCM.", "Download the WAV file."],
  faq: [["Why is the WAV bigger?", "WAV is uncompressed, which is exactly what editors and DJ software prefer."], ["Can I convert a whole playlist?", "Yes — add multiple files at once and each saves as its own WAV."]] });

add({ key: "wav2mp3", cat: "audio", color: "tool-c-pink", icon: "fa-file-audio", file: "wav-to-mp3.html",
  name: "WAV to MP3", h1: "WAV to MP3",
  tagline: "Shrink a WAV recording into a compact MP3 that emails and uploads easily.",
  desc: "Encode WAV audio into a smaller MP3 file.",
  steps: ["Drop in your WAV file.", "The PCM audio is compressed to MP3.", "Download your MP3."],
  faq: [["Will the quality be good enough?", "Yes — 128 kbps MP3 is great for speech and standard music listening."], ["Is this faster than desktop software?", "Much faster, and it never leaves your browser."]] });

add({ key: "m4a2mp3", cat: "audio", color: "tool-c-red", icon: "fa-file-audio", file: "m4a-to-mp3.html",
  name: "M4A to MP3", h1: "M4A to MP3",
  tagline: "Convert Apple's M4A audio format to universal MP3 in your browser.",
  desc: "Turn M4A audio recordings into MP3 files that play anywhere.",
  steps: ["Add your M4A file.", "Audio is decoded and re-encoded.", "Download the MP3."],
  faq: [["Are voice-notes supported?", "Yes — M4A voice memos convert perfectly to MP3."], ["Does it work on phones?", "Yes, the tool is fully mobile friendly."]] });

add({ key: "aac2mp3", cat: "audio", color: "tool-c-yellow", icon: "fa-file-audio", file: "aac-to-mp3.html",
  name: "AAC to MP3", h1: "AAC to MP3",
  tagline: "Convert AAC audio to MP3 for maximum device compatibility.",
  desc: "Convert AAC audio files to MP3 instantly.",
  steps: ["Drop in an AAC file.", "It is decoded and re-encoded as MP3.", "Save your MP3."],
  faq: [["Does it handle .m4a AAC files too?", "Yes, when the source loads in the browser it will convert."], ["Is there any watermark?", "No watermark, no sign-up, no upload."]] });

add({ key: "flac2mp3", cat: "audio", color: "tool-c-blue", icon: "fa-file-audio", file: "flac-to-mp3.html",
  name: "FLAC to MP3", h1: "FLAC to MP3",
  tagline: "Reduce lossless FLAC files to compact MP3 while keeping great sound.",
  desc: "Convert lossless FLAC audio to portable MP3.",
  steps: ["Choose your FLAC file.", "High-quality audio maps to MP3.", "Download the MP3."],
  faq: [["Will I lose much quality?", "Lossless stays lossless at the source; MP3 trades a little size for compatibility — still great for playback."], ["Can I batch multiple FLACs?", "Yes, drop several files and they all convert."]] });

add({ key: "ogg2mp3", cat: "audio", color: "tool-c-green", icon: "fa-file-audio", file: "ogg-to-mp3.html",
  name: "OGG to MP3", h1: "OGG to MP3",
  tagline: "Convert OGG Vorbis audio to MP3 so it plays on every device.",
  desc: "Turn OGG audio into playable-anywhere MP3.",
  steps: ["Add the OGG file.", "Audio is re-encoded to MP3.", "Download your MP3."],
  faq: [["Why convert OGG?", "OGG needs a player that supports it — MP3 works everywhere."], ["Is processing done locally?", "Yes, 100% in-browser."]] });

add({ key: "txt2audio", cat: "audio", color: "tool-c-indigo", icon: "fa-volume-high", file: "text-to-audio.html",
  name: "Text to Audio", h1: "Text to Audio",
  tagline: "Paste or drop a text file and hear it read aloud — saved as a WAV you can keep.",
  desc: "Turn any text file into a spoken WAV audio file with text-to-speech.",
  steps: ["Drop in a .txt file.", "A neural-sounding voice reads it.", "Download the WAV recording."],
  faq: [["Which voice is used?", "A natural English TTS voice, good for articles, stories and study notes."], ["Can I make audiobooks?", "Yes — combined with the PDF to Audiobook tool you can listen to long reads."]] });

add({ key: "pdf2audio", cat: "audio", color: "tool-c-purple", icon: "fa-headphones", file: "pdf-to-audiobook.html",
  name: "PDF to Audiobook", h1: "PDF to Audiobook",
  tagline: "Turn any PDF into a spoken WAV audiobook and listen while you work.",
  desc: "Turn any PDF into a spoken WAV audiobook you can listen to anywhere.",
  steps: ["Drop in your PDF book or article.", "The text is read aloud with TTS.", "Download the spoken WAV file."],
  faq: [["How long does a long book take?", "An average chapter takes under a minute to generate."], ["Can I listen on my phone?", "Yes — the WAV plays in any music app."]] });

// ---------- VIDEO ----------
add({ key: "avi2mp4", cat: "video", color: "tool-c-blue", icon: "fa-film", file: "avi-to-mp4.html",
  name: "AVI to MP4", h1: "AVI to MP4",
  tagline: "Re-encode an AVI video into a modern MP4 that plays on phones, TVs and the web.",
  desc: "Convert AVI video files to modern MP4 format.",
  steps: ["Drop the AVI file.", "A video engine re-encodes it to MP4.", "Download your MP4."],
  faq: [["Why is AVI rare nowadays?", "AVI lacks modern compression — MP4 is smaller and broadly supported."], ["How long does conversion take?", "Roughly the length of the video — the engine downloads on first use."]] });

add({ key: "mov2mp4", cat: "video", color: "tool-c-blue", icon: "fa-film", file: "mov-to-mp4.html",
  name: "MOV to MP4", h1: "MOV to MP4",
  tagline: "Remux a QuickTime MOV into MP4 fast — often without re-encoding at all.",
  desc: "Convert QuickTime MOV videos to universal MP4.",
  steps: ["Add the MOV file.", "It is remuxed (and adjusted) to MP4.", "Download your MP4."],
  faq: [["Does MOV lose quality?", "Remuxing copies the video stream, so quality stays identical."], ["Is it good for iPhone clips?", "Yes — iPhone MOV exports like this all the time."]] });

add({ key: "mkv2mp4", cat: "video", color: "tool-c-blue", icon: "fa-film", file: "mkv-to-mp4.html",
  name: "MKV to MP4", h1: "MKV to MP4",
  tagline: "Convert Matroska MKV files into MP4 so they play on every device.",
  desc: "Convert MKV video containers to broadly-compatible MP4.",
  steps: ["Drop the MKV file.", "It is re-encoded into an MP4 container.", "Download your MP4."],
  faq: [["Why won't my MKV play?", "Many TVs and phones lack MKV support — MP4 solves that."], ["Are subtitles carried over?", "Core video/audio convert; burn-in subtitles are best done in a desktop editor."]] });

add({ key: "webm2mp4", cat: "video", color: "tool-c-green", icon: "fa-film", file: "webm-to-mp4.html",
  name: "WEBM to MP4", h1: "WEBM to MP4",
  tagline: "Convert WEBM clips into MP4 for iPhone, Instagram and PowerPoint.",
  desc: "Turn WEBM video into MP4 for maximum compatibility.",
  steps: ["Add the WEBM file.", "The video is re-encoded to MP4.", "Download your MP4."],
  faq: [["Does this work in the browser only?", "Yes — all encoding happens locally. Nothing is uploaded."], ["Can I convert screen recordings?", "Absolutely — most screen recordings are WEBM."]] });

add({ key: "mp42avi", cat: "video", color: "tool-c-orange", icon: "fa-file-video", file: "mp4-to-avi.html",
  name: "MP4 to AVI", h1: "MP4 to AVI",
  tagline: "Convert MP4 into a lossless AVI — great for legacy video software and editing.",
  desc: "Convert MP4 into a lossless AVI file.",
  steps: ["Drop the MP4 file.", "It is encoded to AVI.", "Download the AVI."],
  faq: [["Why is AVI so large?", "AVI in this tool is lossless, so old editors get perfect frames — size grows accordingly."], ["Is it for playback only?", "Ideal for old NLEs and archival; modern players prefer MP4."]] });

add({ key: "mp42mov", cat: "video", color: "tool-c-purple", icon: "fa-clapperboard", file: "mp4-to-mov.html",
  name: "MP4 to MOV", h1: "MP4 to MOV",
  tagline: "Wrap your MP4 in a QuickTime MOV container — fast and lossless.",
  desc: "Convert MP4 to QuickTime MOV container.",
  steps: ["Add the MP4.", "It is remuxed to MOV.", "Download your MOV."],
  faq: [["Does it keep quality?", "Yes — remuxing copies streams, so there is no re-encode."], ["Is it useful for Final Cut?", "MOV is friendly with Apple's editing suite."]] });

add({ key: "mp42gif", cat: "video", color: "tool-c-red", icon: "fa-image", file: "mp4-to-gif.html",
  name: "MP4 to GIF", h1: "MP4 to GIF",
  tagline: "Clip the best moment of a video into an animated GIF for memes and email.",
  desc: "Turn any MP4 clip into an animated GIF.",
  steps: ["Drop in your MP4.", "Frames are extracted and optimized.", "Download the GIF."],
  faq: [["How long can the GIF be?", "Keep clips under ~10 seconds for a reasonable file size."], ["Can I control the size?", "The tool auto-scales to 480px wide, a sweet spot for sharing."]] });

add({ key: "gif2mp4", cat: "video", color: "tool-c-orange", icon: "fa-clapperboard", file: "gif-to-mp4.html",
  name: "GIF to MP4", h1: "GIF to MP4",
  tagline: "Turn a bulky GIF into a small, smooth MP4 video.",
  desc: "Convert animated GIFs into compressed MP4 video.",
  steps: ["Add the GIF.", "It is re-encoded as MP4.", "Download your MP4."],
  faq: [["Why convert a GIF to MP4?", "GIFs are huge — an MP4 can be 90% smaller with smoother playback."], ["Do animations stay looped?", "Yes, the MP4 is set to loop."]] });

add({ key: "video2audio", cat: "video", color: "tool-c-pink", icon: "fa-music", file: "video-to-mp3.html",
  name: "Video to MP3", h1: "Video to MP3",
  tagline: "Grab the soundtrack from any video and save it as MP3.",
  desc: "Extract the audio track from any video and save it as MP3.",
  steps: ["Drop in your video.", "The audio is extracted by the engine.", "Download the MP3."],
  faq: [["Which formats work?", "Anything the engine reads — MP4, MOV, MKV, WEBM, AVI and more."], ["Can I use the music commercially?", "Only with content you have the rights to."]] });

add({ key: "videocompress", cat: "video", color: "tool-c-green", icon: "fa-compress", file: "compress-video.html",
  name: "Compress Video", h1: "Compress Video",
  tagline: "Shrink a video's file size for email, WhatsApp and the web — quality still looks great.",
  desc: "Reduce video file size with a quality-first re-encode.",
  steps: ["Add your video.", "The engine encodes at a lower bitrate.", "Download the compressed MP4."],
  faq: [["How much smaller will it be?", "Typically 50-75% smaller depending on the source."], ["Will it play after compression?", "Yes — output is standard MP4 with H.264, playable everywhere."]] });

add({ key: "threegp2mp4", cat: "video", color: "tool-c-yellow", icon: "fa-mobile-screen-button", file: "3gp-to-mp4.html",
  name: "3GP to MP4", h1: "3GP to MP4",
  tagline: "Convert old phone 3GP videos into modern MP4.",
  desc: "Convert 3GP phone videos to MP4.",
  steps: ["Drop the 3GP file.", "It is re-encoded to MP4.", "Download your MP4."],
  faq: [["Why are old videos 3GP?", "Older phones recorded 3GP to save space."], ["Will quality improve?", "MP4 won't add pixels, but it makes files playable on modern devices."]] });

add({ key: "flv2mp4", cat: "video", color: "tool-c-red", icon: "fa-tv", file: "flv-to-mp4.html",
  name: "FLV to MP4", h1: "FLV to MP4",
  tagline: "Convert legacy Flash FLV videos into MP4.",
  desc: "Convert FLV video files to MP4.",
  steps: ["Drop the FLV file.", "It is converted to MP4.", "Download your MP4."],
  faq: [["What was FLV used for?", "Old web streaming. MP4 replaces it today."], ["Can I convert downloaded recordings?", "Yes, as long as you have the rights."]] });

add({ key: "videoresize", cat: "video", color: "tool-c-cyan", icon: "fa-expand", file: "resize-video.html",
  name: "Resize Video", h1: "Resize Video",
  tagline: "Change any video's resolution — 4K, 1080p, 720p, 480p, 360p, half size, or your own dimensions. Nothing is uploaded.",
  desc: "Resize a video to 1080p, 720p, 480p, 360p or any custom resolution, right in your browser.",
  steps: ["Drop in your video file.", "Pick a resolution preset, or type your own width and height.", "Press Resize video and download the result."],
  faq: [["Will resizing ruin the quality?", "Scaling down is clean and the video stays sharp. Scaling up can't invent detail, so the picture gets softer — the tool warns you before it happens."], ["Is my video uploaded to a server?", "No. The encoding engine runs inside your browser, so your file never leaves your device."], ["Which size should I pick?", "720p is the safe all-rounder for WhatsApp, Instagram and email. 1080p keeps full HD quality, and 360p is the smallest option for slow connections."], ["Can I resize several videos at once?", "Yes — add as many files as you like and each one is processed in turn."]],
  btnLabel: "Resize video",
  panelExtra: `    <div class="tool-opts" id="resizeOpts">
      <span class="opt-label">Resolution</span>
      <div class="preset-row" role="group" aria-label="Resolution preset">
        <button type="button" class="preset-btn" data-preset="uhd">4K</button>
        <button type="button" class="preset-btn is-active" data-preset="fhd">1080p</button>
        <button type="button" class="preset-btn" data-preset="hd">720p</button>
        <button type="button" class="preset-btn" data-preset="sd">480p</button>
        <button type="button" class="preset-btn" data-preset="low">360p</button>
        <button type="button" class="preset-btn" data-preset="half">50%</button>
        <button type="button" class="preset-btn" data-preset="quarter">25%</button>
        <button type="button" class="preset-btn" data-preset="custom">Custom</button>
      </div>

      <div class="opt-grid">
        <label class="opt-field" for="rsW">Width (px)
          <input type="number" id="rsW" min="16" max="7680" step="2" value="1920" inputmode="numeric" />
        </label>
        <label class="opt-field" for="rsH">Height (px)
          <input type="number" id="rsH" min="16" max="4320" step="2" value="1080" inputmode="numeric" />
        </label>
      </div>

      <label class="opt-field" for="rsFit">Fit
        <select id="rsFit">
          <option value="contain" selected>Fit inside — keeps the whole frame</option>
          <option value="cover">Fill &amp; crop — fills the box exactly</option>
          <option value="stretch">Stretch — exact size, may distort</option>
        </select>
      </label>

      <label class="opt-field" for="rsQuality">Quality
        <select id="rsQuality">
          <option value="high">High — best looking, larger file</option>
          <option value="balanced" selected>Balanced — recommended</option>
          <option value="small">Small file — smallest download</option>
        </select>
      </label>

      <label class="opt-check">
        <input type="checkbox" id="rsMute" />
        Remove the audio track
      </label>

      <p class="opt-note" id="rsNote">Add a video and its resolution will appear here.</p>
    </div>` });

add({ key: "trimvideo", cat: "video", color: "tool-c-indigo", icon: "fa-scissors", file: "trim-video.html",
  name: "Trim Video", h1: "Trim Video",
  tagline: "Cut a long video down to just the part you need — perfect for reels, clips and highlights. Nothing is uploaded.",
  desc: "Cut a video to a specific start time and length, entirely in your browser.",
  steps: ["Drop in your video.", "Set where the clip should start and how long it should run.", "Press Cut clip and download the result."],
  faq: [["Is the cut frame-accurate?", "Yes — the encoder re-encodes the range from the exact timestamp rather than snapping to a keyframe, so the clip starts where you asked."], ["Does trimming reduce quality?", "It re-encodes the kept section at a high quality setting, which is visually lossless. The discarded part is simply gone, so the file is much smaller."], ["Can I trim several videos at once?", "One video at a time for now, so you can check the result of each cut."]],
  btnLabel: "Cut clip",
  panelExtra: `    <div class="tool-opts" id="trimOpts">
      <span class="opt-label">Quick length</span>
      <div class="preset-row" role="group" aria-label="Quick clip length">
        <button type="button" class="preset-btn" data-preset="clip">15s clip</button>
        <button type="button" class="preset-btn is-active" data-preset="short">30s clip</button>
        <button type="button" class="preset-btn" data-preset="long">60s clip</button>
      </div>

      <div class="opt-grid">
        <label class="opt-field" for="trStart">Start at (seconds)
          <input type="number" id="trStart" min="0" step="0.1" value="0" inputmode="decimal" />
        </label>
        <label class="opt-field" for="trLength">Length (seconds)
          <input type="number" id="trLength" min="0.5" step="0.5" value="30" inputmode="decimal" />
        </label>
      </div>

      <p class="opt-note" id="trNote">Set where the clip should start and how long it should run.</p>
    </div>` });

add({ key: "rotatevideo", cat: "video", color: "tool-c-orange", icon: "fa-rotate", file: "rotate-video.html",
  name: "Rotate Video", h1: "Rotate Video",
  tagline: "Turn a sideways phone video the right way up, or mirror a front-camera clip so it looks natural. Nothing is uploaded.",
  desc: "Rotate or flip a video 90, 180 or 45 degrees, entirely in your browser.",
  steps: ["Drop in your video.", "Choose the turn or flip you need.", "Press Rotate and download the fixed video."],
  faq: [["Why do the dimensions change?", "A 90° turn swaps width and height, so a 1920×1080 clip becomes 1080×1920. That is what makes a sideways clip fill a phone screen properly."], ["Can I mirror a selfie video?", "Yes — pick Flip horizontal. Front cameras normally mirror what you see, so this puts it back the way other people see you."], ["Does rotating lose quality?", "It re-encodes at a high quality setting, so there is no visible loss."]],
  btnLabel: "Rotate video",
  panelExtra: `    <div class="tool-opts" id="rotateOpts">
      <label class="opt-field" for="rotAngle">Turn / flip
        <select id="rotAngle">
          <option value="cw90" selected>Rotate 90° clockwise</option>
          <option value="ccw90">Rotate 90° anticlockwise</option>
          <option value="flip180">Rotate 180° (upside down)</option>
          <option value="hflip">Flip horizontal (mirror)</option>
          <option value="vflip">Flip vertical</option>
          <option value="tilt45">Tilt 45°</option>
        </select>
      </label>
      <p class="opt-note" id="rotNote">Turns the video 90°. Width and height swap.</p>
    </div>` });

add({ key: "videoframe", cat: "video", color: "tool-c-cyan", icon: "fa-camera", file: "video-to-image.html",
  name: "Video to Image", h1: "Video to Image",
  tagline: "Pull still JPG frames out of a video at any timestamp — for thumbnails, storyboards or slides. Nothing is uploaded.",
  desc: "Save still images from any point in a video as JPG files, in your browser.",
  steps: ["Drop in your video.", "Type the timestamps you want, separated by commas.", "Press Save frames and each image downloads."],
  faq: [["Can I get several frames at once?", "Yes — type timestamps like 1, 5, 12 and each one is saved as its own JPG. Up to 20 at a time."], ["What quality are the images?", "Full resolution at high JPG quality, so they are sharp enough for a thumbnail or a slide."], ["What if a timestamp is past the end?", "That frame is skipped rather than failing the whole run."]],
  btnLabel: "Save frames",
  panelExtra: `    <div class="tool-opts" id="frameOpts">
      <label class="opt-field" for="frTimes">Timestamps in seconds (comma separated)
        <input type="text" id="frTimes" value="1" inputmode="decimal" />
      </label>
      <p class="opt-note" id="frNote">1 image will be saved, one per timestamp.</p>
    </div>` });

add({ key: "watermarkvideo", cat: "video", color: "tool-c-pink", icon: "fa-stamp", file: "watermark-video.html",
  name: "Watermark Video", h1: "Watermark Video",
  tagline: "Put your logo or channel name over a video to stop it being reposted without credit. Runs entirely on your device.",
  desc: "Add a logo watermark to a video, in your browser, with position and opacity controls.",
  steps: ["Drop in your video.", "Choose your logo image and where it should sit.", "Press Add watermark and download the result."],
  faq: [["What image format should I use?", "A PNG with a transparent background works best, so only the logo shows and the box around it disappears. A JPG works but covers the video with a solid rectangle."], ["Does the logo get stretched?", "No — it is scaled to a percentage of your video's width, keeping its own proportions, so it stays sharp on a 4K clip."], ["Does it re-encode the whole video?", "Yes, an overlay has to be re-encoded. That is why it takes a little longer than a straight cut."]],
  btnLabel: "Add watermark",
  panelExtra: `    <div class="tool-opts" id="wmOpts">
      <span class="opt-label">Logo size</span>
      <div class="preset-row" role="group" aria-label="Logo size">
        <button type="button" class="preset-btn" data-scale="small">Small</button>
        <button type="button" class="preset-btn is-active" data-scale="medium">Medium</button>
        <button type="button" class="preset-btn" data-scale="large">Large</button>
      </div>

      <label class="opt-field" for="wmImage">Logo image
        <input type="file" id="wmImage" accept="image/*" />
      </label>

      <label class="opt-field" for="wmPos">Position
        <select id="wmPos">
          <option value="tl">Top left</option>
          <option value="tr">Top right</option>
          <option value="bl">Bottom left</option>
          <option value="br" selected>Bottom right</option>
          <option value="center">Centre</option>
        </select>
      </label>

      <label class="opt-field" for="wmOpacity">Opacity
        <select id="wmOpacity">
          <option value="0.3">Faint — 30%</option>
          <option value="0.5" selected>Medium — 50%</option>
          <option value="0.75">Strong — 75%</option>
          <option value="1">Solid — 100%</option>
        </select>
      </label>

      <p class="opt-note" id="wmNote">The logo is drawn over the video as a transparent overlay.</p>
    </div>` });

// ---------- IMAGES ----------
add({ key: "jpg2png", cat: "image", color: "tool-c-green", icon: "fa-image", file: "jpg-to-png.html",
  name: "JPG to PNG", h1: "JPG to PNG",
  tagline: "Convert JPG photos to lossless PNG with transparent-friendly output.",
  desc: "Convert JPG images to lossless PNG format.",
  steps: ["Add your JPG (or any image).", "It is decoded and saved as PNG.", "Download your PNGs."],
  faq: [["Why use PNG?", "PNG is lossless — crisp for graphics, icons and logos."], ["Can I convert several at once?", "Yes, add multiple images in one go."]] });

add({ key: "png2jpg", cat: "image", color: "tool-c-blue", icon: "fa-image", file: "png-to-jpg.html",
  name: "PNG to JPG", h1: "PNG to JPG",
  tagline: "Turn PNG screenshots and graphics into smaller JPG files.",
  desc: "Convert PNG images to JPG to shrink file size.",
  steps: ["Add your PNG files.", "Each is saved as a JPG.", "Download your JPGs."],
  faq: [["Why does JPG look blurry on text?", "JPG compresses photos well but adds artifacts on sharp edges — fine for photos."], ["Is quality loss okay?", "For photos, yes. Keep PNG for logos and line art."]] });

add({ key: "webp2jpg", cat: "image", color: "tool-c-orange", icon: "fa-image", file: "webp-to-jpg.html",
  name: "WEBP to JPG", h1: "WEBP to JPG",
  tagline: "Convert modern WEBP images to JPG for maximum compatibility.",
  desc: "Convert WEBP images to JPG.",
  steps: ["Add your WEBP file.", "It is converted to JPG.", "Download your JPG."],
  faq: [["Why is WEBP everywhere?", "Sites use it because it's small — but not every app opens it."], ["Do I lose quality?", "Minimal — JPG output is set for high quality."]] });

add({ key: "bmp2jpg", cat: "image", color: "tool-c-indigo", icon: "fa-image", file: "bmp-to-jpg.html",
  name: "BMP to JPG", h1: "BMP to JPG",
  tagline: "Convert huge BMP scans and drawings into compact JPG.",
  desc: "Convert BMP images to JPG.",
  steps: ["Add the BMP file.", "It is compressed to JPG.", "Download your JPG."],
  faq: [["Are BMP files really that big?", "Yes — BMP is uncompressed, so JPG can shrink them dramatically."], ["Can I batch convert?", "Yes, drop multiple BMPs at once."]] });

add({ key: "svg2png", cat: "image", color: "tool-c-purple", icon: "fa-vector-square", file: "svg-to-png.html",
  name: "SVG to PNG", h1: "SVG to PNG",
  tagline: "Render a vector SVG icon or logo into a sharp PNG.",
  desc: "Convert SVG vector graphics to PNG raster images.",
  steps: ["Add the SVG file.", "It is rendered at high resolution.", "Download the PNG."],
  faq: [["Will text in SVG stay crisp?", "Yes, vectors render at full sharpness as PNG."], ["Can I set the size?", "Conversion uses a balanced 2x resolution for crisp results."]] });

add({ key: "tiff2jpg", cat: "image", color: "tool-c-blue", icon: "fa-image", file: "tiff-to-jpg.html",
  name: "TIFF to JPG", h1: "TIFF to JPG",
  tagline: "Convert scanned TIFF documents into smaller JPG images.",
  desc: "Convert TIFF scans to JPG.",
  steps: ["Add the TIFF file.", "Each page is converted to JPG.", "Download your JPGs."],
  faq: [["Do multi-page TIFFs work?", "Yes, every page becomes its own JPG."], ["Is this good for scans?", "Perfect — huge scans shrink into share-ready JPGs."]] });

add({ key: "png2svg", cat: "image", color: "tool-c-red", icon: "fa-vector-square", file: "png-to-svg.html",
  name: "PNG to SVG", h1: "PNG to SVG",
  tagline: "Auto-trace a bitmap logo or drawing into a scalable vector SVG.",
  desc: "Trace bitmap images into scalable vector SVG files.",
  steps: ["Add a PNG, JPG or WEBP.", "An auto-tracer traces the shapes.", "Download the SVG."],
  faq: [["What makes a good trace?", "High-contrast logos and drawings trace best."], ["Is it truly vector?", "Yes — the SVG scales to any size without pixelation."]] });

add({ key: "img2base64", cat: "image", color: "tool-c-yellow", icon: "fa-code", file: "image-to-base64.html",
  name: "Image to Base64", h1: "Image to Base64",
  tagline: "Convert any image into a Base64 string for embedding in HTML, CSS or JSON.",
  desc: "Turn images into Base64 data strings for developers.",
  steps: ["Add your image.", "It is encoded to Base64.", "Copy the data-URL from the result."],
  faq: [["Why do developers need Base64?", "It lets you embed images directly in HTML, CSS and API payloads."], ["Does it reduce quality?", "No — encoding is lossless; the string is just bigger."]] });

// ---------- DATA ----------
add({ key: "csv2excel", cat: "data", color: "tool-c-green", icon: "fa-file-excel", file: "csv-to-excel.html",
  name: "CSV to Excel", h1: "CSV to Excel",
  tagline: "Import a CSV into a proper .xlsx workbook with columns and rows.",
  desc: "Convert CSV data into an Excel workbook.",
  steps: ["Add your CSV file.", "Rows and columns map into a sheet.", "Download the .xlsx."],
  faq: [["Are special characters handled?", "Yes — properly parsed with correct encoding."], ["Will formulas import?", "CSV holds values, not formulas — Excel adds them after import."]] });

add({ key: "excel2csv", cat: "data", color: "tool-c-green", icon: "fa-file-csv", file: "excel-to-csv.html",
  name: "Excel to CSV", h1: "Excel to CSV",
  tagline: "Export any Excel sheet to plain CSV for apps, imports and tools.",
  desc: "Convert Excel sheets to CSV.",
  steps: ["Add the .xlsx file.", "The first sheet becomes CSV.", "Download your CSV."],
  faq: [["Why CSV?", "CSV is the universal format for importing into databases and apps."], ["Do formulas convert?", "Only their current values appear in the CSV."]] });

add({ key: "json2csv", cat: "data", color: "tool-c-blue", icon: "fa-file-csv", file: "json-to-csv.html",
  name: "JSON to CSV", h1: "JSON to CSV",
  tagline: "Flatten an array of JSON objects into a clean CSV table.",
  desc: "Convert JSON data to CSV.",
  steps: ["Add your JSON file.", "Objects become rows, keys become columns.", "Download the CSV."],
  faq: [["What JSON shape works best?", "An array of objects — each object becomes one row."], ["Are nested objects flattened?", "Yes — nested keys are flattened with dots."]] });

add({ key: "csv2json", cat: "data", color: "tool-c-blue", icon: "fa-code", file: "csv-to-json.html",
  name: "CSV to JSON", h1: "CSV to JSON",
  tagline: "Convert a CSV table into structured JSON — great for APIs.",
  desc: "Convert CSV into JSON data.",
  steps: ["Add your CSV file.", "Header row becomes keys.", "Download the JSON."],
  faq: [["Is the JSON valid for APIs?", "Yes, it's standard JSON you can paste into your code."], ["Can I pick the delimiter?", "Commas and tabs are auto-detected."]] });

add({ key: "xml2json", cat: "data", color: "tool-c-purple", icon: "fa-code", file: "xml-to-json.html",
  name: "XML to JSON", h1: "XML to JSON",
  tagline: "Convert XML documents into easy-to-read JSON.",
  desc: "Convert XML to JSON.",
  steps: ["Add your XML file.", "Elements and attributes map to JSON.", "Download the JSON."],
  faq: [["How are attributes handled?", "Attributes become prefixed keys like @id."], ["Is repeated content kept?", "Yes — repeated elements become arrays."]] });

add({ key: "json2xml", cat: "data", color: "tool-c-purple", icon: "fa-code", file: "json-to-xml.html",
  name: "JSON to XML", h1: "JSON to XML",
  tagline: "Wrap JSON objects into well-formed XML.",
  desc: "Convert JSON to XML.",
  steps: ["Add your JSON file.", "Objects become XML elements.", "Download the XML."],
  faq: [["Can the XML be used in feeds?", "Yes, it's valid XML suitable for RSS and config files."], ["Are arrays handled?", "Yes — arrays repeat their element name."]] });

add({ key: "excel2sheets", cat: "data", color: "tool-c-green", icon: "fa-table", file: "excel-to-google-sheets.html",
  name: "Excel to Google Sheets", h1: "Excel to Google Sheets",
  tagline: "Export your Excel sheet as CSV so Google Sheets imports it perfectly.",
  desc: "Prepare an Excel file for a perfect Google Sheets import.",
  steps: ["Add your .xlsx file.", "It is exported as clean CSV.", "Import that CSV into Google Sheets."],
  faq: [["Why CSV for Sheets?", "Google Sheets imports CSV with zero formatting conflicts."], ["Can I import straight from Excel?", "Yes — CSV keeps numbers and text intact after import."]] });

// ---------- ARCHIVE ----------
add({ key: "folder2zip", cat: "archive", color: "tool-c-orange", icon: "fa-file-zipper", file: "folder-to-zip.html",
  name: "Folder to ZIP", h1: "Folder to ZIP",
  tagline: "Zip an entire folder, keeping its structure intact, right in your browser.",
  desc: "Zip a whole folder including its sub-folders.",
  steps: ["Choose a folder (or drop files).", "Structure is packed into a ZIP.", "Download your ZIP."],
  faq: [["Does it keep sub-folders?", "Yes — the full folder tree is preserved."], ["Can I pick single files too?", "Yes, dropping files works as well."]] });

// ---------- FONTS & CODE ----------
add({ key: "ttf2woff", cat: "font", color: "tool-c-blue", icon: "fa-font", file: "ttf-to-woff.html",
  name: "TTF to WOFF", h1: "TTF to WOFF",
  tagline: "Convert a TTF or OTF font into a web-optimized WOFF.",
  desc: "Convert desktop fonts into web-friendly WOFF.",
  steps: ["Add the .ttf or .otf font.", "It is converted to WOFF.", "Download the WOFF."],
  faq: [["Why WOFF for the web?", "WOFF compresses fonts and is supported by every browser."], ["Do I still need the license?", "Yes — only convert fonts you're allowed to embed."]] });

add({ key: "obj2stl", cat: "font", color: "tool-c-purple", icon: "fa-cube", file: "obj-to-stl.html",
  name: "OBJ to STL", h1: "OBJ to STL",
  tagline: "Convert a 3D model from OBJ to STL for 3D printing.",
  desc: "Convert OBJ 3D models into STL for 3D printing.",
  steps: ["Add the .obj model.", "Triangle mesh is rebuilt as STL.", "Download the STL."],
  faq: [["Which CAD tools export OBJ?", "Blender, Maya and most 3D apps do."], ["Is STL right for printing?", "Yes — STL is the standard slicer input."]] });

// ---------- ACCESSIBILITY & AI ----------
add({ key: "img2text", cat: "special", color: "tool-c-green", icon: "fa-magnifying-glass", file: "image-to-text.html",
  name: "Image to Text", h1: "Image to Text (OCR)",
  tagline: "Extract text from photos and scanned documents with in-browser OCR.",
  desc: "Extract text from images and scans using OCR.",
  steps: ["Drop in a scanned image or photo.", "OCR reads the text locally.", "Download the .txt or copy it."],
  faq: [["Does OCR work offline?", "The OCR engine loads once and runs entirely in your browser."], ["How accurate is it?", "Sharp, well-lit text extracts with high accuracy."]] });

// ---------- Build helpers ----------
const esc = (s) => s
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const byCat = (catId) => T.filter((t) => t.cat === catId);
const catOf = (key) => T.find((t) => t.key === key)?.cat;
const iconOf = (key) => T.find((t) => t.key === key)?.icon;
const nameOf = (key) => T.find((t) => t.key === key)?.name;

const EXISTING = {
  img2pdf: { file: "image-to-pdf.html", name: "Image to PDF", icon: "fa-file-image", color: "tool-c-blue", cat: "doc", desc: "Turn JPG, PNG, or WEBP photos into a single PDF." },
  pdf2img: { file: "pdf-to-image.html", name: "PDF to Image", icon: "fa-images", color: "tool-c-green", cat: "doc", desc: "Turn every page of a PDF into a separate PNG image." },
  doc2pdf: { file: "word-to-pdf.html", name: "Word to PDF", icon: "fa-file-word", color: "tool-c-indigo", cat: "doc", desc: "Turn a .doc or .docx file into a PDF." },
  pdf2doc: { file: "pdf-to-word.html", name: "PDF to Word", icon: "fa-file-pen", color: "tool-c-purple", cat: "doc", desc: "Pull the text out of a PDF into an editable Word file." },
  pdfmerge: { file: "merge-pdf.html", name: "Merge PDF", icon: "fa-object-group", color: "tool-c-cyan", cat: "doc", desc: "Combine multiple PDF files into a single document." },
  pdfsplit: { file: "split-pdf.html", name: "Split PDF", icon: "fa-scissors", color: "tool-c-orange", cat: "doc", desc: "Break a multi-page PDF into single-page files." },
  pdfcompress: { file: "compress-pdf.html", name: "Compress PDF", icon: "fa-file-zipper", color: "tool-c-pink", cat: "doc", desc: "Reduce a PDF's file size for email or upload." },
  imgcompress: { file: "compress-image.html", name: "Compress Image", icon: "fa-compress", color: "tool-c-yellow", cat: "image", desc: "Reduce a photo's file size for faster sharing." },
  heic2jpg: { file: "heic-to-jpg.html", name: "HEIC to JPG", icon: "fa-mobile-screen-button", color: "tool-c-red", cat: "image", desc: "Turn iPhone HEIC photos into standard JPG files." },
};

function cardHTML(t) {
  const isNew = !!t.file && !!t.name;
  const file = isNew ? t.file : EXISTING[t.key].file;
  const name = isNew ? t.name : EXISTING[t.key].name;
  const icon = isNew ? t.icon : EXISTING[t.key].icon;
  const color = isNew ? t.color : EXISTING[t.key].color;
  const desc = isNew ? t.desc : EXISTING[t.key].desc;
  return `        <a class="tool-card ${color}" href="${file}">
            <span class="tool-card-arrow"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
            <span class="tool-card-icon"><i class="fa-solid ${icon}"></i></span>
            <span class="tool-card-name">${name}</span>
            <span class="tool-card-desc">${desc}</span>
        </a>`;
}

function pillHTML() {
  const pills = CATEGORIES.map((c) =>
    `<a class="tool-pill" href="cat/${c.slug}.html"><i class="fa-solid ${c.icon}"></i> ${c.label}</a>`
  ).join("\n    ");
  return `    <span class="tools-subnav-label"><i class="fa-solid fa-screwdriver-wrench"></i> Tools</span>
    ${pills}`;
}

function categorySectionsHTML() {
  return CATEGORIES.map((c) => {
    const tools = byCat(c.id);
    const existing = Object.entries(EXISTING).filter(([, v]) => v.cat === c.id).map(([k]) => k);
    const cards = [...tools.map(cardHTML), ...existing.map((k) => cardHTML({ key: k }))].join("\n");
    return `    <section class="tools-section tool-section" id="cat-${c.id}">
        <div class="section-header cat-head">
            <h3><i class="fa-solid ${c.icon}"></i> ${c.label} <a class="cat-more" href="cat/${c.slug}.html">All ${c.label.toLowerCase()} tools →</a></h3>
            <p>${c.blurb}</p>
        </div>
        <div class="tool-grid">
${cards}
        </div>
    </section>`;
  }).join("\n\n");
}

function itemListJSON() {
  const existing = Object.keys(EXISTING).map((k) => ({ name: EXISTING[k].name, file: EXISTING[k].file }));
  const all = [...existing, ...T.map((t) => ({ name: t.name, file: t.file }))]
    .map((t, i) => `    { "@type": "SiteNavigationElement", "position": ${i + 1}, "name": "${t.name}", "url": "${BASE}/${t.file}" }`)
    .join(",\n");
  return `  "itemListElement": [
${all}
  ]`;
}

function toolPage(t) {
  const faq = t.faq.map(([q, a]) =>
    `    { "@type": "Question", "name": ${JSON.stringify(q)}, "acceptedAnswer": { "@type": "Answer", "text": ${JSON.stringify(a)} } }`
  ).join(",\n");
  const stepsOL = t.steps.map((s) => `      <li>${s}</li>`).join("\n");
  const faqDL = t.faq.map(([q, a]) => `      <dt>${esc(q)}</dt>\n      <dd>${esc(a)}</dd>`).join("\n");
  const url = `${BASE}/${t.file}`;
  const title = `${t.h1} Converter — Free, No Upload | Swapfile`;
  const rt = RUNTIME[t.key] || { accept: "", multiple: false, dropHint: "" };
  const acceptText = acceptLabel(rt.accept);
  const outText = OUTPUT[t.key] || "a converted file";
  const limitText = LIMIT[t.key] || LIMIT_DEFAULT;

  // Structured data: one graph, so WebApplication / HowTo / FAQ / breadcrumbs
  // share @ids instead of being four disconnected blobs.
  const stepNames = ["Add your file", "Run the conversion", "Download the result"];
  const stepJSON = t.steps.map((s, i) => {
    const first = s.split(/[.,—]/)[0].trim();
    const name = first.length > 3 && first.length < 60 ? first : stepNames[i] || "Convert";
    return `    { "@type": "HowToStep", "position": ${i + 1}, "name": ${JSON.stringify(name)}, "text": ${JSON.stringify(s)} }`;
  }).join(",\n");

  const ld = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "${url}#app",
      "name": "Swapfile — ${t.h1}",
      "url": "${url}",
      "applicationCategory": "UtilitiesApplication",
      "applicationSubCategory": "File Converter",
      "operatingSystem": "Any (runs in browser)",
      "browserRequirements": "Requires JavaScript. Works on Windows, macOS, Linux, Android and iOS.",
      "isAccessibleForFree": true,
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "featureList": ["No upload — files never leave your device", "No sign-up", "Works offline after first load", "Free forever"],
      "description": ${JSON.stringify(t.desc)}
    },
    {
      "@type": "HowTo",
      "@id": "${url}#howto",
      "name": ${JSON.stringify(`How to use the ${t.h1} converter`)},
      "description": ${JSON.stringify(t.tagline)},
      "totalTime": "PT2M",
      "tool": [{ "@type": "HowToTool", "name": "Any modern web browser" }],
      "step": [
${stepJSON}
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "${url}#faq",
      "mainEntity": [
${faq}
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "${url}#crumbs",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE}/" },
        { "@type": "ListItem", "position": 2, "name": "Free Online Tools", "item": "${BASE}/index.html" },
        { "@type": "ListItem", "position": 3, "name": ${JSON.stringify(t.h1)}, "item": "${url}" }
      ]
    }
  ]
}
</script>`;

  // Related tools: same category first, then the rest, so every page passes
  // authority sideways instead of dead-ending on a 160-word page.
  const sameCat = [
    ...byCat(t.cat).filter((x) => x.key !== t.key).map((x) => ({ file: x.file, name: x.name })),
    ...Object.entries(EXISTING).filter(([, v]) => v.cat === t.cat).map(([, v]) => ({ file: v.file, name: v.name })),
  ];
  const otherCat = [
    ...T.filter((x) => x.cat !== t.cat).map((x) => ({ file: x.file, name: x.name })),
    ...Object.entries(EXISTING).filter(([, v]) => v.cat !== t.cat).map(([, v]) => ({ file: v.file, name: v.name })),
  ];
  const link = (x) => `      <li><a href="${x.file}">${esc(x.name)}</a></li>`;
  const relatedHTML = sameCat.map(link).join("\n");
  const otherHTML = otherCat.map(link).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<script src="../../analytics.js" defer></script>
<script src="../../ads.js"></script>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${t.h1} Converter — Free, No Upload | Swapfile</title>
<meta name="description" content="${t.desc} Runs 100% in your browser — nothing is uploaded." />
<link rel="canonical" href="${BASE}/${t.file}" />
<meta name="theme-color" content="#050510" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Swapfile by CyberNovaWorks" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${t.desc}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${OG_IMAGE}" />
<meta property="og:image:secure_url" content="${OG_IMAGE}" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="${OG_W}" />
<meta property="og:image:height" content="${OG_H}" />
<meta property="og:image:alt" content="${esc(t.h1)} — free browser-based converter by Swapfile" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${t.desc}" />
<meta name="twitter:image" content="${OG_IMAGE}" />
<meta name="twitter:image:alt" content="${esc(t.h1)} — free browser-based converter by Swapfile" />
<link rel="manifest" href="manifest.json" />
<link rel="icon" href="icon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="${OG_IMAGE}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="https://cdnjs.cloudflare.com" />
<link rel="preconnect" href="https://www.googletagmanager.com" />
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
<link rel="stylesheet" href="../../styles.css" />
<link rel="stylesheet" href="styles.css" />
${ld}
</head>
<body data-tool="${t.key}">

<header class="navbar" id="navbar">
    <div class="logo">
        <a href="../../index.html">
            <span class="logo-text">CyberNovaWorks</span><span class="logo-dot">.</span><span class="logo-store">store</span>
        </a>
    </div>

    <div class="menu-toggle" id="mobile-menu">
        <i class="fa-solid fa-bars"></i>
    </div>

    <nav class="nav-links">
        <a href="../../index.html">Home</a>
        <a href="../../about.html">About Us</a>
        <a href="../../web-development.html">Services</a>
        <a href="../../store.html" class="nav-store-link"><i class="fa-solid fa-bag-shopping"></i> Store</a>
        <a href="index.html" class="active">Tools</a>
        <a href="../../blog/index.html">Blog</a>
        <a href="../../contact.html">Contact</a>
    </nav>
    <div class="nav-action">
        <a href="../../contact.html" class="btn btn-outline glow-blue">Get a Quote</a>
    </div>
</header>

<div class="wrap">

  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="../../index.html">Home</a> <span>/</span> <a href="index.html">Free Tools</a> <span>/</span> <span aria-current="page">${esc(t.h1)}</span>
  </nav>

  <header class="hero">
    <h1>${t.h1}</h1>
    <p class="tagline">${t.tagline}</p>
  </header>

  <main class="panel">
    <div class="dropzone" id="dropzone" tabindex="0" role="button" aria-label="Choose files">
      <input type="file" id="fileInput" hidden />
      <svg class="drop-icon" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <path d="M12 4v11m0-11l-4 4m4-4l4 4M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p class="drop-label" id="dropLabel">Drop a file here, or click to browse</p>
      <p class="drop-hint" id="dropHint">No upload — everything runs in your browser</p>
    </div>

    <ul class="filelist" id="fileList" aria-live="polite"></ul>

${t.panelExtra ? t.panelExtra + "\n" : ""}    <button class="convert-btn" id="convertBtn" disabled>${t.btnLabel || "Convert"}</button>

    <div class="results" id="results" aria-live="polite"></div>
  </main>

  <section class="about">
    <h2>How to use the ${esc(t.h1)} converter</h2>
    <ol class="steps">
${stepsOL}
    </ol>

    <h2>What you can convert</h2>
    <p>Drop in ${esc(acceptText)}. ${rt.multiple
      ? "You can add several files in one go and convert them together, which saves time when you are working through a whole folder."
      : "One file at a time keeps the output predictable, and the convert button stays disabled until a file is in place."}</p>
    <p>The result comes back as ${esc(outText)}.${rt.dropHint ? ` ${esc(rt.dropHint)}.` : ""}</p>

    <h2>Why run it in your browser</h2>
    <p>Most online converters work the same way: you upload a file, it lands on somebody's server, gets written to a temporary folder, and is deleted afterwards. That is fine right up until the day you are converting an unreleased product mockup, a signed contract, or a client's bank statement — because all you get is a promise, not a fact.</p>
    <p>This converter never sends your file anywhere. The work happens with JavaScript inside the page you are already looking at, so the bytes never leave your device. That is why there is no upload bar, no "file too large" ceiling, and nothing left behind on a server to delete.</p>
    <p>There is no account to create and no watermark to remove. It also keeps working offline once loaded, which matters on a train or a patchy office Wi-Fi. If you are converting the same kind of file constantly, an automated pipeline is the better route — that is what <a href="../../software-solutions.html">our software solutions</a> are for.</p>

    <h2>Good to know before you start</h2>
    <p>${esc(limitText)}</p>
    <p>Keep the original file until you have checked the output. If the result is not what you expected, try one of the related tools below rather than converting the same file repeatedly.</p>

    <h2>Common questions</h2>
    <dl>
${faqDL}
    </dl>
  </section>

  <nav class="other-tools" aria-label="Related ${esc(t.cat)} tools">
    <h3>Related ${esc((CATEGORIES.find((c) => c.id === t.cat) || {}).label || "tools").toLowerCase()} tools</h3>
    <ul>
${relatedHTML}
      <li><a href="index.html">View all tools →</a></li>
    </ul>
  </nav>

  <nav class="other-tools" aria-label="Every other free tool">
    <h3>All other free tools</h3>
    <ul>
${otherHTML}
    </ul>
  </nav>

  <section class="about">
    <h2>Need this inside your own product?</h2>
    <p>These tools cover one-off jobs. If you need a converter built into your app, a pipeline that handles thousands of files, or a team set up with the right tooling, that is a build job — and we do those.</p>
    <p><a href="../../software-solutions.html">Software solutions</a> · <a href="../../web-development.html">Web development</a> · <a href="../../contact.html">Ask us directly</a></p>
  </section>

</div>

<footer class="footer">
    <div class="footer-content">
        <div class="footer-logo">
            <a href="../../index.html" style="text-decoration: none;">
                <span class="logo-text">CyberNovaWorks</span><span class="logo-dot">.</span><span class="logo-store">store</span>
            </a>
        </div>
        <div class="footer-nav">
            <a href="../../index.html">Home</a>
            <a href="../../about.html">About</a>
            <a href="../../web-development.html">Web Development</a>
            <a href="../../app-development.html">App Development</a>
            <a href="../../graphic-design.html">Graphic Design</a>
            <a href="../../software-solutions.html">Software Solutions</a>
            <a href="../../store.html">Store</a>
            <a href="../../blog/index.html">Blog</a>
            <a href="index.html">Free Tools</a>
            <a href="../../contact.html">Contact</a>
            <a href="../../privacy.html">Privacy Policy</a>
        </div>
        <div class="footer-socials">
            <a href="https://www.linkedin.com/company/cybernovaworks" target="_blank" rel="noopener noreferrer" aria-label="CyberNovaWorks on LinkedIn"><i class="fa-brands fa-linkedin"></i></a>
            <a href="https://x.com/cybernovaworks" target="_blank" rel="noopener noreferrer" aria-label="CyberNovaWorks on X (Twitter)"><i class="fa-brands fa-x-twitter"></i></a>
            <a href="https://www.instagram.com/cybernovaworks" target="_blank" rel="noopener noreferrer" aria-label="CyberNovaWorks on Instagram"><i class="fa-brands fa-instagram"></i></a>
            <a href="https://github.com/cybernovaworks-bit" target="_blank" rel="noopener noreferrer" aria-label="CyberNovaWorks on GitHub"><i class="fa-brands fa-github"></i></a>
        </div>
    </div>
    <div class="footer-bottom">
        <p>&copy; 2026 CyberNovaWorks.store. All rights reserved.</p>
    </div>
</footer>

<div id="stars-container"></div>

<a href="https://wa.me/918092638177?text=Hi%20CyberNovaWorks!%20I%20need%20a%20quote." class="wa-float" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
    <i class="fa-brands fa-whatsapp"></i>
    <span class="wa-tooltip">Chat on WhatsApp</span>
</a>

<script src="../../script.js"></script>
<script src="converts.js"></script>
<script src="app.js"></script>
</body>
</html>
`;
}

function hubPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script src="../../analytics.js" defer></script>
<script src="../../ads.js"></script>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Free File Tools — 60+ Converters (PDF, Word, Image, Video & More) | Swapfile</title>
<meta name="description" content="60+ free browser tools to convert, merge, split, compress and extract PDF, Word, Excel, image, audio, video and data files. No upload, no sign-up — everything runs in your browser." />
<link rel="canonical" href="${BASE}/index.html" />
<meta name="theme-color" content="#050510" />
<meta property="og:type" content="website" />
<meta property="og:title" content="Swapfile — 60+ Free Browser Tools" />
<meta property="og:description" content="Convert, merge, compress and extract 60+ file formats free, right in your browser." />
<meta property="og:url" content="${BASE}/index.html" />
<meta property="og:image" content="${SITE}/images/og-image.png" />
<meta property="og:site_name" content="CyberNovaWorks" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Swapfile — 60+ Free Browser Tools" />
<meta name="twitter:description" content="Convert, merge, compress and extract 60+ file formats free, right in your browser." />
<meta name="twitter:image" content="${SITE}/images/og-image.png" />
<link rel="manifest" href="manifest.json" />
<link rel="icon" href="icon.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="https://cdnjs.cloudflare.com" />
<link rel="stylesheet" href="../../styles.css" />
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
<style>
    .tools-section {
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 6% 30px;
        scroll-margin-top: 130px;
    }
    .tool-section {
        margin-top: 26px;
        padding-top: 6px;
    }
    .tool-section .cat-head h3 {
        font-family: var(--font-heading);
        font-size: 1.25rem;
        color: var(--vibrant-blue);
        margin: 0 0 6px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .tool-section .cat-head p { margin: 0 0 16px; color: var(--text-muted); font-size: 0.92rem; }
    html.theme-light .tool-section .cat-head h3 { color: #FF9A2A; }
    .tool-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
    }
    @media (max-width: 1024px) { .tool-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .tool-grid { grid-template-columns: 1fr; } }

    .tool-card {
        --tc: var(--vibrant-blue);
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 9px;
        padding: 22px 20px;
        border-radius: 18px;
        background: linear-gradient(135deg, rgba(0,229,255,0.06), rgba(138,43,226,0.04));
        border: 1px solid rgba(255,255,255,0.12);
        text-decoration: none;
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    }
    .tool-card::before {
        content: "";
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--tc), transparent);
        opacity: 0.7;
        transition: opacity 0.3s ease;
    }
    .tool-card:hover {
        transform: translateY(-6px);
        border-color: var(--tc);
        box-shadow: 0 14px 36px rgba(0,0,0,0.45), 0 0 22px rgba(0,229,255,0.12);
    }
    .tool-card:hover::before { opacity: 1; }

    .tool-card-icon {
        width: 46px; height: 46px;
        border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.25rem;
        color: #fff;
        background: linear-gradient(135deg, var(--tc), rgba(255,255,255,0.12));
        box-shadow: 0 6px 16px rgba(0,0,0,0.35);
        text-shadow: 0 1px 6px rgba(0,0,0,0.4);
        transition: transform 0.3s ease;
    }
    .tool-card:hover .tool-card-icon { transform: scale(1.08) rotate(-4deg); }

    .tool-card-name {
        font-family: var(--font-heading);
        font-weight: 700;
        font-size: 1rem;
        color: #fff;
    }
    .tool-card-desc {
        font-size: 0.8rem;
        color: var(--text-muted);
        line-height: 1.5;
        margin: 0;
    }
    .tool-card-arrow {
        position: absolute;
        top: 18px; right: 16px;
        color: rgba(255,255,255,0.28);
        font-size: 0.8rem;
        transition: all 0.3s ease;
    }
    .tool-card:hover .tool-card-arrow {
        color: var(--tc);
        transform: translate(3px,-3px);
    }

    .tool-c-blue   { --tc: #00E5FF; }
    .tool-c-green  { --tc: #10B981; }
    .tool-c-indigo { --tc: #6366F1; }
    .tool-c-purple { --tc: #8A2BE2; }
    .tool-c-cyan   { --tc: #22D3EE; }
    .tool-c-orange { --tc: #F97316; }
    .tool-c-pink   { --tc: #EC4899; }
    .tool-c-yellow { --tc: #F5B018; }
    .tool-c-red    { --tc: #E8112D; }

    .tools-subnav {
        position: sticky;
        z-index: 90;
        top: 44px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 6%;
        overflow-x: auto;
        scrollbar-width: thin;
        background: rgba(8,8,24,0.88);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(0,229,255,0.18);
        box-shadow: 0 8px 26px rgba(0,0,0,0.4);
    }
    .tools-subnav::-webkit-scrollbar { height: 6px; }
    .tools-subnav::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.3); border-radius: 4px; }
    .tools-subnav-label {
        flex-shrink: 0;
        display: inline-flex; align-items: center; gap: 8px;
        font-family: var(--font-heading);
        font-size: 0.72rem; font-weight: 800;
        letter-spacing: 1.5px; text-transform: uppercase;
        color: var(--vibrant-blue);
        text-shadow: 0 0 10px rgba(0,229,255,0.4);
        margin-right: 4px; padding-right: 14px;
        border-right: 1px solid rgba(255,255,255,0.12);
    }
    .tool-pill {
        flex-shrink: 0;
        display: inline-flex; align-items: center; gap: 7px;
        padding: 8px 15px;
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(255,255,255,0.05);
        color: rgba(255,255,255,0.72);
        font-family: var(--font-heading);
        font-weight: 600; font-size: 0.76rem;
        text-decoration: none; white-space: nowrap;
        transition: all 0.25s ease;
    }
    .tool-pill i { font-size: 0.8rem; }
    .tool-pill:hover {
        color: #fff;
        border-color: var(--vibrant-blue);
        background: rgba(0,229,255,0.1);
        box-shadow: 0 0 14px rgba(0,229,255,0.25);
        transform: translateY(-1px);
    }
    html.theme-light .tools-subnav {
        background: rgba(21,15,38,0.9);
        border-bottom: 1px solid rgba(255,122,0,0.3);
    }
    html.theme-light .tools-subnav-label { color: #FFB03A; }
    html.theme-light .tool-pill {
        color: rgba(255,255,255,0.7);
        border-color: rgba(255,255,255,0.16);
        background: rgba(255,255,255,0.06);
    }
    html.theme-light .tool-pill:hover { color: #FFB03A; border-color: rgba(255,176,58,0.6); }
    html.theme-light .tool-card {
        background: linear-gradient(115deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 42%), linear-gradient(180deg, #ffffff 0%, #fffaf1 100%);
        border: 1px solid rgba(255,176,58,0.35);
    }
    html.theme-light .tool-card:hover { border-color: var(--tc); }
    html.theme-light .tool-card-name { color: #2a1d0e; }
    html.theme-light .tool-card-desc { color: #6d5f4a; }
    html.theme-light .tool-card .tool-card-arrow { color: rgba(120,70,10,0.35); }
    html.theme-light .page-hero h1 { color: #f7f1e3; }
    html.theme-light .page-hero p  { color: #b9ae9c; }
    .hero-mark {
        margin-bottom: 14px;
    }
    .hero-mark svg {
        color: var(--vibrant-blue);
    }
    .about-sec {
        max-width: 900px;
        margin: 0 auto;
        padding: 30px 10% 60px;
    }
    .about-sec h3 {
        font-size: 1.15rem;
        margin: 26px 0 10px;
        color: var(--vibrant-blue);
    }
    .about-sec p {
        color: var(--text-muted);
        font-size: 1rem;
        line-height: 1.7;
    }
    .about-sec dl {
        margin: 0;
    }
    .about-sec dt {
        font-family: var(--font-heading);
        font-weight: 700;
        color: var(--text-main);
        margin-top: 14px;
    }
    .about-sec dd {
        color: var(--text-muted);
        margin: 4px 0 0;
        font-size: 0.95rem;
        line-height: 1.6;
    }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Swapfile",
  "url": "${BASE}/index.html"
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
${itemListJSON()}
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Is Swapfile free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes \\u2014 every tool is free to use, with no account or sign-up." } },
    { "@type": "Question", "name": "Are my files uploaded anywhere?", "acceptedAnswer": { "@type": "Answer", "text": "No. Conversion happens locally in your browser using JavaScript; files never leave your device." } },
    { "@type": "Question", "name": "Is there a file size limit?", "acceptedAnswer": { "@type": "Answer", "text": "Only the limits of your own device's memory \\u2014 very large files may be slower to process." } },
    { "@type": "Question", "name": "Do video tools need special software?", "acceptedAnswer": { "@type": "Answer", "text": "No. A small video engine loads once in your browser on first use, then converts files locally." } }
  ]
}
</script>
</head>
<body>

<header class="navbar" id="navbar">
    <div class="logo">
        <a href="../../index.html">
            <span class="logo-text">CyberNovaWorks</span><span class="logo-dot">.</span><span class="logo-store">store</span>
        </a>
    </div>

    <div class="menu-toggle" id="mobile-menu">
        <i class="fa-solid fa-bars"></i>
    </div>

    <nav class="nav-links">
        <a href="../../index.html">Home</a>
        <a href="../../about.html">About Us</a>
        <a href="../../web-development.html">Services</a>
        <a href="../../store.html" class="nav-store-link"><i class="fa-solid fa-bag-shopping"></i> Store</a>
        <a href="index.html" class="active">Tools</a>
        <a href="../../blog/index.html">Blog</a>
        <a href="../../contact.html">Contact</a>
    </nav>
    <div class="nav-action">
        <a href="../../contact.html" class="btn btn-outline glow-blue">Get a Quote</a>
    </div>
</header>

<!-- Tools sub-navigation bar -->
<div class="tools-subnav" id="toolsSubnav">
${pillHTML()}
</div>

<section class="page-hero">
    <div class="hero-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="44" height="44">
            <rect x="6" y="4" width="22" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="2.5"/>
            <rect x="20" y="14" width="22" height="30" rx="2" fill="#12201D" stroke="currentColor" stroke-width="2.5"/>
            <path d="M14 40 L20 34 L14 28" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </div>
    <h1>60+ free file tools that never leave your browser</h1>
    <p>Swapfile is a small toolbox for everyday file problems — merging PDFs, shrinking a photo, turning a Word doc into a PDF, ripping a video to MP3. Every tool runs on your device with JavaScript, so nothing is ever uploaded to a server.</p>
</section>

${categorySectionsHTML()}

<section class="about about-sec">
    <div class="section-header">
        <h2>Why <span class="text-blue">Swapfile</span> is different</h2>
        <p>Most online file converters upload your document to a server before processing it. Swapfile does the work directly in your browser using JavaScript, so your files never leave your device — no privacy trade-off, no waiting on an upload.</p>
    </div>

    <h3>Common questions</h3>
    <dl>
        <dt>Is Swapfile free?</dt>
        <dd>Yes — every tool is free to use, with no account or sign-up.</dd>
        <dt>Are my files uploaded anywhere?</dt>
        <dd>No. Conversion happens locally in your browser using JavaScript; files never leave your device.</dd>
        <dt>Do video tools need special software?</dt>
        <dd>No. A small video engine loads into your browser on first use (about 30 MB, cached after that), then converts entirely on your device.</dd>
        <dt>Is there a file size limit?</dt>
        <dd>Only the limits of your own device's memory — very large files may be slower to process.</dd>
    </dl>
</section>

<footer class="footer">
    <div class="footer-content">
        <div class="footer-logo">
            <a href="../../index.html" style="text-decoration: none;">
                <span class="logo-text">CyberNovaWorks</span><span class="logo-dot">.</span><span class="logo-store">store</span>
            </a>
        </div>
        <div class="footer-nav">
            <a href="../../index.html">Home</a>
            <a href="../../about.html">About</a>
            <a href="../../web-development.html">Web Development</a>
            <a href="../../app-development.html">App Development</a>
            <a href="../../graphic-design.html">Graphic Design</a>
            <a href="../../software-solutions.html">Software Solutions</a>
            <a href="../../store.html">Store</a>
            <a href="../../blog/index.html">Blog</a>
            <a href="index.html">Free Tools</a>
            <a href="../../contact.html">Contact</a>
            <a href="../../privacy.html">Privacy Policy</a>
        </div>
        <div class="footer-socials">
            <a href="https://www.linkedin.com/company/cybernovaworks" target="_blank" rel="noopener noreferrer" aria-label="CyberNovaWorks on LinkedIn"><i class="fa-brands fa-linkedin"></i></a>
            <a href="https://x.com/cybernovaworks" target="_blank" rel="noopener noreferrer" aria-label="CyberNovaWorks on X (Twitter)"><i class="fa-brands fa-x-twitter"></i></a>
            <a href="https://www.instagram.com/cybernovaworks" target="_blank" rel="noopener noreferrer" aria-label="CyberNovaWorks on Instagram"><i class="fa-brands fa-instagram"></i></a>
            <a href="https://github.com/cybernovaworks-bit" target="_blank" rel="noopener noreferrer" aria-label="CyberNovaWorks on GitHub"><i class="fa-brands fa-github"></i></a>
        </div>
    </div>
    <div class="footer-bottom">
        <p>&copy; 2026 CyberNovaWorks.store. All rights reserved.</p>
    </div>
</footer>

<div id="stars-container"></div>

<a href="https://wa.me/918092638177?text=Hi%20CyberNovaWorks!%20I%20need%20a%20quote." class="wa-float" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
    <i class="fa-brands fa-whatsapp"></i>
    <span class="wa-tooltip">Chat on WhatsApp</span>
</a>

<script src="../../script.js"></script>
</body>
</html>
`;
}

function homeToolsHTML() {
  const rows = CATEGORIES.map((c) => {
    const tools = byCat(c.id).map((t) => cardHomeChip(t));
    const existing = Object.entries(EXISTING).filter(([, v]) => v.cat === c.id).map(([k]) => EXISTING[k]);
    const chips = [...tools, ...existing.map(cardHomeChip)].join("\n            ");
    return `        <div class="home-tools-cat">
            <h4><i class="fa-solid ${c.icon}"></i> ${c.label}</h4>
            <div class="home-tools-chips">
            ${chips}
            </div>
        </div>`;
  }).join("\n\n");

  return `    <!-- Tools Section — Free Online Tools -->
    <section id="tools" class="tools-section">
        <div class="section-header">
            <h2>Free Online <span class="text-blue">Tools</span></h2>
            <p>60+ Converters for PDFs, Word, Images, Audio, Video & More — 100% Free, Runs in Your Browser</p>
        </div>

        <div class="home-tools-wrap">
${rows}
        </div>

        <div class="tools-action">
            <a href="tools/swapfile/index.html" class="btn btn-primary glow-blue">Open All Tools</a>
        </div>
    </section>`;
}

function cardHomeChip(t) {
  const file = t.file || t.name.toLowerCase().replaceAll(" ", "-") + ".html";
  const name = t.name || (t.key || "tool");
  const icon = t.icon || "fa-file";
  return `<a class="home-tool-chip" href="tools/swapfile/${file}" title="${name}">
                <i class="fa-solid ${icon}"></i><span>${name}</span>
            </a>`;
}

// Every page the hub links to, so the sitemap can never drift from the tool list again.
// lastmod is stamped at build time: without it Google has no signal that a page changed.
function swapfileSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${BASE}/index.html`, priority: "0.9", freq: "weekly" },
    ...catHubFiles().map((f) => ({ loc: `${BASE}/${f.file}`, priority: "0.8", freq: "weekly" })),
    ...T.map((t) => ({ loc: `${BASE}/${t.file}`, priority: "0.7", freq: "monthly" })),
    ...Object.values(EXISTING).map((v) => ({ loc: `${BASE}/${v.file}`, priority: "0.7", freq: "monthly" })),
  ]
    .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

// ---------- Category hub pages ----------
// Individual tool pages rank for "pdf to word" and similar. These exist for the
// broader, more valuable queries — "free pdf tools", "image converter online" —
// which have no single tool to point at. Without them that traffic has nowhere
// on the site to land.
const catHubFiles = () => CATEGORIES.map((c) => ({ file: `cat/${c.slug}.html`, cat: c }));

function categoryPage(c) {
  const url = `${BASE}/cat/${c.slug}.html`;
  const tools = byCat(c.id).map((t) => ({ file: t.file, name: t.name, desc: t.desc, icon: t.icon, color: t.color }));
  const existing = Object.entries(EXISTING)
    .filter(([, v]) => v.cat === c.id)
    .map(([, v]) => ({ file: v.file, name: v.name, desc: v.desc, icon: v.icon, color: v.color }));
  const all = [...tools, ...existing];

  const card = (t) => `        <a class="tool-card ${t.color}" href="../${t.file}">
            <span class="tool-card-arrow"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>
            <span class="tool-card-icon"><i class="fa-solid ${t.icon}"></i></span>
            <span class="tool-card-name">${esc(t.name)}</span>
            <span class="tool-card-desc">${esc(t.desc)}</span>
        </a>`;

  // A plain-language list of what each tool does, so the page reads as a useful
  // index even before the grid is scanned.
  const itemList = all.map((t, i) =>
    `    { "@type": "ListItem", "position": ${i + 1}, "name": ${JSON.stringify(t.name)}, "url": "${BASE}/${t.file}" }`
  ).join(",\n");

  const siblings = CATEGORIES.filter((x) => x.id !== c.id)
    .map((x) => `      <li><a href="${x.slug}.html">${esc(x.label)} tools</a></li>`).join("\n");

  const faq = [
    [`Are these ${c.label.toLowerCase()} tools really free?`,
     "Yes. Every tool on this page is free, with no account, no watermark and no usage limit. They are funded by our development work, not by charging for conversions."],
    ["Do my files get uploaded?",
     "No. Each tool converts your file with JavaScript inside your own browser, so the file never travels to a server. That also means the only size limit is your device's memory."],
    ["Can I use these on my phone?",
     "Yes. The tools work on Android and iOS as well as desktop, and they keep working offline once the page has loaded."],
    ["Something went wrong. Why?",
     "The usual causes are a very large file on a low-memory phone, or an unusual variant of the format. Converters that re-encode video are the slowest, because they do real work rather than just repackaging."],
  ];
  const faqLD = faq.map(([q, a]) =>
    `    { "@type": "Question", "name": ${JSON.stringify(q)}, "acceptedAnswer": { "@type": "Answer", "text": ${JSON.stringify(a)} } }`
  ).join(",\n");
  const faqHTML = faq.map(([q, a]) => `      <dt>${esc(q)}</dt>\n      <dd>${esc(a)}</dd>`).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<script src="../../../analytics.js" defer></script>
<script src="../../../ads.js"></script>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${c.title} — ${all.length} Free Online Tools | Swapfile</title>
<meta name="description" content="${esc(c.intro)}" />
<link rel="canonical" href="${url}" />
<meta name="theme-color" content="#050510" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Swapfile by CyberNovaWorks" />
<meta property="og:title" content="${c.title} — ${all.length} Free Online Tools" />
<meta property="og:description" content="${esc(c.intro)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${OG_IMAGE}" />
<meta property="og:image:width" content="${OG_W}" />
<meta property="og:image:height" content="${OG_H}" />
<meta property="og:image:alt" content="${esc(c.h1)} by Swapfile" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${c.title} — ${all.length} Free Online Tools" />
<meta name="twitter:description" content="${esc(c.intro)}" />
<meta name="twitter:image" content="${OG_IMAGE}" />
<link rel="manifest" href="../manifest.json" />
<link rel="icon" href="../icon.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="https://cdnjs.cloudflare.com" />
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
<link rel="stylesheet" href="../../../styles.css" />
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "${url}#page",
      "url": "${url}",
      "name": ${JSON.stringify(c.title)},
      "description": ${JSON.stringify(c.intro)},
      "inLanguage": "en",
      "isPartOf": { "@id": "${BASE}/index.html#page" },
      "breadcrumb": { "@id": "${url}#crumbs" }
    },
    {
      "@type": "ItemList",
      "@id": "${url}#list",
      "name": ${JSON.stringify(c.title)},
      "numberOfItems": ${all.length},
      "itemListElement": [
${itemList}
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "${url}#faq",
      "mainEntity": [
${faqLD}
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "${url}#crumbs",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE}/" },
        { "@type": "ListItem", "position": 2, "name": "Free Online Tools", "item": "${BASE}/index.html" },
        { "@type": "ListItem", "position": 3, "name": ${JSON.stringify(c.label)}, "item": "${url}" }
      ]
    }
  ]
}
</script>
</head>
<body>

<header class="navbar" id="navbar">
    <div class="logo">
        <a href="../../../index.html">
            <span class="logo-text">CyberNovaWorks</span><span class="logo-dot">.</span><span class="logo-store">store</span>
        </a>
    </div>

    <div class="menu-toggle" id="mobile-menu">
        <i class="fa-solid fa-bars"></i>
    </div>

    <nav class="nav-links">
        <a href="../../../index.html">Home</a>
        <a href="../../../about.html">About Us</a>
        <a href="../../../web-development.html">Services</a>
        <a href="../../../store.html" class="nav-store-link"><i class="fa-solid fa-bag-shopping"></i> Store</a>
        <a href="../index.html" class="active"><i class="fa-solid fa-screwdriver-wrench"></i> Tools</a>
        <a href="../../../blog/index.html">Blog</a>
        <a href="../../../contact.html">Contact</a>
    </nav>
    <div class="nav-action">
        <a href="../../../contact.html" class="btn btn-outline glow-blue">Get a Quote</a>
    </div>
</header>

<div class="wrap">

  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="../../../index.html">Home</a> <span>/</span> <a href="../index.html">Free Tools</a> <span>/</span> <span aria-current="page">${esc(c.label)}</span>
  </nav>

  <header class="hero">
    <h1>${esc(c.h1)}</h1>
    <p class="tagline">${esc(c.intro)}</p>
  </header>

  <section class="tools-section tool-section">
    <div class="section-header cat-head">
      <h3><i class="fa-solid ${c.icon}"></i> ${esc(c.label)} — ${all.length} tools</h3>
      <p>${esc(c.blurb)}</p>
    </div>
    <div class="tool-grid">
${all.map(card).join("\n")}
    </div>
  </section>

  <section class="about">
    <h2>How to pick the right ${esc(c.label.toLowerCase())} tool</h2>
    <p>Every tool on this page does one job well, and the name says which job. If you are converting a file once, just take the one that matches your format pair. If you are converting dozens on a schedule, a dedicated tool in a browser is the wrong shape — that is a workflow problem, and it is worth automating properly.</p>
    <p>Two things are worth checking before you start. First, whether your file needs a full re-encode (slower) or just a repackage (instant) — a converter that says "re-encodes" will take noticeably longer. Second, whether the output format supports what you need: MP3 for sharing, WAV for editing, JPG for photos, PNG for anything with text or transparency.</p>

    <h2>Why these tools run in your browser</h2>
    <p>Free online converters usually pay for themselves with your data. The file is uploaded, written to a temporary folder, and deleted "after a while" — which is fine for a holiday photo and a bad idea for a signed contract, an unreleased design, or anything belonging to a client.</p>
    <p>Every tool here runs with JavaScript on your own device instead. Nothing is uploaded, so there is no file-size limit, no queue and nothing to delete. It also means the tools keep working with no connection once loaded, which is useful when the Wi-Fi is the actual problem.</p>

    <h2>Common questions</h2>
    <dl>
${faqHTML}
    </dl>
  </section>

  <nav class="other-tools" aria-label="Other tool categories">
    <h3>Other categories</h3>
    <ul>
${siblings}
      <li><a href="../index.html">View all ${all.length > 0 ? "66" : ""} tools →</a></li>
    </ul>
  </nav>

  <section class="about">
    <h2>Need this done at scale?</h2>
    <p>These tools are built for one file at a time. If you need the same conversion run automatically over hundreds of files, or wired into an app you already have, that is a build job — and we do those.</p>
    <p><a href="../../../software-solutions.html">Software solutions</a> · <a href="../../../web-development.html">Web development</a> · <a href="../../../contact.html">Ask us directly</a></p>
  </section>

</div>

<footer class="footer">
    <div class="footer-content">
        <div class="footer-logo">
            <a href="../../../index.html" style="text-decoration: none;">
                <span class="logo-text">CyberNovaWorks</span><span class="logo-dot">.</span><span class="logo-store">store</span>
            </a>
        </div>
        <div class="footer-nav">
            <a href="../../../index.html">Home</a>
            <a href="../../../about.html">About</a>
            <a href="../../../web-development.html">Web Development</a>
            <a href="../../../app-development.html">App Development</a>
            <a href="../../../graphic-design.html">Graphic Design</a>
            <a href="../../../software-solutions.html">Software Solutions</a>
            <a href="../../../store.html">Store</a>
            <a href="../../../blog/index.html">Blog</a>
            <a href="../index.html">Free Tools</a>
            <a href="../../../contact.html">Contact</a>
            <a href="../../../privacy.html">Privacy Policy</a>
        </div>
        <div class="footer-socials">
            <a href="https://www.linkedin.com/company/cybernovaworks" target="_blank" rel="noopener noreferrer" aria-label="CyberNovaWorks on LinkedIn"><i class="fa-brands fa-linkedin"></i></a>
            <a href="https://x.com/cybernovaworks" target="_blank" rel="noopener noreferrer" aria-label="CyberNovaWorks on X (Twitter)"><i class="fa-brands fa-x-twitter"></i></a>
            <a href="https://www.instagram.com/cybernovaworks" target="_blank" rel="noopener noreferrer" aria-label="CyberNovaWorks on Instagram"><i class="fa-brands fa-instagram"></i></a>
            <a href="https://github.com/cybernovaworks-bit" target="_blank" rel="noopener noreferrer" aria-label="CyberNovaWorks on GitHub"><i class="fa-brands fa-github"></i></a>
        </div>
    </div>
    <div class="footer-bottom">
        <p>&copy; 2026 CyberNovaWorks.store. All rights reserved.</p>
    </div>
</footer>

<a href="https://wa.me/918092638177?text=Hi%20CyberNovaWorks!%20I%20need%20a%20quote." class="wa-float" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
    <i class="fa-brands fa-whatsapp"></i>
    <span class="wa-tooltip">Chat on WhatsApp</span>
</a>

<script src="../../../script.js"></script>
</body>
</html>
`;
}

// ---------- site-wide sitemap, blog feed and news sitemap ----------
// These used to be hand-maintained, which the README notes meant every new tool
// had to be added in three places by hand. They are generated from what is
// actually on disk now, so a page cannot be live and missing from the sitemap.

const ROOT = "../..";
const xmlEsc = (s) => s
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const today = () => new Date().toISOString().slice(0, 10);

// Paths that should never be advertised to a crawler.
const NOINDEX = new Set([
  "404.html", "thank-you.html", "tools/swapfile/home-tools.html",
]);

function listHTML(dir, base = "") {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (name.isDirectory()) {
      if (["apk", "node_modules", ".git", ".gradle", "build", ".idea"].includes(name.name)) continue;
      out.push(...listHTML(join(dir, name.name), `${base}${name.name}/`));
    } else if (name.name.endsWith(".html")) {
      out.push(`${base}${name.name}`);
    }
  }
  return out;
}

const priorityOf = (p) => {
  if (p === "index.html") return "1.0";
  if (p === "tools/swapfile/index.html") return "0.9";
  if (p.startsWith("tools/swapfile/cat/")) return "0.8";
  if (/\/index\.html$/.test(p)) return "0.6";
  if (p.startsWith("tools/swapfile/")) return "0.7";
  if (p.startsWith("blog/")) return "0.6";
  if (["privacy.html", "contact.html"].includes(p)) return "0.3";
  return "0.9";
};

function siteSitemap() {
  const pages = listHTML(ROOT)
    .filter((p) => !NOINDEX.has(p))
    .sort();
  const urls = pages.map((p) => `  <url>
    <loc>${SITE}/${p === "index.html" ? "" : p}</loc>
    <lastmod>${today()}</lastmod>
    <changefreq>${p.endsWith("index.html") ? "weekly" : "monthly"}</changefreq>
    <priority>${priorityOf(p)}</priority>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

// Pulls the fields the feed needs straight out of each post, so a new post only
// has to be written once.
function blogPosts() {
  const dir = join(ROOT, "blog");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".html") && f !== "index.html")
    .map((f) => {
      const src = readFileSync(join(dir, f), "utf8");
      const pick = (re) => (src.match(re) || [, ""])[1].trim();
      const title = pick(/<title>([\s\S]*?)<\/title>/).replace(/\s*\|\s*CyberNovaWorks\s*$/, "");
      return {
        file: f,
        url: `${SITE}/blog/${f}`,
        title,
        desc: pick(/<meta name="description" content="([^"]*)"/),
        date: pick(/"datePublished":\s*"([\d-]+)"/),
        h1: pick(/<h1[^>]*>([\s\S]*?)<\/h1>/).replace(/<[^>]+>/g, ""),
      };
    })
    .filter((p) => p.title && p.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function blogFeed() {
  const posts = blogPosts();
  const items = posts.map((p) => `    <item>
      <title>${xmlEsc(p.title)}</title>
      <link>${p.url}</link>
      <guid isPermaLink="true">${p.url}</guid>
      <pubDate>${new Date(p.date + "T09:00:00Z").toUTCString()}</pubDate>
      <description>${xmlEsc(p.desc)}</description>
    </item>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CyberNovaWorks Blog</title>
    <link>${SITE}/blog/index.html</link>
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <description>Guides on website cost, app development cost and picking the right development company in India.</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

// A news sitemap gets fresh blog pages into the index faster than the main one.
function newsSitemap() {
  const items = blogPosts().map((p) => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${p.date}</lastmod>
    <news:news>
      <news:publication>
        <news:name>CyberNovaWorks.store</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${p.date}</news:publication_date>
      <news:title>${xmlEsc(p.h1 || p.title)}</news:title>
    </news:news>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>
`;
}

// ---------- Main ----------
mkdirSync("cat", { recursive: true });
let count = 0;
for (const t of T) {
  writeFileSync(t.file, toolPage(t));
  count++;
  console.log("wrote", t.file);
}
for (const c of CATEGORIES) {
  writeFileSync(`cat/${c.slug}.html`, categoryPage(c));
  console.log("wrote", `cat/${c.slug}.html`);
}
writeFileSync("index.html", hubPage());
writeFileSync("home-tools.html", homeToolsHTML());
writeFileSync("sitemap.xml", swapfileSitemap());
writeFileSync(join(ROOT, "sitemap.xml"), siteSitemap());
writeFileSync(join(ROOT, "blog", "feed.xml"), blogFeed());
writeFileSync(join(ROOT, "blog", "sitemap-news.xml"), newsSitemap());
console.log(`Generated ${count} tool pages + ${CATEGORIES.length} category pages + index.html + home-tools.html + sitemap.xml`);
console.log(`Also wrote ${ROOT}/sitemap.xml, ${ROOT}/blog/feed.xml, ${ROOT}/blog/sitemap-news.xml`);