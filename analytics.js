/* ==========================================================================
   analytics.js — the ONE place to turn on measurement for the whole site.

   Why this file exists
   --------------------
   Every page used to carry its own inline copy of the GA4 snippet, with a
   placeholder ID. That meant 70+ edits to stand up analytics, and every one of
   them had to be remembered or the site went dark silently.

   Set the two constants below and every page on the site reports.

   1. GA_MEASUREMENT_ID     -> Google Analytics 4, Admin > Data Streams.
   2. SEARCH_CONSOLE_TOKEN  -> Google Search Console > Sitemaps, the
                               "HTML-tag verification" string.

   The verification token is injected by JavaScript rather than hard-coded into
   each <head>. Google renders the page before reading that meta tag, so this
   works exactly the same as a literal tag while keeping a single edit.

   No page renders any analytics request until GA_MEASUREMENT_ID stops being a
   placeholder, so leaving it unset keeps the site fast and cookieless.
   ========================================================================== */

var GA_MEASUREMENT_ID = "G-XXXXXXXXXX";
var SEARCH_CONSOLE_TOKEN = "YOUR_VERIFICATION_TOKEN";

(function () {
  var isReal = function (id) {
    return !!id && id.indexOf("XXXXXXXXXX") === -1 && /^G-[A-Z0-9]+$/.test(id);
  };

  // --- Search Console verification -------------------------------------
  // Only injected when a real token is present, so no stray empty meta tag
  // ships while the site is still being set up.
  if (SEARCH_CONSOLE_TOKEN && SEARCH_CONSOLE_TOKEN.indexOf("YOUR_") !== 0) {
    var meta = document.createElement("meta");
    meta.name = "google-site-verification";
    meta.content = SEARCH_CONSOLE_TOKEN;
    document.head.appendChild(meta);
  }

  if (!isReal(GA_MEASUREMENT_ID)) return;

  // --- GA4 ---------------------------------------------------------------
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    // Outbound links to a client's inbox or WhatsApp are the conversions that
    // actually matter for a services business, so they are tracked as events.
    transport_type: "beacon",
  });

  // --- Conversion tracking ----------------------------------------------
  // Contact forms, the WhatsApp button and every "Get a Quote" link.
  var WHATSAPP = "https://wa.me/";
  var isConversion = function (el) {
    if (!el) return false;
    if (el.matches && el.matches('a[href^="https://formsubmit.co"]')) return true;
    var href = el.getAttribute && el.getAttribute("href");
    if (!href) return false;
    if (href.indexOf(WHATSAPP) === 0) return true;
    return href === "contact.html" || href.indexOf("../contact.html") !== -1 ||
           href.indexOf("../../contact.html") !== -1;
  };

  var conversionName = function (el) {
    var href = (el.getAttribute && el.getAttribute("href")) || "";
    if (href.indexOf(WHATSAPP) === 0) return "whatsapp_click";
    if (href === "contact.html" || href.indexOf("contact.html") !== -1) return "contact_click";
    return "form_start";
  };

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target.closest ? e.target.closest("a, button, form") : null;
      if (!isConversion(el)) return;
      gtag("event", "conversion", {
        event_category: "lead",
        event_label: conversionName(el),
        value: 1,
      });
    },
    true
  );

  // Mark a form as submitted once it has actually been sent, so we can tell a
  // real submission from a click that bounced.
  document.addEventListener("submit", function (e) {
    if (e.target && e.target.tagName === "FORM") {
      gtag("event", "form_submit", { event_category: "lead", value: 1 });
    }
  });
})();
