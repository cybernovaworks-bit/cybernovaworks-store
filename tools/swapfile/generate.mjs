import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "https://cybernovaworks.store/tools/swapfile";
const SITE = "https://cybernovaworks.store";

const CATEGORIES = [
  { id: "doc", label: "Documents", blurb: "PDF, Word, Excel, PowerPoint & more", icon: "fa-file-lines" },
  { id: "audio", label: "Audio", blurb: "Convert, extract & turn text into speech", icon: "fa-music" },
  { id: "video", label: "Video", blurb: "Re-encode, remux, compress & rip", icon: "fa-video" },
  { id: "image", label: "Images", blurb: "Convert between every common format", icon: "fa-image" },
  { id: "data", label: "Data & Spreadsheets", blurb: "CSV, JSON, XML & Excel", icon: "fa-table" },
  { id: "archive", label: "Archive", blurb: "Folders into compressed ZIPs", icon: "fa-box-archive" },
  { id: "font", label: "Fonts & Code", blurb: "Web fonts & 3D models", icon: "fa-font" },
  { id: "special", label: "Accessibility & AI", blurb: "OCR, text-to-speech, vector tracing", icon: "fa-wand-magic-sparkles" },
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
    `<a class="tool-pill" href="#cat-${c.id}"><i class="fa-solid ${c.icon}"></i> ${c.label}</a>`
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
            <h3><i class="fa-solid ${c.icon}"></i> ${c.label}</h3>
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
  const related = byCat(t.cat).filter((x) => x.key !== t.key);
  const relatedExisting = Object.entries(EXISTING).filter(([, v]) => v.cat === t.cat).map(([k]) => k);
  const relatedHTML = [...related.map((x) => x.file), ...relatedExisting.map((k) => EXISTING[k].file)]
    .slice(0, 9)
    .map((f) => `      <li><a href="${f}">${f.replace(".html", "").replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</a></li>`)
    .join("\n");
  const stepsNo = t.faq.length === 2 ? 2 : t.faq.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<!-- Analytics + Search Console: REPLACE G-XXXXXXXXXX and YOUR_VERIFICATION_TOKEN with your real values -->
<meta name="google-site-verification" content="YOUR_VERIFICATION_TOKEN" />
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${t.h1} Converter — Free, No Upload | Swapfile</title>
<meta name="description" content="${t.desc} Runs 100% in your browser — nothing is uploaded." />
<link rel="canonical" href="${BASE}/${t.file}" />
<meta name="theme-color" content="#050510" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${t.h1} Converter — Free, No Upload | Swapfile" />
<meta property="og:description" content="${t.desc}" />
<meta property="og:url" content="${BASE}/${t.file}" />
<meta name="twitter:card" content="summary" />
<link rel="manifest" href="manifest.json" />
<link rel="icon" href="icon.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
<link rel="stylesheet" href="../../styles.css" />
<link rel="stylesheet" href="styles.css" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Swapfile — ${t.h1}",
  "url": "${BASE}/${t.file}",
  "applicationCategory": "Utility",
  "operatingSystem": "Any (runs in browser)",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "description": "${t.desc}"
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
${faq}
  ]
}
</script>
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

    <button class="convert-btn" id="convertBtn" disabled>Convert</button>

    <div class="results" id="results" aria-live="polite"></div>
  </main>

  <section class="about">
    <h2>How it works</h2>
    <ol class="steps">
${stepsOL}
    </ol>

    <h3>Common questions</h3>
    <dl>
${faqDL}
    </dl>
  </section>

  <nav class="other-tools" aria-label="Other tools">
    <h3>Related tools</h3>
    <ul>
${relatedHTML}
      <li><a href="index.html">View all tools →</a></li>
    </ul>
  </nav>

  

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
<!-- Analytics + Search Console: REPLACE G-XXXXXXXXXX and YOUR_VERIFICATION_TOKEN with your real values -->
<meta name="google-site-verification" content="YOUR_VERIFICATION_TOKEN" />
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
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

// ---------- Main ----------
mkdirSync(".", { recursive: true });
let count = 0;
for (const t of T) {
  writeFileSync(t.file, toolPage(t));
  count++;
  console.log("wrote", t.file);
}
writeFileSync("index.html", hubPage());
writeFileSync("home-tools.html", homeToolsHTML());
console.log(`Generated ${count} tool pages + index.html + home-tools.html`);