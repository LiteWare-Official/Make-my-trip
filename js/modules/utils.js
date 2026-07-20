// ============================================================
// utils.js
// Small shared helpers used across pages/modules: formatting,
// debouncing, query-string parsing, and form validation.
// ============================================================

/** Formats a number as Indian Rupees, e.g. 125000 -> "₹1,25,000" */
export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return "₹" + n.toLocaleString("en-IN");
}

/** Formats a Firestore Timestamp / Date / ISO string as "12 Aug 2026" */
export function formatDate(value) {
  if (!value) return "-";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Formats a Firestore Timestamp / Date as "12 Aug 2026, 4:30 PM" */
export function formatDateTime(value) {
  if (!value) return "-";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (isNaN(date.getTime())) return "-";
  return (
    formatDate(value) +
    ", " +
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  );
}

/** Debounce: delays calling fn until `wait` ms after the last call. */
export function debounce(fn, wait = 350) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/** Reads current URL query params into a plain object. */
export function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

/** Builds a query string from an object, skipping empty values. */
export function buildQueryString(params) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") usp.set(k, v);
  });
  return usp.toString();
}

/** Basic email format check. */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Password strength: min 6 chars (Firebase minimum). */
export function isValidPassword(pw) {
  return typeof pw === "string" && pw.length >= 6;
}

/** Basic 10-digit Indian phone number check. */
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10));
}

/** Generates a short random alphanumeric ID (used for invoice numbers etc.) */
export function generateId(prefix = "") {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${rand}${Date.now().toString().slice(-4)}`;
}

/** Escapes HTML special characters to prevent injection when building strings. */
export function escapeHtml(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/** Renders a star-rating span, e.g. renderStars(4.5) -> "★★★★☆ 4.5" */
export function renderStars(rating = 0) {
  const rounded = Math.round(rating);
  const full = "★".repeat(rounded);
  const empty = "☆".repeat(5 - rounded);
  return `<span class="stars">${full}${empty}</span> <span class="text-muted" style="font-size:.8rem;">${rating.toFixed(
    1
  )}</span>`;
}

/** Truncates text to `len` chars, appending an ellipsis if cut. */
export function truncate(str = "", len = 100) {
  return str.length > len ? str.slice(0, len).trim() + "…" : str;
}

/** Wraps a Firebase error code into a friendly, user-facing message. */
export function friendlyAuthError(error) {
  const map = {
    "auth/email-already-in-use": "This email is already registered. Try logging in instead.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
    "auth/network-request-failed": "Network error. Please check your connection.",
  };
  return map[error?.code] || error?.message || "Something went wrong. Please try again.";
}

/** Shows an inline error message under a form field (expects a matching #<fieldId>-error span). */
export function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  input?.classList.add("is-invalid");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add("show");
  }
}

/** Clears an inline field error (or all fields, if no id given, within a form element). */
export function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  input?.classList.remove("is-invalid");
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.remove("show");
  }
}

export function clearAllFieldErrors(formEl) {
  formEl.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
  formEl.querySelectorAll(".form-error.show").forEach((el) => el.classList.remove("show"));
}

/** Wires up all [data-toggle-password] eye-icon buttons on the page to show/hide their target input. */
export function initPasswordToggles() {
  document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.togglePassword);
      if (!input) return;
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.textContent = isHidden ? "🙈" : "👁";
    });
  });
}

/**
 * Updates a `.password-strength` meter (3 `.bar` children) based on
 * password length/composition. Call on the password field's `input` event.
 */
export function updatePasswordStrength(password, meterEl) {
  if (!meterEl) return;
  const bars = meterEl.querySelectorAll(".bar");
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (password.length >= 12 && /[^A-Za-z0-9]/.test(password)) score++;

  const level = score === 0 ? "" : score === 1 ? "weak" : score === 2 ? "medium" : "strong";
  bars.forEach((bar, i) => {
    bar.className = "bar";
    if (i < score || (score > 0 && i === 0)) {
      bar.classList.add(level || "weak");
    }
  });
}
