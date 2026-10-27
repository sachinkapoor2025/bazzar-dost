const motifs: Record<string, string> = {
  spice: `<g fill="#E8B84A"><circle cx="70" cy="70" r="22"/><circle cx="130" cy="70" r="22"/><circle cx="70" cy="130" r="22"/><circle cx="130" cy="130" r="22"/></g><rect x="48" y="48" width="104" height="104" rx="16" fill="none" stroke="#FBF8F3" stroke-width="6"/>`,
  towel: `<path d="M58 46h84v108H58z" fill="#F4EFE6"/><path d="M70 58h72v96H70z" fill="#E8B84A"/><path d="M82 70h60" stroke="#1B4332" stroke-width="6"/>`,
  bottle: `<rect x="82" y="40" width="36" height="24" rx="6" fill="#E8B84A"/><rect x="70" y="64" width="60" height="100" rx="22" fill="#FBF8F3"/>`,
  tawa: `<ellipse cx="100" cy="108" rx="62" ry="28" fill="#E8B84A"/><rect x="154" y="96" width="28" height="10" rx="4" fill="#FBF8F3"/>`,
  jar: `<rect x="68" y="58" width="64" height="86" rx="14" fill="#FBF8F3"/><rect x="78" y="42" width="44" height="20" rx="6" fill="#E8B84A"/>`,
  cable: `<path d="M40 120c30-70 90-70 120 0" fill="none" stroke="#E8B84A" stroke-width="12" stroke-linecap="round"/><circle cx="40" cy="120" r="10" fill="#FBF8F3"/><rect x="146" y="104" width="22" height="32" rx="4" fill="#FBF8F3"/>`,
  lamp: `<path d="M70 70h60l14 46H56z" fill="#E8B84A"/><rect x="94" y="116" width="12" height="36" fill="#FBF8F3"/><rect x="74" y="150" width="52" height="8" rx="3" fill="#FBF8F3"/>`,
  stand: `<path d="M40 150h120L110 52H90z" fill="#E8B84A"/><rect x="86" y="70" width="28" height="48" rx="4" fill="#FBF8F3"/>`,
  battery: `<rect x="58" y="50" width="84" height="110" rx="12" fill="#FBF8F3"/><rect x="86" y="36" width="28" height="16" rx="3" fill="#E8B84A"/><rect x="74" y="78" width="52" height="54" rx="6" fill="#E8B84A"/>`,
  drop: `<path d="M100 36c28 36 42 58 42 82a42 42 0 0 1-84 0c0-24 14-46 42-82z" fill="#E8B84A"/>`,
  brush: `<rect x="92" y="36" width="16" height="78" rx="6" fill="#FBF8F3"/><path d="M84 112h32v28c0 12-32 12-32 0z" fill="#E8B84A"/>`,
  tote: `<path d="M58 78h84l-8 78H66z" fill="#E8B84A"/><path d="M78 78c0-24 44-24 44 0" fill="none" stroke="#FBF8F3" stroke-width="8"/>`,
  stole: `<path d="M40 70c40 20 80-20 120 0v60c-40-20-80 20-120 0z" fill="#E8B84A"/>`,
  sling: `<rect x="62" y="70" width="76" height="78" rx="18" fill="#E8B84A"/><path d="M78 70c8-28 36-28 44 0" fill="none" stroke="#FBF8F3" stroke-width="8"/>`,
  rings: `<circle cx="100" cy="110" r="46" fill="none" stroke="#E8B84A" stroke-width="10"/><circle cx="100" cy="110" r="24" fill="none" stroke="#FBF8F3" stroke-width="8"/>`,
  crayons: `<path d="M70 150l18-90 24 8-18 82z" fill="#E8B84A"/><path d="M108 146l16-96 22 6-16 90z" fill="#FBF8F3"/>`,
  puzzle: `<path d="M48 48h52v20a16 16 0 0 0 0 32V148H48z" fill="#E8B84A"/><path d="M100 48h52v100H100V100a16 16 0 0 0 0-32z" fill="#FBF8F3"/>`,
  mount: `<rect x="70" y="48" width="60" height="90" rx="8" fill="#FBF8F3"/><rect x="92" y="138" width="16" height="22" fill="#E8B84A"/>`,
  cloth: `<path d="M40 80c20 16 40-16 60 0s40-16 60 0v50c-20-16-40 16-60 0s-40 16-60 0z" fill="#E8B84A"/>`,
  freshener: `<circle cx="100" cy="108" r="36" fill="#E8B84A"/><rect x="94" y="46" width="12" height="28" fill="#FBF8F3"/>`,
  candle: `<rect x="78" y="78" width="44" height="78" rx="8" fill="#FBF8F3"/><path d="M100 40c12 14 12 26 0 36c-12-10-12-22 0-36z" fill="#E8B84A"/>`,
  mug: `<path d="M62 62h76v70a28 28 0 0 1-28 28H90a28 28 0 0 1-28-28z" fill="#E8B84A"/><path d="M138 78h16a18 18 0 0 1 0 36h-16" fill="none" stroke="#FBF8F3" stroke-width="8"/>`,
  cushion: `<rect x="46" y="58" width="108" height="84" rx="18" fill="#E8B84A"/><path d="M46 100h108" stroke="#FBF8F3" stroke-width="6"/>`,
  notebook: `<rect x="58" y="40" width="84" height="120" rx="6" fill="#FBF8F3"/><path d="M78 64h48M78 84h48M78 104h32" stroke="#1B4332" stroke-width="6"/>`,
  tray: `<rect x="42" y="56" width="116" height="88" rx="10" fill="none" stroke="#E8B84A" stroke-width="10"/><path d="M100 56v88M42 100h116" stroke="#FBF8F3" stroke-width="6"/>`,
  pen: `<path d="M70 150l70-110 16 12-70 110z" fill="#E8B84A"/><path d="M140 40l16 12" stroke="#FBF8F3" stroke-width="6"/>`,
  envelope: `<path d="M40 70h120v70H40z" fill="#E8B84A"/><path d="M40 70l60 42 60-42" fill="none" stroke="#FBF8F3" stroke-width="6"/>`,
  market: `<path d="M36 92h128l-14 62H50z" fill="#E8B84A"/><path d="M52 92c8-30 28-30 36 0c8-30 28-30 36 0c8-30 28-30 36 0" fill="none" stroke="#FBF8F3" stroke-width="8"/>`,
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function productSvg(name: string, motif = "market"): string {
  const icon = motifs[motif] || motifs.market;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${escapeXml(name)}">
  <rect width="800" height="800" fill="#F4EFE6"/>
  <circle cx="640" cy="120" r="150" fill="#E8B84A" opacity="0.45"/>
  <circle cx="140" cy="680" r="120" fill="#1B4332" opacity="0.12"/>
  <rect x="90" y="90" width="620" height="620" rx="48" fill="#1B4332"/>
  <svg x="250" y="220" width="300" height="300" viewBox="0 0 200 200">${icon}</svg>
</svg>`;
}

export function categorySvg(name: string): string {
  return productSvg(name, "market");
}

export function markSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="BazaarDost">
    <rect width="64" height="64" rx="16" fill="#1B4332"/>
    <path d="M12 34h40l-4 16H16z" fill="#E8B84A"/>
    <path d="M16 34c3-10 8-10 11 0c3-10 8-10 11 0c3-10 8-10 11 0" fill="none" stroke="#FBF8F3" stroke-width="3"/>
  </svg>`;
}
