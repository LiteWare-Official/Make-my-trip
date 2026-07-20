// ============================================================
// home.js
// Bootstraps the home page: navbar/footer, theme, hero search
// form, and featured content grids (destinations/hotels/packages).
//
// NOTE: Auth-aware navbar rendering (avatar/login state) and full
// Firestore CRUD modules (hotels.js, packages.js) land in Step 2
// and beyond. For now this file proves the scaffold + Firebase
// connection work, using defensive empty-state handling so the
// page looks complete even before any listings exist in Firestore.
// ============================================================

import { db } from "../modules/firebase-config.js";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { renderNavbar } from "../modules/navbar.js";
import { renderFooter } from "../modules/footer.js";
import { hidePageLoader } from "../modules/loader.js";
import { showToast } from "../modules/toast.js";
import { formatCurrency, escapeHtml, buildQueryString } from "../modules/utils.js";

const DESTINATIONS = [
  { name: "Goa", country: "India", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500&q=80" },
  { name: "Manali", country: "India", img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=500&q=80" },
  { name: "Jaipur", country: "India", img: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=500&q=80" },
  { name: "Kerala", country: "India", img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=500&q=80" },
];

function init() {
  renderNavbar();
  renderFooter();
  bindSearchTabs();
  bindSearchForm();
  renderDestinations();
  loadFeaturedHotels();
  loadFeaturedPackages();
  hidePageLoader();
}

/* ---------------- Search widget ---------------- */

let activeSearchType = "hotel";

function bindSearchTabs() {
  const tabs = document.querySelectorAll(".search-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeSearchType = tab.dataset.type;
    });
  });
}

function bindSearchForm() {
  const form = document.getElementById("hero-search-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const destination = document.getElementById("search-destination").value.trim();
    const date = document.getElementById("search-date").value;
    const guests = document.getElementById("search-guests").value;

    if (!destination) {
      showToast("Please enter a destination to search.", "warning");
      return;
    }

    const qs = buildQueryString({
      type: activeSearchType,
      destination,
      date,
      guests,
    });
    window.location.href = `/pages/search-results.html?${qs}`;
  });
}

/* ---------------- Destinations (static curated list for now) ---------------- */

function renderDestinations() {
  const grid = document.getElementById("destinations-grid");
  if (!grid) return;
  grid.innerHTML = DESTINATIONS.map(
    (d) => `
    <a class="destination-card" href="/pages/search-results.html?${buildQueryString({
      type: "hotel",
      destination: d.name,
    })}">
      <img src="${d.img}" alt="${escapeHtml(d.name)}" loading="lazy" />
      <div class="destination-overlay">
        <h3>${escapeHtml(d.name)}</h3>
        <span>${escapeHtml(d.country)}</span>
      </div>
    </a>`
  ).join("");
}

/* ---------------- Featured hotels from Firestore ---------------- */

async function loadFeaturedHotels() {
  const grid = document.getElementById("hotels-grid");
  if (!grid) return;

  try {
    const q = query(collection(db, "hotels"), orderBy("createdAt", "desc"), limit(4));
    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML = emptyState("No hotels listed yet — check back soon!");
      return;
    }

    grid.innerHTML = snap.docs.map((doc) => hotelCardHtml(doc.id, doc.data())).join("");
  } catch (err) {
    // Collection likely doesn't exist yet, or an index is missing — fail gracefully.
    console.warn("Featured hotels load skipped:", err.message);
    grid.innerHTML = emptyState("No hotels listed yet — check back soon!");
  }
}

function hotelCardHtml(id, hotel) {
  const img = hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80";
  return `
    <a class="card" href="/pages/hotel-details.html?id=${id}">
      <div class="card-img"><img src="${img}" alt="${escapeHtml(hotel.hotelName || "Hotel")}" loading="lazy" /></div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(hotel.hotelName || "Untitled Hotel")}</h3>
        <p class="card-meta">📍 ${escapeHtml(hotel.city || "")}${hotel.state ? ", " + escapeHtml(hotel.state) : ""}</p>
        <p class="card-price">${formatCurrency(hotel.price)} <small>/ night</small></p>
      </div>
    </a>`;
}

/* ---------------- Featured packages from Firestore ---------------- */

async function loadFeaturedPackages() {
  const grid = document.getElementById("packages-grid");
  if (!grid) return;

  try {
    const q = query(collection(db, "packages"), orderBy("createdAt", "desc"), limit(4));
    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML = emptyState("No tour packages listed yet — check back soon!");
      return;
    }

    grid.innerHTML = snap.docs.map((doc) => packageCardHtml(doc.id, doc.data())).join("");
  } catch (err) {
    console.warn("Featured packages load skipped:", err.message);
    grid.innerHTML = emptyState("No tour packages listed yet — check back soon!");
  }
}

function packageCardHtml(id, pkg) {
  const img = pkg.images?.[0] || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&q=80";
  return `
    <a class="card" href="/pages/package-details.html?id=${id}">
      <div class="card-img"><img src="${img}" alt="${escapeHtml(pkg.title || "Package")}" loading="lazy" /></div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(pkg.title || "Untitled Package")}</h3>
        <p class="card-meta">📍 ${escapeHtml(pkg.location || "")} · ${escapeHtml(pkg.duration || "")}</p>
        <p class="card-price">${formatCurrency(pkg.price)} <small>/ person</small></p>
      </div>
    </a>`;
}

function emptyState(message) {
  return `
    <div class="empty-state" style="grid-column:1/-1;">
      <p>${escapeHtml(message)}</p>
    </div>`;
}

// Set default date input to today so it's never left blank
document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("search-date");
  if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];
});

init();
    
