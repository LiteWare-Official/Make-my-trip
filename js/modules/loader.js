// ============================================================
// loader.js
// Full-page loader (shown while Firebase auth state resolves)
// and small helpers for generating skeleton loading cards.
// ============================================================

/**
 * Inserts the full-page loader markup into the DOM.
 * Call this once near the top of each page's inline bootstrap script,
 * or rely on the static markup already placed in each HTML file.
 */
export function mountPageLoader() {
  if (document.querySelector(".page-loader")) return;
  const loader = document.createElement("div");
  loader.className = "page-loader";
  loader.innerHTML = `
    <div class="logo-loader">
      <div class="logo-mark" style="width:56px;height:56px;border-radius:16px;
        background:linear-gradient(135deg,var(--color-primary),var(--color-secondary));
        display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.6rem;
        animation:pulse 1.2s ease-in-out infinite;">✈</div>
      <div class="spinner spinner-dark"></div>
    </div>
  `;
  document.body.prepend(loader);
}

/** Hides and removes the full-page loader with a fade transition. */
export function hidePageLoader() {
  const loader = document.querySelector(".page-loader");
  if (!loader) return;
  loader.classList.add("hidden");
  setTimeout(() => loader.remove(), 500);
}

/**
 * Returns an HTML string of `count` skeleton cards, matching the
 * dimensions of a real `.card` so layout doesn't jump on load.
 */
export function skeletonCards(count = 8) {
  let html = "";
  for (let i = 0; i < count; i++) {
    html += `
      <div class="card">
        <div class="skeleton" style="aspect-ratio:4/3;border-radius:0;"></div>
        <div class="card-body">
          <div class="skeleton" style="height:18px;width:80%;margin-bottom:10px;"></div>
          <div class="skeleton" style="height:14px;width:50%;margin-bottom:14px;"></div>
          <div class="skeleton" style="height:20px;width:40%;"></div>
        </div>
      </div>`;
  }
  return html;
}

// Keyframe for the loader logo pulse (injected once)
const styleTag = document.createElement("style");
styleTag.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
`;
document.head.appendChild(styleTag);
