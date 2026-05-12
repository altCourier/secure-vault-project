/**
 * dashboard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities:
 *   1. Fetch the active session  →  GET /api/session
 *   2. Fetch the audit log       →  GET /api/audit-log
 *   3. Render user info into the header and session bar.
 *   4. Render stat cards (total / success / failed / last login).
 *   5. Render the audit history table with status badges.
 *   6. Wire the filter buttons (All / Success / Failed).
 *   7. Wire the Logout button   →  POST /api/logout
 *   8. Handle errors gracefully (expired session → redirect to login).
 *
 * Loaded with `defer` at end of <body> — DOM is guaranteed ready.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(() => {
  "use strict";

  // ── API endpoints ──────────────────────────────────────────────────────────
  const API = {
    session:  "/api/session",
    auditLog: "/api/audit-log",
    logout:   "/api/logout",
  };

  // ── Redirect targets ───────────────────────────────────────────────────────
  const LOGIN_PAGE = "/index.html";   // adjust if your login route differs

  // ── Human-readable labels for event_type codes ────────────────────────────
  const EVENT_TYPE_LABELS = {
    login_success:        "Login — Success",
    login_failed:         "Login — Failed",
    logout:               "Logout",
    password_change:      "Password Changed",
    password_reset:       "Password Reset",
    session_expired:      "Session Expired",
    account_locked:       "Account Locked",
    account_unlocked:     "Account Unlocked",
    mfa_enabled:          "MFA Enabled",
    mfa_disabled:         "MFA Disabled",
    mfa_challenge:        "MFA Challenge",
    suspicious_activity:  "Suspicious Activity",
  };

  // ── Minimal UA parser ──────────────────────────────────────────────────────
  // Returns a short, readable string instead of the raw UA blob.
  function parseUserAgent(ua) {
    if (!ua) return "Unknown";

    // Browser detection (order matters — Edge before Chrome)
    const browsers = [
      [/Edg\//i,             "Edge"],
      [/OPR\//i,             "Opera"],
      [/Chrome\//i,          "Chrome"],
      [/Firefox\//i,         "Firefox"],
      [/Safari\//i,          "Safari"],
      [/MSIE|Trident\//i,    "Internet Explorer"],
    ];

    // OS detection
    const oses = [
      [/Windows NT 10/i,  "Windows 10/11"],
      [/Windows NT 6\.3/i,"Windows 8.1"],
      [/Windows NT 6\.1/i,"Windows 7"],
      [/Windows/i,        "Windows"],
      [/iPhone/i,         "iPhone"],
      [/iPad/i,           "iPad"],
      [/Android/i,        "Android"],
      [/Mac OS X/i,       "macOS"],
      [/Linux/i,          "Linux"],
      [/CrOS/i,           "ChromeOS"],
    ];

    const browser = browsers.find(([re]) => re.test(ua))?.[1] ?? "Browser";
    const os      = oses.find(([re]) => re.test(ua))?.[1]     ?? "Unknown OS";

    return `${browser} on ${os}`;
  }

  // ── Date formatter ─────────────────────────────────────────────────────────
  function formatTimestamp(iso) {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat(undefined, {
        year:   "numeric",
        month:  "short",
        day:    "2-digit",
        hour:   "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date(iso));
    } catch {
      return iso; // fall back to raw string
    }
  }

  // ── Escape HTML to prevent XSS when inserting user-supplied strings ────────
  function escapeHTML(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g,  "&amp;")
      .replace(/</g,  "&lt;")
      .replace(/>/g,  "&gt;")
      .replace(/"/g,  "&quot;")
      .replace(/'/g,  "&#39;");
  }

  // ── Initials from full name ────────────────────────────────────────────────
  function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  1. SESSION FETCH & USER INFO RENDER
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Fetches GET /api/session.
   * Expected response shape:
   *   { username: string, ip: string }
   *
   * On 401/403 → redirect to login.
   * Returns the session object or throws.
   */
  async function fetchSession() {
    const res = await fetch(API.session, { credentials: "include" });

    if (res.status === 401 || res.status === 403) {
      window.location.replace(LOGIN_PAGE);
      throw new Error("Unauthenticated");
    }

    if (!res.ok) throw new Error(`Session fetch failed: ${res.status}`);
    return res.json();
  }

  /**
   * Populates:
   *   #header-username  → session.username
   *   #header-avatar    → initials of session.username
   *   #session-ip       → "IP: <session.ip>"
   */
  function renderUserInfo(session) {
    const usernameEl = document.getElementById("header-username");
    const avatarEl   = document.getElementById("header-avatar");
    const ipEl       = document.getElementById("session-ip");

    if (usernameEl) usernameEl.textContent = escapeHTML(session.username ?? "Unknown");
    if (avatarEl)   avatarEl.textContent   = getInitials(session.username ?? "");
    if (ipEl)       ipEl.textContent       = `IP: ${escapeHTML(session.ip ?? "—")}`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  2. AUDIT LOG FETCH
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Fetches GET /api/audit-log.
   * Expected response shape:
   *   { events: AuditEvent[] }
   *
   * AuditEvent:
   *   { timestamp, event_type, ip_address, user_agent, status }
   */
  async function fetchAuditLog() {
    const res = await fetch(API.auditLog, { credentials: "include" });

    if (res.status === 401 || res.status === 403) {
      window.location.replace(LOGIN_PAGE);
      throw new Error("Unauthenticated");
    }

    if (!res.ok) throw new Error(`Audit log fetch failed: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.events) ? data.events : [];
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  3. STATS RENDER
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Derives counts from the events array and populates stat cards:
   *   #stat-total   → events.length
   *   #stat-success → count where status === "success"
   *   #stat-failed  → count where status === "failed"
   *   #stat-last    → timestamp of the most recent login_success event
   */
  function renderStats(events) {
    const total   = events.length;
    const success = events.filter(e => e.status === "success").length;
    const failed  = events.filter(e => e.status === "failed").length;

    // Most recent successful login
    const lastLoginEvent = events
      .filter(e => e.event_type === "login_success" && e.status === "success")
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    const lastLogin = lastLoginEvent
      ? formatTimestamp(lastLoginEvent.timestamp)
      : "No logins yet";

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set("stat-total",   total);
    set("stat-success", success);
    set("stat-failed",  failed);
    set("stat-last",    lastLogin);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  4. TABLE RENDER
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Builds <tr> elements for the provided events array and injects them into
   * #audit-table-body.  Replaces whatever is there (including the loading row).
   *
   * @param {AuditEvent[]} events  - Full or filtered events array.
   */
  function renderTable(events) {
    const tbody = document.getElementById("audit-table-body");
    if (!tbody) return;

    if (events.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="table-empty">No events to display.</td>
        </tr>`;
      return;
    }

    // Build rows as an HTML string — faster than creating DOM nodes one by one
    const rows = events.map(event => {
      const ts        = escapeHTML(formatTimestamp(event.timestamp));
      const eventType = escapeHTML(
        EVENT_TYPE_LABELS[event.event_type] ?? event.event_type ?? "Unknown"
      );
      const ip        = escapeHTML(event.ip_address ?? "—");
      const ua        = escapeHTML(parseUserAgent(event.user_agent));
      const status    = (event.status ?? "").toLowerCase();

      // Badge class maps to CSS: .badge-success / .badge-failed / .badge-pending
      const badgeClass = status === "success" ? "badge-success"
                       : status === "failed"  ? "badge-failed"
                       : "badge-pending";

      const badgeLabel = status.charAt(0).toUpperCase() + status.slice(1) || "Pending";

      return `
        <tr data-status="${escapeHTML(status)}">
          <td>${ts}</td>
          <td>${eventType}</td>
          <td><code>${ip}</code></td>
          <td title="${escapeHTML(event.user_agent ?? "")}">${ua}</td>
          <td><span class="badge ${escapeHTML(badgeClass)}">${badgeLabel}</span></td>
        </tr>`;
    });

    tbody.innerHTML = rows.join("");
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  5. FILTER WIRING
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Wires the three filter buttons (All / Success / Failed).
   * Stores the full events array in closure; re-renders table on each click.
   *
   * @param {AuditEvent[]} allEvents - The complete unfiltered events array.
   */
  function initFilters(allEvents) {
    const filterBar = document.querySelector(".filter-bar");
    if (!filterBar) return;

    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;

      // Update active state
      filterBar.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter; // "all" | "success" | "failed"

      const filtered = filter === "all"
        ? allEvents
        : allEvents.filter(ev => ev.status?.toLowerCase() === filter);

      renderTable(filtered);
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  6. LOGOUT BUTTON
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * POSTs to /api/logout and redirects to the login page.
   * Disables the button during the request to prevent double-clicks.
   */
  function initLogout() {
    const btn = document.getElementById("btn-logout");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      btn.disabled    = true;
      btn.textContent = "Logging out…";

      try {
        await fetch(API.logout, {
          method:      "POST",
          credentials: "include",
          headers:     { "Content-Type": "application/json" },
        });
      } catch {
        // Even on network error, redirect — the session cookie will expire anyway
      } finally {
        window.location.replace(LOGIN_PAGE);
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  7. ERROR HANDLING HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Shows a full-width error row in the audit table.
   * Also resets stat cards to "—" so they don't show stale data.
   */
  function showTableError(message) {
    const tbody = document.getElementById("audit-table-body");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="table-error">
            ${escapeHTML(message)}
          </td>
        </tr>`;
    }

    ["stat-total", "stat-success", "stat-failed", "stat-last"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = "—";
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  8. MAIN INIT  — orchestrates all of the above
  // ══════════════════════════════════════════════════════════════════════════

  async function init() {
    // Wire logout immediately — doesn't depend on API data
    initLogout();

    // ── Fetch session and audit log in parallel ──────────────────────────
    let session, events;

    try {
      [session, events] = await Promise.all([fetchSession(), fetchAuditLog()]);
    } catch (err) {
      // fetchSession() already redirects on 401/403 before throwing.
      // Any other error (network, server 500) lands here.
      if (err.message !== "Unauthenticated") {
        showTableError("Failed to load dashboard data. Please refresh or log in again.");
        console.error("[Dashboard] Init error:", err);
      }
      return;
    }

    // ── Render all sections ──────────────────────────────────────────────
    renderUserInfo(session);
    renderStats(events);
    renderTable(events);
    initFilters(events);
  }

  // Kick off
  init();
})();