/**
 * verify-mfa.js
 * Runs on verify-mfa.html
 *
 * 1. User enters 6-digit TOTP code and clicks Verify
 * 2. POST /verify-mfa → backend checks the code
 * 3. On success → hide the form, show recovery codes
 * 4. "Copy All" → copies codes to clipboard
 * 5. "Go to Dashboard" → redirect
 */

(() => {
  "use strict";

  const btnVerify   = document.getElementById("btn-verify");
  const btnCopy     = document.getElementById("btn-copy");
  const btnDashboard = document.getElementById("btn-dashboard");
  const msgEl       = document.getElementById("message");

  // ── Verify button ──────────────────────────────────────────────────────────
  btnVerify.addEventListener("click", async () => {
    const token = document.getElementById("totp-code").value.trim();

    // Basic check — must be 6 digits
    if (!/^\d{6}$/.test(token)) {
      msgEl.style.color = "red";
      msgEl.textContent = "Please enter a valid 6-digit code.";
      return;
    }

    // Disable button while waiting for response
    btnVerify.disabled    = true;
    btnVerify.textContent = "Verifying...";
    msgEl.textContent     = "";

    try {
      const response = await fetch(`${API_BASE}/setup-mfa`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      // Session expired
      if (response.status === 401 || response.status === 403) {
        window.location.replace("login.html");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        // Wrong code — show error, re-enable button
        msgEl.style.color = "red";
        msgEl.textContent = data.error || "Invalid code. Please try again.";
        btnVerify.disabled    = false;
        btnVerify.textContent = "Verify";
        return;
      }

      // ── Success: hide form, show recovery codes ──────────────────────────
      document.getElementById("verify-section").style.display = "none";

      const recoveryBox  = document.getElementById("recovery-box");
      const codesList    = document.getElementById("recovery-codes-list");

      // Build the list items
      codesList.innerHTML = data.recoveryCodes
        .map(code => `<li>${code}</li>`)
        .join("");

      recoveryBox.style.display = "block";

    } catch (err) {
      msgEl.style.color = "red";
      msgEl.textContent = "Network error. Please check your connection.";
      btnVerify.disabled    = false;
      btnVerify.textContent = "Verify";
      console.error("[verify-mfa]", err);
    }
  });

  // ── Only allow number input in the OTP field ───────────────────────────────
  document.getElementById("totp-code").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, ""); // strip non-digits
  });

  // ── Copy all recovery codes to clipboard ───────────────────────────────────
  btnCopy.addEventListener("click", () => {
    const codes = [...document.querySelectorAll("#recovery-codes-list li")]
      .map(li => li.textContent)
      .join("\n");

    navigator.clipboard.writeText(codes).then(() => {
      btnCopy.textContent = "✅ Copied!";
      setTimeout(() => (btnCopy.textContent = "Copy All Codes"), 2000);
    }).catch(() => {
      btnCopy.textContent = "Copy failed — please copy manually.";
    });
  });

  // ── Go to dashboard ────────────────────────────────────────────────────────
  btnDashboard.addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });
})();