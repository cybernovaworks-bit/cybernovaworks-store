# Swapfile — File Converter PWA (multi-page, SEO-structured)

An installable, browser-only file toolkit with a separate page per tool for better search
visibility: Image ↔ PDF, Word ↔ PDF, Merge PDF, Split PDF, Compress PDF, Compress Image,
and HEIC → JPG. All conversion happens on-device with JavaScript — no files are uploaded
anywhere.

**Before deploying:** every page's canonical URL and JSON-LD point to
`https://cybernovaworks.store/tools/swapfile/`. If you deploy somewhere else, edit
`_dev/generate_pages.py` (change `BASE_URL`) and rerun it — don't hand-edit the HTML files,
since they're generated. See "Editing content" below.

## What's inside
- `index.html` — homepage / hub page linking to every tool
- `image-to-pdf.html`, `pdf-to-image.html`, `word-to-pdf.html`, `pdf-to-word.html`,
  `merge-pdf.html`, `split-pdf.html`, `compress-pdf.html`, `compress-image.html`,
  `heic-to-jpg.html` — one focused page per tool, each with its own title, meta
  description, H1, intro copy, "how it works" steps, and FAQ (with FAQPage schema)
- `styles.css` — shared visual design
- `app.js` — shared conversion logic (uses jsPDF, pdf.js, mammoth.js, html2pdf.js,
  pdf-lib from cdnjs, heic2any from jsDelivr). Each page tells app.js which tool to run
  via `<body data-tool="...">`.
- `manifest.json` — makes it installable (Add to Home Screen)
- `service-worker.js` — offline caching of all pages
- `icon.svg` — app icon
- `sitemap.xml`, `robots.txt` — for search engine submission
- `_dev/` — the template + Python generator script used to produce the tool pages.
  **Don't upload this folder to your live site** — it's a build tool, not part of the app.

## Why multiple pages instead of one
A single page with tabs can only realistically rank for one search term. Nine separate
pages — each targeting one specific search like "merge pdf" or "heic to jpg converter" —
give Google nine distinct, focused pages to index and rank, each linking to the others
(the "Other tools" list on every page + the homepage grid). This is the same hub-and-spoke
pattern iLovePDF/Smallpdf use.

## Deploy on cybernovaworks.store
1. Upload everything **except the `_dev/` folder** to your hosting, e.g. `yoursite.com/tools/swapfile/`.
2. Make sure the site is served over HTTPS (required for PWA install + service workers).
3. In Google Search Console: add the property, submit `sitemap.xml`, and request indexing
   for each page individually — this speeds up discovery a lot for a brand-new site.
4. Link to a few of the tool pages (not just the homepage) from your site's main navigation
   or blog posts — internal links help Google find and trust the new pages faster.

## Editing content later
Don't hand-edit the generated `.html` files for text/meta changes — edit the `TOOLS` list
inside `_dev/generate_pages.py` (title, meta_desc, intro, faq, etc.) and rerun:
```
cd _dev && python3 generate_pages.py
```
This regenerates all pages, the sitemap, and robots.txt consistently. Structural/visual
changes (layout, CSS) still go in `styles.css` and `_dev/_template_tool.html`.

## Turning it into a Play Store app (optional)
Use **PWA Builder** (pwabuilder.com) or **Bubblewrap** — point it at your live URL and it
will generate a signed Android package (AAB) you can upload to Google Play Console. No
manual Android Studio coding needed.

## Known limits (be upfront with users about these)
- **Word → PDF**: layout is approximated (via HTML rendering), not pixel-perfect for complex documents.
- **PDF → Word**: extracts text only — images, tables, and precise layout are not preserved.
- **PDF → Image / Split PDF**: each page downloads separately (no zip bundling).
- **Compress PDF**: pages are rasterized to shrink size, so the output is no longer
  selectable/searchable text — best suited to scanned or image-heavy PDFs, not text documents.
- **HEIC → JPG**: depends on the `heic2any` library (loaded from jsDelivr) — very new
  or unusual HEIC variants from some Android phones may fail to decode.

## Realistic SEO expectations
Ranking for a single generic word like "pdf" is not realistic for a brand-new domain —
that term is dominated by Adobe, iLovePDF, and Smallpdf with years of authority and
backlinks. This multi-page structure targets specific, lower-competition searches instead
("merge pdf online free", "heic to jpg converter", etc.), which is a genuinely achievable
path to search traffic for a new site.

## Ideas for next iteration
- Bundle PDF → Image / Split PDF outputs into a single .zip (needs JSZip).
- Add a blog/guide page per tool for more long-tail keyword coverage.
- Add a file-size limit warning for very large PDFs (canvas rendering can get slow).
