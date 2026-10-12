// ============================================================
// CyberNovaWorks.store — Google AdSense (single place to enable)
// ------------------------------------------------------------
// ADS_CLIENT below holds the live publisher ID. Every
// non-homepage page loads this file; index.html (homepage)
// intentionally never does.
//
// To place real ad units: create them in AdSense and replace
// the data-ad-slot="XXXXXXXXXX" values across the site.
// ============================================================
const ADS_CLIENT = "ca-pub-9104500841041054";

if (ADS_CLIENT && !ADS_CLIENT.includes("XXXX")) {
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADS_CLIENT;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
}