/**
 * verify-recovery.js
 * Runs on verify-recovery.html
 *
 * 1. User enters their recovery code and clicks Verify
 * 2. POST /verify-recovery → backend checks and marks code as used
 * 3. On success → redirect to dashboard
 * 4. On failure → show error message
 */

(() => {
  "use strict";

  const btnSubmit = document.getElementById("btn-submit");
  const msgEl     = document.getElementById("message");

  // Force uppercase as the user types
  document.getElementById("recovery-code").addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  });

  btnSubmit.addEventListener("click", async () => {
    const code = document.getElementById("recovery-code").value.trim();

    if (code.length < 6) {
      msgEl.style.color = "red";
      msgEl.textContent = "Please enter a valid recovery code.";
      return;
    }

    // Disable button while waiting
    btnSubmit.disabled    = true;
    btnSubmit.textContent = "Verifying...";
    msgEl.textContent     = "";

    try {
      const response = await fetch(`${API_BASE}/verify-recovery`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      // Session expired
      if (response.status === 401 || response.status === 403) {
        window.location.replace("login.html");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        msgEl.style.color = "red";
        msgEl.textContent = data.error || "Invalid recovery code. Please try another.";
        btnSubmit.disabled    = false;
        btnSubmit.textContent = "Verify Recovery Code";
        return;
      }

      // Success → go to dashboard
      msgEl.style.color = "green";
      msgEl.textContent = "Code accepted! Redirecting...";
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);

    } catch (err) {
      msgEl.style.color = "red";
      msgEl.textContent = "Network error. Please check your connection.";
      btnSubmit.disabled    = false;
      btnSubmit.textContent = "Verify Recovery Code";
      console.error("[verify-recovery]", err);
    }
  });
})();