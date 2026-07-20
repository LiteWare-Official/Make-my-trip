// ============================================================
// theme.js
// Dark/Light mode toggle. Persists choice in localStorage and
// respects the user's OS preference on first visit.
// ============================================================

const STORAGE_KEY = "mmt-theme";

/** Applies the given theme ("light" | "dark") to <html data-theme="">. */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
  updateToggleIcons(theme);
}

function updateToggleIcons(theme) {
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.innerHTML = theme === "dark" ? sunIcon() : moonIcon();
    btn.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  });
}

function sunIcon() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
}

function moonIcon() {
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

/** Call once on every page load, before/after DOM ready. */
export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-toggle");
    if (!btn) return;
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
}
