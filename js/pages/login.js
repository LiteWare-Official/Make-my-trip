// ============================================================
// login.js
// Controller for /pages/login.html
// ============================================================

import { loginWithEmail, loginWithGoogle, onAuthChange } from "../modules/auth.js";
import { renderNavbar } from "../modules/navbar.js";
import { renderFooter } from "../modules/footer.js";
import { showToast } from "../modules/toast.js";
import {
  isValidEmail,
  friendlyAuthError,
  showFieldError,
  clearAllFieldErrors,
  initPasswordToggles,
  getQueryParams,
} from "../modules/utils.js";

renderNavbar();
renderFooter();
initPasswordToggles();

// If a user is already logged in, skip the login page entirely.
onAuthChange((user) => {
  if (user) {
    const { redirect } = getQueryParams();
    window.location.href = redirect || "/index.html";
  }
});

const form = document.getElementById("login-form");
const submitBtn = document.getElementById("login-submit-btn");
const btnText = document.getElementById("login-btn-text");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAllFieldErrors(form);

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  let hasError = false;
  if (!isValidEmail(email)) {
    showFieldError("login-email", "Please enter a valid email address.");
    hasError = true;
  }
  if (!password) {
    showFieldError("login-password", "Please enter your password.");
    hasError = true;
  }
  if (hasError) return;

  setLoading(true);
  try {
    await loginWithEmail(email, password);
    showToast("Welcome back!", "success");
    // Redirect handled by onAuthChange above once profile loads.
  } catch (err) {
    showToast(friendlyAuthError(err), "error");
    setLoading(false);
  }
});

document.getElementById("google-login-btn").addEventListener("click", async () => {
  try {
    await loginWithGoogle();
    showToast("Welcome!", "success");
  } catch (err) {
    if (err.code !== "auth/popup-closed-by-user") {
      showToast(friendlyAuthError(err), "error");
    }
  }
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.innerHTML = isLoading
    ? '<span class="spinner"></span> Logging in...'
    : "Log In";
}
