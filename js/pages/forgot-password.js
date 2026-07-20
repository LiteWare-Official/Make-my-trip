// ============================================================
// forgot-password.js
// Controller for /pages/forgot-password.html
// ============================================================

import { resetPassword } from "../modules/auth.js";
import { renderNavbar } from "../modules/navbar.js";
import { renderFooter } from "../modules/footer.js";
import { showToast } from "../modules/toast.js";
import {
  isValidEmail,
  friendlyAuthError,
  showFieldError,
  clearAllFieldErrors,
} from "../modules/utils.js";

renderNavbar();
renderFooter();

const form = document.getElementById("forgot-form");
const submitBtn = document.getElementById("forgot-submit-btn");
const btnText = document.getElementById("forgot-btn-text");
const successBanner = document.getElementById("reset-success");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAllFieldErrors(form);
  successBanner.classList.add("hidden");

  const email = document.getElementById("forgot-email").value.trim();

  if (!isValidEmail(email)) {
    showFieldError("forgot-email", "Please enter a valid email address.");
    return;
  }

  setLoading(true);
  try {
    await resetPassword(email);
    successBanner.classList.remove("hidden");
    form.reset();
    showToast("Password reset email sent!", "success");
  } catch (err) {
    // Firebase returns "user-not-found" for unregistered emails — for privacy
    // we show the same success state either way, so we don't leak which
    // emails are registered. Only show a real error for genuine failures
    // like malformed email or network issues.
    if (err.code === "auth/user-not-found") {
      successBanner.classList.remove("hidden");
      form.reset();
    } else {
      showToast(friendlyAuthError(err), "error");
    }
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.innerHTML = isLoading
    ? '<span class="spinner"></span> Sending...'
    : "Send Reset Link";
}
