// ============================================================
// CyberNovaWorks.store — Google AdSense (single place to enable)
// ------------------------------------------------------------
// To turn ads ON:
//   1. Replace ADS_CLIENT with your real publisher ID.
//   2. Replace the placeholder data-ad-client / data-ad-slot in
//      the <ins> ad units across non-homepage pages.
//   3. Make sure /ads.txt is live with the matching pub- ID.
//
// Homepage (index.html) intentionally never loads this file.
// This script only injects the adsbygoogle loader when a real
// publisher ID is configured (placeholder = no loader, no ads).
// ============================================================
const ADS_CLIENT = "ca-pub-XXXXXXXXXXXXXXX"; // ← paste your real ID

if (ADS_CLIENT && !ADS_CLIENT.includes("XXXX")) {
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADS_CLIENT;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
}