/* =============================================
   dashboard.css
   All color values use tokens from theme.css.
   Light / dark switching is handled entirely
   by token reassignment — no overrides here.
   ============================================= */

/* ── Layout ──────────────────────────────────── */

.app-layout {
  display: grid;
  grid-template-rows: 64px 1fr;
  min-height: 100vh;
}


/* ── Header ──────────────────────────────────── */

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-mid);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 32px;
  height: 32px;
  background: var(--accent);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-icon svg {
  width: 18px;
  height: 18px;
  fill: #fff;
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

/* Right side of the header — theme toggle sits between user-info and logout */
.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  text-align: right;
}

.user-info .name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.user-info .role {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

.btn-logout {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  padding: 7px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-mid);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background var(--transition),
    border-color var(--transition),
    color var(--transition);
}

.btn-logout:hover {
  background: var(--color-red-bg);
  border-color: var(--color-red);
  color: var(--color-red);
}

.btn-logout:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}


/* ── Main content ────────────────────────────── */

.app-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.page-header p {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 4px;
}


/* ── Session bar ─────────────────────────────── */

.session-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-blue-bg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  margin-bottom: 2rem;
  font-size: 13px;
  color: var(--text-muted);
}

.session-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-green);
  animation: pulse 2s infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

.session-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
}


/* ── Stats grid ──────────────────────────────── */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1.1rem 1.25rem;
  position: relative;
  overflow: hidden;
  transition: background var(--transition), border-color var(--transition);
}

/* Top accent stripe */
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--stat-accent, var(--text-muted));
}

.stat-card.accent-blue  { --stat-accent: var(--color-blue); }
.stat-card.accent-green { --stat-accent: var(--color-green); }
.stat-card.accent-red   { --stat-accent: var(--color-red); }
.stat-card.accent-amber { --stat-accent: var(--color-amber); }

.stat-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  font-family: var(--font-mono);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.stat-value--sm {
  font-size: 16px;
  padding-top: 6px;
}


/* ── Section card ────────────────────────────── */

.section-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: background var(--transition), border-color var(--transition);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
}

.section-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.section-header p {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}


/* ── Filter bar ──────────────────────────────── */

.filter-bar {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.filter-btn {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-mid);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background var(--transition),
    border-color var(--transition),
    color var(--transition);
}

.filter-btn:hover {
  border-color: var(--color-blue);
  color: var(--color-blue);
}

.filter-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.filter-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}


/* ── Audit table ─────────────────────────────── */

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

thead th {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-faint);
  text-align: left;
  padding: 10px 1.5rem;
  background: var(--bg-hover);
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
  transition: background var(--transition);
}

tbody tr {
  border-bottom: 1px solid var(--border-subtle);
  transition: background var(--transition);
}

tbody tr:last-child {
  border-bottom: none;
}

tbody tr:hover {
  background: var(--bg-hover);
}

tbody td {
  padding: 12px 1.5rem;
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}

.td-timestamp {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-faint);
}

.td-event {
  font-weight: 500;
  color: var(--text-primary);
}

.td-ip {
  font-family: var(--font-mono);
  font-size: 12px;
}

.td-agent {
  font-size: 12px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}


/* ── Status badges ───────────────────────────── */

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.badge::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.badge-success {
  background: var(--color-green-bg);
  color: var(--color-green);
}

.badge-danger {
  background: var(--color-red-bg);
  color: var(--color-red);
}

.badge-warning {
  background: var(--color-amber-bg);
  color: var(--color-amber);
}


/* ── Empty & loading states ──────────────────── */

.table-loading,
.table-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-faint);
  font-size: 13px;
}

.table-loading {
  font-family: var(--font-mono);
}


/* ── Responsive ──────────────────────────────── */

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .app-main   { padding: 1rem; }
  .app-header { padding: 0 1rem; }
  .user-info  { display: none; }

  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .filter-bar { display: none; }

  /* Hide User Agent column on small screens */
  thead th:nth-child(4),
  tbody td:nth-child(4) { display: none; }
}