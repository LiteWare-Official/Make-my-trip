// ============================================================
// register.js
// Controller for /pages/register.html
// ============================================================

import { registerWithEmail, loginWithGoogle, onAuthChange } from "../modules/auth.js";
import { renderNavbar } from "../modules/navbar.js";
import { renderFooter } from "../modules/footer.js";
import { showToast } from "../modules/toast.js";
import {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  friendlyAuthError,
  showFieldError,
  clearAllFieldErrors,
  initPasswordToggles,
  updatePasswordStrength,
} from "../modules/utils.js";

renderNavbar();
renderFooter();
initPasswordToggles();

// Already logged in? Skip straight past registration.
onAuthChange((user) => {
  if (user) window.location.href = "/index.html";
});

/* ---------------- Role selector ---------------- */

let selectedRole = "buyer";

document.querySelectorAll(".role-option").forEach((option) => {
  option.addEventListener("click", () => {
    document.querySelectorAll(".role-option").forEach((o) => o.classList.remove("selected"));
    option.classList.add("selected");
    selectedRole = option.dataset.role;
  });
});

/* ---------------- Password strength meter ---------------- */

const passwordInput = document.getElementById("reg-password");
const strengthMeter = document.getElementById("password-strength");
passwordInput.addEventListener("input", () => {
  updatePasswordStrength(passwordInput.value, strengthMeter);
});

/* ---------------- Form submit ---------------- */

const form = document.getElementById("register-form");
const submitBtn = document.getElementById("register-submit-btn");
const btnText = document.getElementById("register-btn-text");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAllFieldErrors(form);

  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const phone = document.getElementById("reg-phone").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;

  let hasError = false;

  if (name.length < 2) {
    showFieldError("reg-name", "Please enter your full name.");
    hasError = true;
  }
  if (!isValidEmail(email)) {
    showFieldError("reg-email", "Please enter a valid email address.");
    hasError = true;
  }
  if (!isValidPhone(phone)) {
    showFieldError("reg-phone", "Please enter a valid 10-digit phone number.");
    hasError = true;
  }
  if (!isValidPassword(password)) {
    showFieldError("reg-password", "Password must be at least 6 characters.");
    hasError = true;
  }
  if (password !== confirm) {
    showFieldError("reg-confirm", "Passwords do not match.");
    hasError = true;
  }

  if (hasError) return;

  setLoading(true);
  try {
    await registerWithEmail({ name, email, password, role: selectedRole, phone });

    if (selectedRole === "seller") {
      showToast(
        "Account created! Your seller application is pending admin approval. A verification email was also sent.",
        "success",
        6000
      );
    } else {
      showToast("Account created! Please check your inbox to verify your email.", "success", 5000);
    }
    // onAuthChange in this module fires once Firebase resolves the new
    // session and will redirect to the home page automatically.
  } catch (err) {
    showToast(friendlyAuthError(err), "error");
    setLoading(false);
  }
});

document.getElementById("google-register-btn").addEventListener("click", async () => {
  try {
    await loginWithGoogle();
    showToast("Account created with Google!", "success");
  } catch (err) {
    if (err.code !== "auth/popup-closed-by-user") {
      showToast(friendlyAuthError(err), "error");
    }
  }
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.innerHTML = isLoading
    ? '<span class="spinner"></span> Creating account...'
    : "Create Account";
}
