// ============================================================
// navbar.js
// Renders the sticky navbar + mobile drawer into #navbar-root,
// and wires up theme toggle, dropdown, and mobile menu behavior.
//
// Auth-aware: subscribes to onAuthChange() from auth.js and swaps
// the "Login / Sign Up" buttons for a notification bell + avatar
// dropdown (with role-based dashboard link) once a user is signed in.
// ============================================================

import { initTheme } from "./theme.js";
import { onAuthChange, logout } from "./auth.js";
import { showToast } from "./toast.js";

const NAV_LINKS = [
  { href: "/index.html", label: "Home" },
  { href: "/pages/search-results.html", label: "Hotels" },
  { href: "/pages/search-results.html?type=package", label: "Packages" },
  { href: "/pages/about.html", label: "About" },
  { href: "/pages/contact.html", label: "Contact" },
];

const DASHBOARD_BY_ROLE = {
  buyer: "/pages/buyer-dashboard.html",
  seller: "/pages/seller-dashboard.html",
  admin: "/pages/admin-dashboard.html",
};

function navLinksHtml(currentPath) {
  return NAV_LINKS.map((link) => {
    const isActive = currentPath.endsWith(link.href.split("?")[0]);
    return `<a href="${link.href}" class="${isActive ? "active" : ""}">${link.label}</a>`;
  }).join("");
}

export function renderNavbar() {
  const root = document.getElementById("navbar-root");
  if (!root) return;

  const currentPath = window.location.pathname;

  root.innerHTML = `
    <nav class="navbar">
      <div class="container navbar-inner">
        <a href="/index.html" class="navbar-logo">
          <span class="logo-mark">✈</span>
          <span>Wander<span style="color:var(--color-primary)">Go</span></span>
        </a>

        <div class="navbar-links desktop-only">
          ${navLinksHtml(currentPath)}
        </div>

        <div class="navbar-actions">
          <button class="theme-toggle" aria-label="Toggle theme"></button>
          <div id="navbar-auth-slot" class="flex" style="gap:var(--space-sm);"></div>
          <button class="navbar-toggle mobile-only" aria-label="Open menu" id="mobile-menu-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
        </div>
      </div>
    </nav>

    <div class="mobile-drawer-backdrop" id="drawer-backdrop"></div>
    <aside class="mobile-drawer" id="mobile-drawer">
      <div class="flex-between mb-lg">
        <span style="font-weight:700;font-size:1.1rem;">Menu</span>
        <button class="btn-icon btn-ghost" id="drawer-close" aria-label="Close menu">✕</button>
      </div>
      <nav id="mobile-drawer-links">${navLinksHtml(currentPath)}</nav>
      <div class="mt-lg" id="mobile-drawer-auth"></div>
    </aside>
  `;

  wireMobileDrawer();
  wireDropdownDismiss();
  initTheme();

  // React to auth state — renders logged-out or logged-in UI in both
  // the desktop navbar slot and the mobile drawer.
  onAuthChange((user, profile) => {
    renderAuthSlot(user, profile);
    renderMobileAuthSlot(user, profile);
  });
}

/* ---------------- Desktop auth slot ---------------- */

function renderAuthSlot(user, profile) {
  const slot = document.getElementById("navbar-auth-slot");
  if (!slot) return;

  if (!user) {
    slot.innerHTML = `
      <a href="/pages/login.html" class="btn btn-outline btn-sm desktop-only">Login</a>
      <a href="/pages/register.html" class="btn btn-primary btn-sm desktop-only">Sign Up</a>
    `;
    return;
  }

  const name = profile?.name || user.displayName || "Traveler";
  const initial = name.charAt(0).toUpperCase();
  const avatarImg = profile?.profileImage
    ? `<img src="${profile.profileImage}" alt="${name}" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
         background:linear-gradient(135deg,var(--color-primary),var(--color-secondary));color:#fff;font-weight:700;">${initial}</div>`;

  const dashboardLink = DASHBOARD_BY_ROLE[profile?.role] || "/pages/buyer-dashboard.html";

  slot.innerHTML = `
    <a href="/pages/notifications.html" class="notif-bell desktop-only" aria-label="Notifications">
      🔔<span class="notif-dot hidden" id="notif-indicator"></span>
    </a>
    <div class="user-menu">
      <div class="navbar-avatar" data-dropdown-toggle="user-dropdown-menu">${avatarImg}</div>
      <div class="user-dropdown" id="user-dropdown-menu">
        <div style="padding:.5rem .9rem .7rem;border-bottom:1px solid var(--border-color);margin-bottom:.3rem;">
          <div style="font-weight:600;font-size:.9rem;">${escapeHtml(name)}</div>
          <div class="text-muted" style="font-size:.78rem;">${escapeHtml(user.email || "")}</div>
        </div>
        <a href="${dashboardLink}">📊 Dashboard</a>
        <a href="/pages/profile.html">👤 My Profile</a>
        <a href="/pages/my-bookings.html">🧳 My Bookings</a>
        <a href="/pages/wishlist.html">❤️ Wishlist</a>
        <hr />
        <button id="logout-btn">🚪 Logout</button>
      </div>
    </div>
  `;

  document.getElementById("logout-btn")?.addEventListener("click", handleLogout);
}

/* ---------------- Mobile drawer auth slot ---------------- */

function renderMobileAuthSlot(user, profile) {
  const slot = document.getElementById("mobile-drawer-auth");
  if (!slot) return;

  if (!user) {
    slot.innerHTML = `
      <a href="/pages/login.html" class="btn btn-outline btn-block mb-sm">Login</a>
      <a href="/pages/register.html" class="btn btn-primary btn-block">Sign Up</a>
    `;
    return;
  }

  const dashboardLink = DASHBOARD_BY_ROLE[profile?.role] || "/pages/buyer-dashboard.html";

  slot.innerHTML = `
    <a href="${dashboardLink}">📊 Dashboard</a>
    <a href="/pages/profile.html">👤 My Profile</a>
    <a href="/pages/my-bookings.html">🧳 My Bookings</a>
    <a href="/pages/wishlist.html">❤️ Wishlist</a>
    <a href="/pages/notifications.html">🔔 Notifications</a>
    <button id="mobile-logout-btn" class="btn btn-outline btn-block mt-md">Logout</button>
  `;

  document.getElementById("mobile-logout-btn")?.addEventListener("click", handleLogout);
}

async function handleLogout() {
  try {
    await logout();
    showToast("You've been logged out.", "success");
    setTimeout(() => (window.location.href = "/index.html"), 600);
  } catch (err) {
    showToast("Failed to log out. Please try again.", "error");
  }
}

/* ---------------- Mobile drawer + dropdown mechanics ---------------- */

function wireMobileDrawer() {
  const drawer = document.getElementById("mobile-drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  const openBtn = document.getElementById("mobile-menu-btn");
  const closeBtn = document.getElementById("drawer-close");

  const open = () => {
    drawer.classList.add("open");
    backdrop.classList.add("open");
  };
  const close = () => {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
  };

  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
}

function wireDropdownDismiss() {
  document.addEventListener("click", (e) => {
    const isToggle = e.target.closest("[data-dropdown-toggle]");
    document.querySelectorAll(".user-dropdown.open").forEach((dd) => {
      if (!isToggle || dd.id !== isToggle.dataset.dropdownToggle) {
        dd.classList.remove("open");
      }
    });
    if (isToggle) {
      document.getElementById(isToggle.dataset.dropdownToggle)?.classList.toggle("open");
    }
  });
}

function escapeHtml(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
