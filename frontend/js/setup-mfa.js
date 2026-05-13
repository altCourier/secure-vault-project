/**
 * setup-mfa.js
 * Runs on setup-mfa.html
 * 
 * 1. On page load → POST /setup-mfa to get secret + QR code from backend
 * 2. Show QR code image and manual secret key
 * 3. "Continue" button → go to verify-mfa.html
 */

(() => {
  "use strict";

  async function loadMFASetup() {
    const msgEl          = document.getElementById("message");
    const qrImage        = document.getElementById("qr-image");
    const qrPlaceholder  = document.getElementById("qr-placeholder");
    const secretKeyEl    = document.getElementById("secret-key");

    try {
      const response = await fetch(`${API_BASE}/setup-mfa`, {
        method: "POST",
        credentials: "include",               // sends session cookie
        headers: { "Content-Type": "application/json" },
      });

      // If not logged in, redirect to login
      if (response.status === 401 || response.status === 403) {
        window.location.replace("login.html");
        return;
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // Show the QR code image
      qrImage.src = data.qrCode;
      qrImage.style.display = "block";
      qrPlaceholder.style.display = "none";

      // Show the manual secret key
      secretKeyEl.textContent = data.secret;

    } catch (err) {
      qrPlaceholder.textContent = "Failed to load QR code.";
      msgEl.style.color = "red";
      msgEl.textContent = "Could not load MFA setup. Please refresh the page.";
      console.error("[setup-mfa]", err);
    }
  }

  // "Continue" button → go to verification page
  document.getElementById("btn-continue").addEventListener("click", () => {
    window.location.href = "verify-mfa.html";
  });

  // Kick off on page load
  loadMFASetup();
})();