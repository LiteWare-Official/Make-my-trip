// ============================================================
// footer.js
// Renders the shared site footer into #footer-root.
// ============================================================

export function renderFooter() {
  const root = document.getElementById("footer-root");
  if (!root) return;

  const year = new Date().getFullYear();

  root.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="/index.html" class="navbar-logo">
              <span class="logo-mark">✈</span>
              <span>Wander<span style="color:var(--color-primary)">Go</span></span>
            </a>
            <p>Your all-in-one platform for hotels, tour packages, flights, and buses — booked simply, priced honestly.</p>
            <div class="footer-social">
              <a href="#" aria-label="Facebook">f</a>
              <a href="#" aria-label="Instagram">◎</a>
              <a href="#" aria-label="Twitter">𝕏</a>
            </div>
          </div>

          <div class="footer-col">
            <h4>Explore</h4>
            <a href="/pages/search-results.html">Hotels</a>
            <a href="/pages/search-results.html?type=package">Packages</a>
            <a href="/pages/search-results.html?type=flight">Flights</a>
            <a href="/pages/search-results.html?type=bus">Buses</a>
          </div>

          <div class="footer-col">
            <h4>Company</h4>
            <a href="/pages/about.html">About Us</a>
            <a href="/pages/contact.html">Contact</a>
            <a href="/pages/seller-register.html">Become a Seller</a>
          </div>

          <div class="footer-col">
            <h4>Legal</h4>
            <a href="/pages/privacy-policy.html">Privacy Policy</a>
            <a href="/pages/terms.html">Terms of Service</a>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© ${year} WanderGo. All rights reserved.</span>
          <span>Made for travelers, by travelers.</span>
        </div>
      </div>
    </footer>
  `;
}
