// ============================================================
// verify-banner.js
// Shows a dismissible "please verify your email" banner at the
// top of the page for any signed-in user whose email isn't
// verified yet. Import and call mountVerifyBanner() on pages
// where this matters (dashboards, profile, booking flow).
// ============================================================

import { auth } from "./firebase-config.js";
import { onAuthChange, resendVerificationEmail } from "./auth.js";
import { showToast } from "./toast.js";

const DISMISS_KEY = "mmt-verify-banner-dismissed";

export function mountVerifyBanner(targetSelector = "#verify-banner-root") {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  onAuthChange((user) => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    if (!user || user.emailVerified || dismissed) {
      target.innerHTML = "";
      return;
    }

    target.innerHTML = `
      <div class="verify-banner">
        <span>⚠ Please verify your email address to unlock all features.</span>
        <button id="resend-verify-btn">Resend Email</button>
        <button id="dismiss-verify-btn" style="margin-left:.75rem;text-decoration:none;">✕</button>
      </div>
    `;

    document.getElementById("resend-verify-btn")?.addEventListener("click", async () => {
      try {
        await resendVerificationEmail();
        showToast("Verification email sent! Check your inbox.", "success");
      } catch (err) {
        showToast("Couldn't resend right now. Please try again shortly.", "error");
      }
    });

    document.getElementById("dismiss-verify-btn")?.addEventListener("click", () => {
      sessionStorage.setItem(DISMISS_KEY, "1");
      target.innerHTML = "";
    });
  });
}
