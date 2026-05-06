/**
 * theme-toggle.js
 *
 * Handles light / dark mode switching for the Secure Vault dashboard.
 *
 * Strategy
 * --------
 * - Preference is stored in localStorage under the key "sv-theme".
 * - On load, priority is: stored preference → OS preference → dark (default).
 * - A `data-theme` attribute on <html> drives the CSS token swap (see theme.css).
 * - A `.theme-transition` class is briefly added to <html> so the token-driven
 *   color properties animate smoothly on toggle, but NOT on the initial paint
 *   (avoids a flash of the wrong colors before JS runs).
 * - The toggle button is injected into .header-user by this module so the HTML
 *   stays clean and the button is always present when the script loads.
 *
 * Usage
 * -----
 *   <script src="../js/theme-toggle.js" defer></script>
 *   (load before dashboard.js so the theme is applied before content renders)
 *
 * Public API (attached to window for dashboard.js to call if needed)
 * -----
 *   window.ThemeToggle.getTheme()   → "dark" | "light"
 *   window.ThemeToggle.setTheme(t)  → void
 *   window.ThemeToggle.toggle()     → void
 */

(function () {
  'use strict';

  /* ── Constants ──────────────────────────────── */

  const STORAGE_KEY = 'sv-theme';
  const DARK        = 'dark';
  const LIGHT       = 'light';

  /* ── Resolve initial theme ───────────────────
     Order of precedence:
       1. Stored user preference
       2. OS-level preference
       3. Dark (product default)
  ─────────────────────────────────────────────── */

  function getSystemPreference() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? LIGHT : DARK;
  }

  function resolveInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === DARK || stored === LIGHT) return stored;
    return getSystemPreference();
  }

  /* ── Apply / remove theme ────────────────────
     Sets data-theme on <html>. The CSS only needs
     an explicit attribute for "light" (dark is the
     default :root block), but we always set it for
     clarity and easy JS reads.
  ─────────────────────────────────────────────── */

  function applyTheme(theme, animate) {
    const root = document.documentElement;

    if (animate) {
      /* Enable transition for this swap only */
      root.classList.add('theme-transition');
      /* Remove after the transition completes so it doesn't slow other changes */
      const cleanup = () => root.classList.remove('theme-transition');
      root.addEventListener('transitionend', cleanup, { once: true });
      /* Safety net in case transitionend never fires */
      setTimeout(cleanup, 300);
    }

    root.setAttribute('data-theme', theme);
  }

  /* ── Persist preference ──────────────────────*/

  function persist(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {
      /* Private browsing / storage blocked — silently ignore */
    }
  }

  /* ── Update button UI ────────────────────────
     Reflects the CURRENT theme in the button label/icon.
     ("Switch to X" tells users what pressing it will do.)
  ─────────────────────────────────────────────── */

  function syncButton(button, currentTheme) {
    if (!button) return;

    const isLight = currentTheme === LIGHT;
    const nextLabel = isLight ? 'Dark mode' : 'Light mode';
    const icon      = isLight ? '☀️'        : '🌙';

    button.setAttribute('aria-label', `Switch to ${nextLabel}`);
    button.setAttribute('aria-pressed', String(isLight));
    button.setAttribute('title', `Switch to ${nextLabel}`);

    const iconEl  = button.querySelector('.toggle-icon');
    const labelEl = button.querySelector('.toggle-label');

    if (iconEl)  iconEl.textContent  = icon;
    if (labelEl) labelEl.textContent = isLight ? 'Light' : 'Dark';
  }

  /* ── Create the toggle button ─────────────── */

  function createButton() {
    const btn = document.createElement('button');
    btn.type        = 'button';
    btn.className   = 'btn-theme-toggle';
    btn.innerHTML   = '<span class="toggle-icon" aria-hidden="true"></span>'
                    + '<span class="toggle-label"></span>';
    return btn;
  }

  /* ── Inject button into the header ─────────── */

  function injectButton(theme) {
    /* Target: .header-user — insert before .avatar so the order is:
       [user-info] [theme-toggle] [avatar] [logout]               */
    const headerUser = document.querySelector('.header-user');
    if (!headerUser) return null;

    const btn = createButton();
    syncButton(btn, theme);

    /* Insert before the avatar (third child) if it exists, else append */
    const avatar = headerUser.querySelector('.avatar');
    if (avatar) {
      headerUser.insertBefore(btn, avatar);
    } else {
      headerUser.appendChild(btn);
    }

    return btn;
  }

  /* ── Wire up the toggle handler ─────────────*/

  function wireToggle(button, getTheme, setTheme) {
    if (!button) return;

    button.addEventListener('click', () => {
      const next = getTheme() === DARK ? LIGHT : DARK;
      setTheme(next);
    });
  }

  /* ── Listen for OS preference changes ───────
     If the user hasn't stored a manual preference we follow the OS.
  ─────────────────────────────────────────────── */

  function watchOsPreference(setTheme) {
    const mq = window.matchMedia('(prefers-color-scheme: light)');

    mq.addEventListener('change', (e) => {
      if (localStorage.getItem(STORAGE_KEY)) return; /* manual override active */
      setTheme(e.matches ? LIGHT : DARK);
    });
  }

  /* ── Bootstrap ───────────────────────────── */

  (function init() {
    /* 1. Resolve & apply initial theme immediately (no animation) */
    let currentTheme = resolveInitialTheme();
    applyTheme(currentTheme, false);

    /* 2. Wait for DOM so we can inject the button */
    const setup = () => {
      let toggleBtn = null;

      function getTheme() {
        return currentTheme;
      }

      function setTheme(theme) {
        if (theme !== DARK && theme !== LIGHT) return;
        currentTheme = theme;
        applyTheme(theme, true);
        persist(theme);
        syncButton(toggleBtn, theme);
      }

      toggleBtn = injectButton(currentTheme);
      wireToggle(toggleBtn, getTheme, setTheme);
      watchOsPreference(setTheme);

      /* Expose minimal public API */
      window.ThemeToggle = { getTheme, setTheme, toggle: () => setTheme(getTheme() === DARK ? LIGHT : DARK) };
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }
  })();
})();