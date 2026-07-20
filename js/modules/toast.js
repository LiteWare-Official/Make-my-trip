// ============================================================
// toast.js
// Lightweight toast notification system. Call showToast() from
// anywhere after importing this module — it lazily creates its
// own container so no page markup is required.
// ============================================================

let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }
  return container;
}

const ICONS = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

/**
 * Show a toast notification.
 * @param {string} message - text to display
 * @param {"success"|"error"|"warning"|"info"} type
 * @param {number} duration - ms before auto-dismiss (0 = sticky)
 */
export function showToast(message, type = "info", duration = 3500) {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span style="font-weight:700;">${ICONS[type] || ICONS.info}</span>
    <span>${escapeHtml(message)}</span>
  `;

  getContainer().appendChild(el);

  if (duration > 0) {
    setTimeout(() => dismissToast(el), duration);
  }

  el.addEventListener("click", () => dismissToast(el));

  return el;
}

function dismissToast(el) {
  if (!el || !el.parentElement) return;
  el.classList.add("hide");
  setTimeout(() => el.remove(), 250);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Convenience shorthands
export const toastSuccess = (msg, d) => showToast(msg, "success", d);
export const toastError = (msg, d) => showToast(msg, "error", d);
export const toastWarning = (msg, d) => showToast(msg, "warning", d);
export const toastInfo = (msg, d) => showToast(msg, "info", d);
