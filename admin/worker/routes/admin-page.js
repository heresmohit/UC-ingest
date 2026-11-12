const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Improv Lore — Events Admin</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --bg-page: #0f172a;
    --bg-card: #1e293b;
    --bg-card-hover: #24344d;
    --bg-input: #0f172a;
    --border: #334155;
    --border-light: #475569;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --accent: #8b5cf6;
    --accent-hover: #7c3aed;
    --accent-light: #8b5cf620;
    --success: #10b981;
    --success-bg: #10b98120;
    --warning: #f59e0b;
    --warning-bg: #f59e0b20;
    --danger: #ef4444;
    --danger-bg: #ef444420;
    --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  @media (prefers-color-scheme: light) {
    :root {
      --bg-page: #f8fafc;
      --bg-card: #ffffff;
      --bg-card-hover: #f1f5f9;
      --bg-input: #ffffff;
      --border: #e2e8f0;
      --border-light: #cbd5e1;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --accent: #7c3aed;
      --accent-hover: #6d28d9;
      --accent-light: #7c3aed15;
    }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--font);
    background-color: var(--bg-page);
    color: var(--text-primary);
    line-height: 1.5;
    padding: 0 1rem 4rem;
  }

  .container { max-width: 1080px; margin: 0 auto; }

  /* Header */
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1.5rem;
  }
  .brand { display: flex; align-items: center; gap: 0.75rem; }
  .brand-logo {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--accent), #ec4899);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: bold; font-size: 1.2rem;
  }
  .brand-title { font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; }
  .brand-subtitle { font-size: 0.8rem; color: var(--text-muted); }

  .header-actions { display: flex; align-items: center; gap: 0.75rem; }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.9rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s ease;
    text-decoration: none;
    font-family: inherit;
  }
  .btn-primary {
    background-color: var(--accent);
    color: #ffffff;
  }
  .btn-primary:hover { background-color: var(--accent-hover); }
  .btn-publish {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #ffffff;
    box-shadow: 0 2px 8px #10b98130;
  }
  .btn-publish:hover {
    background: linear-gradient(135deg, #059669, #047857);
  }
  .btn-publish.loading { opacity: 0.7; pointer-events: none; }
  .btn-outline {
    background-color: transparent;
    border-color: var(--border);
    color: var(--text-secondary);
  }
  .btn-outline:hover {
    background-color: var(--bg-card);
    color: var(--text-primary);
    border-color: var(--border-light);
  }
  .btn-danger {
    background-color: var(--danger-bg);
    border-color: #ef444440;
    color: var(--danger);
  }
  .btn-danger:hover {
    background-color: var(--danger);
    color: #fff;
  }
  .btn-sm { padding: 0.3rem 0.6rem; font-size: 0.8rem; border-radius: 4px; }

  /* Controls & Search */
  .controls-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .tabs {
    display: flex;
    background: var(--bg-card);
    padding: 0.25rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    gap: 0.25rem;
  }
  .tab-btn {
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .tab-btn:hover { color: var(--text-primary); }
  .tab-btn.active {
    background: var(--accent-light);
    color: var(--accent);
    font-weight: 600;
  }
  .badge-count {
    background: var(--border);
    color: var(--text-secondary);
    font-size: 0.75rem;
    padding: 0.1rem 0.45rem;
    border-radius: 10px;
  }
  .tab-btn.active .badge-count {
    background: var(--accent);
    color: #fff;
  }

  .search-box {
    position: relative;
    min-width: 240px;
    flex: 1;
    max-width: 320px;
  }
  .search-input {
    width: 100%;
    padding: 0.45rem 0.75rem 0.45rem 2rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.875rem;
    outline: none;
  }
  .search-input:focus { border-color: var(--accent); }
  .search-icon {
    position: absolute;
    left: 0.65rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    font-size: 0.85rem;
    pointer-events: none;
  }

  /* Status Bar */
  .publish-status-bar {
    display: none;
    align-items: center;
    justify-content: space-between;
    background: var(--accent-light);
    border: 1px solid var(--accent);
    padding: 0.6rem 1rem;
    border-radius: 8px;
    margin-bottom: 1.25rem;
    font-size: 0.85rem;
  }
  .publish-status-bar.show { display: flex; }

  /* Event Cards */
  .event-list { display: flex; flex-direction: column; gap: 0.85rem; }
  .event-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.1rem;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1.2rem;
    align-items: center;
    transition: transform 0.1s ease, border-color 0.15s ease;
  }
  .event-card:hover { border-color: var(--border-light); }
  .event-card.disabled { opacity: 0.6; filter: grayscale(0.5); }
  .event-card.past { opacity: 0.8; }

  /* Date & Thumbnail Column */
  .event-media-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 84px;
    text-align: center;
  }
  .poster-thumb {
    width: 68px;
    height: 68px;
    border-radius: 8px;
    object-fit: cover;
    background-color: var(--bg-page);
    border: 1px solid var(--border);
  }
  .poster-placeholder {
    width: 68px;
    height: 68px;
    border-radius: 8px;
    background: var(--bg-page);
    border: 1px dashed var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    color: var(--text-muted);
  }
  .date-pill {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--accent);
    line-height: 1.2;
  }

  /* Info Column */
  .event-info { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
  .event-header { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
  .event-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    text-decoration: none;
  }
  .event-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.825rem;
    color: var(--text-secondary);
  }
  .meta-item { display: inline-flex; align-items: center; gap: 0.3rem; }
  .event-excerpt {
    font-size: 0.85rem;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .event-links { display: flex; gap: 0.5rem; margin-top: 0.2rem; }
  .event-link-pill {
    font-size: 0.75rem;
    color: var(--accent);
    text-decoration: none;
    border: 1px solid var(--accent);
    padding: 0.1rem 0.5rem;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }
  .event-link-pill:hover { background: var(--accent-light); }

  /* Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.725rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .badge-upcoming { background: var(--success-bg); color: var(--success); }
  .badge-past { background: var(--border); color: var(--text-secondary); }
  .badge-cancelled { background: var(--danger-bg); color: var(--danger); }
  .badge-disabled { background: var(--warning-bg); color: var(--warning); }
  .badge-diff { background: #3b82f625; color: #60a5fa; border: 1px solid #3b82f640; }
  .badge-tag { background: var(--bg-page); border: 1px solid var(--border); color: var(--text-secondary); }

  /* Actions Column */
  .event-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }
  .actions-row { display: flex; align-items: center; gap: 0.5rem; }

  /* Switch */
  .switch-container { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--text-secondary); }
  .switch {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
  }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider {
    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
    background-color: var(--border);
    transition: .2s;
    border-radius: 20px;
  }
  .slider:before {
    position: absolute; content: "";
    height: 14px; width: 14px; left: 3px; bottom: 3px;
    background-color: white;
    transition: .2s;
    border-radius: 50%;
  }
  input:checked + .slider { background-color: var(--success); }
  input:checked + .slider:before { transform: translateX(16px); }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background: var(--bg-card);
    border: 1px dashed var(--border);
    border-radius: 10px;
    color: var(--text-muted);
  }
  .empty-state h3 { font-size: 1.1rem; color: var(--text-primary); margin-bottom: 0.4rem; }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  .modal-backdrop.open { display: flex; }
  .modal {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    width: 100%;
    max-width: 680px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.96) translateY(8px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .modal-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .modal-title { font-size: 1.2rem; font-weight: 700; }
  .modal-close {
    background: none; border: none; font-size: 1.5rem;
    color: var(--text-muted); cursor: pointer;
  }
  .modal-close:hover { color: var(--text-primary); }
  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-page);
    border-radius: 0 0 12px 12px;
  }

  /* Form Controls */
  .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .form-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .form-input, .form-textarea, .form-select {
    width: 100%;
    padding: 0.55rem 0.75rem;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.15s;
  }
  .form-input:focus, .form-textarea:focus, .form-select:focus {
    border-color: var(--accent);
  }
  .form-textarea { min-height: 80px; resize: vertical; line-height: 1.4; }
  .form-hint { font-size: 0.75rem; color: var(--text-muted); }

  /* Source Diff Box in Modal */
  .diff-alert {
    background: #3b82f615;
    border: 1px solid #3b82f640;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .diff-alert-title { font-weight: 600; color: #60a5fa; display: flex; justify-content: space-between; align-items: center; }
  .diff-field-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    background: var(--bg-card);
    padding: 0.35rem 0.6rem;
    border-radius: 4px;
    border: 1px solid var(--border);
  }
  .diff-field-name { font-weight: 600; color: var(--text-secondary); }
  .diff-field-val {
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 320px;
  }

  /* Image preview */
  .image-preview-wrap {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.25rem;
  }
  .image-preview {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    object-fit: cover;
    background: var(--bg-page);
    border: 1px solid var(--border);
  }

  /* Toasts */
  .toast-container {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 2000;
  }
  .toast {
    padding: 0.75rem 1.1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: toastIn 0.2s ease forwards;
  }
  @keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .toast-success { background: #059669; }
  .toast-error { background: #dc2626; }
  .toast-info { background: #2563eb; }

  @media (max-width: 720px) {
    .event-card { grid-template-columns: 1fr; gap: 0.75rem; }
    .event-media-date { flex-direction: row; width: auto; text-align: left; }
    .event-actions { flex-direction: row; justify-content: space-between; align-items: center; width: 100%; border-top: 1px solid var(--border); padding-top: 0.75rem; }
    .form-row { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="container">
  <header>
    <div class="brand">
      <div class="brand-logo">IL</div>
      <div>
        <h1 class="brand-title">Improv Lore</h1>
        <div class="brand-subtitle">Events &amp; Schedule Management</div>
      </div>
    </div>
    <div class="header-actions">
      <button class="btn btn-outline" id="btn-refresh" title="Reload from database">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
        Refresh
      </button>
      <button class="btn btn-outline" id="btn-pull" title="Pull and ingest latest events from blr.today & Underline Center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span id="btn-pull-label">Pull from Sources</span>
      </button>
      <button class="btn btn-publish" id="btn-publish" title="Deploy updates to live website">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
        <span id="btn-publish-label">Publish to Website</span>
      </button>
    </div>
  </header>

  <div class="publish-status-bar" id="pull-status-banner" style="background:#3b82f615; border-color:#3b82f640; color:#60a5fa;">
    <div style="display:flex; align-items:center; gap:0.6rem;">
      <span class="spinner" style="display:inline-block; width:14px; height:14px; border:2px solid #60a5fa; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></span>
      <span id="pull-status-text">Ingesting latest events from blr.today and Underline Center...</span>
    </div>
    <a id="pull-status-link" href="#" target="_blank" style="color:#60a5fa; text-decoration:underline; font-size:0.8rem; display:none;">View GitHub Logs ↗</a>
  </div>

  <div class="publish-status-bar" id="publish-banner">
    <div><strong>Ready to deploy:</strong> You have uncommitted or modified events saved in D1. Click "Publish to Website" to rebuild the live site.</div>
    <button class="btn btn-primary btn-sm" onclick="publishLive()">Publish Now</button>
  </div>

  <div class="controls-bar">
    <div class="tabs">
      <button class="tab-btn active" data-tab="upcoming">
        Upcoming <span class="badge-count" id="count-upcoming">0</span>
      </button>
      <button class="tab-btn" data-tab="review">
        Needs Review <span class="badge-count" id="count-review">0</span>
      </button>
      <button class="tab-btn" data-tab="past">
        Past Archive <span class="badge-count" id="count-past">0</span>
      </button>
      <button class="tab-btn" data-tab="disabled">
        Disabled <span class="badge-count" id="count-disabled">0</span>
      </button>
      <button class="tab-btn" data-tab="all">
        All <span class="badge-count" id="count-all">0</span>
      </button>
    </div>

    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input type="text" id="search-input" class="search-input" placeholder="Search shows, venue, tags…">
    </div>
  </div>

  <div id="events-container" class="event-list">
    <div class="empty-state">Loading events from database…</div>
  </div>
</div>

<!-- Edit Event Modal -->
<div class="modal-backdrop" id="edit-modal">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="modal-title">Edit Event</h2>
        <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;" id="modal-slug"></div>
      </div>
      <button class="modal-close" onclick="closeEditModal()">&times;</button>
    </div>

    <div class="modal-body">
      <!-- Pending source update diff banner (if any) -->
      <div id="modal-diff-box" class="diff-alert" style="display:none;"></div>

      <div class="form-group">
        <label class="form-label" for="edit-title">Show Title</label>
        <input type="text" id="edit-title" class="form-input" placeholder="Show Name">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="edit-starts">Starts At (Local Time)</label>
          <input type="datetime-local" id="edit-starts" class="form-input">
          <span class="form-hint" id="edit-starts-hint"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-ends">Ends At (Local Time)</label>
          <input type="datetime-local" id="edit-ends" class="form-input">
          <span class="form-hint" id="edit-ends-hint"></span>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="edit-venue">Venue</label>
          <input type="text" id="edit-venue" class="form-input" placeholder="e.g. Underline Center, Indiranagar">
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-tags">Tags (comma-separated)</label>
          <input type="text" id="edit-tags" class="form-input" placeholder="show, jam, UC">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="edit-url">Tickets / Booking URL</label>
          <input type="url" id="edit-url" class="form-input" placeholder="https://district.in/...">
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-learn-more">Learn More URL</label>
          <input type="url" id="edit-learn-more" class="form-input" placeholder="https://underline.center/t/...">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="edit-image-url">Poster Image URL</label>
        <input type="url" id="edit-image-url" class="form-input" placeholder="https://...">
        <div class="image-preview-wrap">
          <img id="image-preview" class="image-preview" src="" alt="Poster preview" style="display:none;">
          <span class="form-hint" id="image-preview-label">Live poster preview</span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="edit-excerpt">Short Excerpt (Card summary)</label>
        <textarea id="edit-excerpt" class="form-textarea" rows="2" placeholder="Brief summary for listings..."></textarea>
      </div>

      <div class="form-group">
        <label class="form-label" for="edit-full-content">Full Description</label>
        <textarea id="edit-full-content" class="form-textarea" rows="4" placeholder="Full details, performers, notes..."></textarea>
      </div>

      <div class="form-row" style="background:var(--bg-page); padding:0.75rem; border-radius:8px; border:1px solid var(--border);">
        <div class="form-group">
          <label class="form-label">Visibility on Website</label>
          <label class="switch-container" style="margin-top:0.4rem;">
            <label class="switch">
              <input type="checkbox" id="edit-enabled">
              <span class="slider"></span>
            </label>
            <span id="edit-enabled-label">Enabled</span>
          </label>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-occurrence-status">History Status</label>
          <select id="edit-occurrence-status" class="form-select" style="margin-top:0.25rem;">
            <option value="">Default (Upcoming)</option>
            <option value="occurred">Occurred</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeEditModal()">Cancel</button>
      <div style="display:flex; gap:0.6rem;">
        <button class="btn btn-primary" id="btn-save-event">Save to Database</button>
        <button class="btn btn-publish" id="btn-save-and-publish">Save &amp; Publish</button>
      </div>
    </div>
  </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal-backdrop" id="delete-modal">
  <div class="modal" style="max-width:440px;">
    <div class="modal-header">
      <h2 class="modal-title" style="color:var(--danger)">Delete Event</h2>
      <button class="modal-close" onclick="closeDeleteModal()">&times;</button>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to permanently delete this event occurrence from the database?</p>
      <div style="background:var(--bg-page); padding:0.75rem; border-radius:6px; border:1px solid var(--border); font-size:0.875rem;">
        <strong id="delete-event-title"></strong>
        <div style="color:var(--text-muted); font-size:0.8rem; margin-top:0.2rem;" id="delete-event-date"></div>
      </div>
      <p style="font-size:0.8rem; color:var(--text-muted);">This is irreversible and removes the row from Cloudflare D1. Useful for clearing out old or duplicate date entries.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeDeleteModal()">Cancel</button>
      <button class="btn btn-danger" id="btn-confirm-delete">Delete Permanently</button>
    </div>
  </div>
</div>

<div class="toast-container" id="toasts"></div>

<script>
let state = {
  events: [],
  currentTab: "upcoming",
  searchQuery: "",
  editingEventId: null,
  deletingEventId: null,
};

async function api(path, opts = {}) {
  const res = await fetch(path, opts);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Request failed (" + res.status + ")");
  }
  return res.status === 204 ? null : res.json();
}

function showToast(message, type = "success") {
  const container = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast toast-" + type;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
    setTimeout(() => el.remove(), 200);
  }, 3500);
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatISTDate(isoStr) {
  if (!isoStr) return "TBD";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(d) + " IST";
  } catch {
    return isoStr;
  }
}

function getRelativeTime(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const now = new Date();
  const diffDays = Math.round((d - now) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0) return "in " + diffDays + " days";
  return Math.abs(diffDays) + " days ago";
}

function toLocalDatetimeInput(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";
  const pad = n => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

function fromLocalDatetimeInput(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function loadData() {
  try {
    const raw = await api("/api/admin/events");
    // Normalize if backend returned array of groups or array of events
    let events = [];
    if (Array.isArray(raw)) {
      if (raw.length > 0 && raw[0].events) {
        events = raw.flatMap(g => g.events);
      } else {
        events = raw;
      }
    } else if (raw.events) {
      events = raw.events;
    }

    // Sort chronologically ascending
    events.sort((a, b) => new Date(a.event_starts_at || 0) - new Date(b.event_starts_at || 0));

    state.events = events;
    updateCounts();
    render();
  } catch (err) {
    showToast("Failed to load events: " + err.message, "error");
    document.getElementById("events-container").innerHTML =
      '<div class="empty-state"><h3>Error loading events</h3><p>' + escapeHtml(err.message) + '</p></div>';
  }
}

function updateCounts() {
  const up = state.events.filter(e => !e.is_past && e.enabled).length;
  const rev = state.events.filter(e => e.pending_source_update && Object.keys(e.pending_source_update).length > 0).length;
  const past = state.events.filter(e => e.is_past).length;
  const dis = state.events.filter(e => !e.enabled).length;

  document.getElementById("count-upcoming").textContent = up;
  document.getElementById("count-review").textContent = rev;
  document.getElementById("count-past").textContent = past;
  document.getElementById("count-disabled").textContent = dis;
  document.getElementById("count-all").textContent = state.events.length;
}

function getFilteredEvents() {
  const q = state.searchQuery.toLowerCase().trim();
  return state.events.filter(ev => {
    // Search query filter
    if (q) {
      const match =
        (ev.title && ev.title.toLowerCase().includes(q)) ||
        (ev.venue && ev.venue.toLowerCase().includes(q)) ||
        (ev.slug && ev.slug.toLowerCase().includes(q)) ||
        (ev.tags && ev.tags.some(t => t.toLowerCase().includes(q))) ||
        (ev.author && ev.author.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Tab filter
    if (state.currentTab === "upcoming") {
      return !ev.is_past && ev.enabled;
    }
    if (state.currentTab === "review") {
      return ev.pending_source_update && Object.keys(ev.pending_source_update).length > 0;
    }
    if (state.currentTab === "past") {
      return ev.is_past;
    }
    if (state.currentTab === "disabled") {
      return !ev.enabled;
    }
    return true; // "all"
  });
}

function render() {
  const container = document.getElementById("events-container");
  const filtered = getFilteredEvents();

  if (filtered.length === 0) {
    let emptyMsg = "No events found.";
    if (state.currentTab === "upcoming") emptyMsg = "No upcoming events scheduled.";
    if (state.currentTab === "review") emptyMsg = "No events need review. Everything is synced!";
    if (state.searchQuery) emptyMsg = 'No events match "' + escapeHtml(state.searchQuery) + '".';

    container.innerHTML = '<div class="empty-state"><h3>' + emptyMsg + '</h3><p>Switch tabs or refresh to view other records.</p></div>';
    return;
  }

  container.innerHTML = filtered.map(ev => {
    const hasDiff = ev.pending_source_update && Object.keys(ev.pending_source_update).length > 0;
    const cardClasses = ["event-card", !ev.enabled ? "disabled" : "", ev.is_past ? "past" : ""].filter(Boolean).join(" ");

    // Status pill
    let statusBadge = '<span class="badge badge-upcoming">Upcoming</span>';
    if (!ev.enabled) {
      statusBadge = '<span class="badge badge-disabled">Disabled</span>';
    } else if (ev.occurrence_status === "cancelled") {
      statusBadge = '<span class="badge badge-cancelled">Cancelled</span>';
    } else if (ev.is_past) {
      statusBadge = '<span class="badge badge-past">Occurred</span>';
    }

    const diffBadge = hasDiff ? '<span class="badge badge-diff">Source Updated</span>' : '';

    // Tags HTML
    const tagsHtml = (ev.tags || []).map(t => '<span class="badge badge-tag">' + escapeHtml(t) + '</span>').join(" ");

    // Date formatting
    const dateFormatted = formatISTDate(ev.event_starts_at);
    const relTime = getRelativeTime(ev.event_starts_at);

    // Media
    const mediaHtml = ev.image_url
      ? '<img class="poster-thumb" src="' + escapeHtml(ev.image_url) + '" alt="Poster" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML=\\'<div class=poster-placeholder>🎭</div>\\';">'
      : '<div class="poster-placeholder">🎭</div>';

    return '<div class="' + cardClasses + '" data-id="' + ev.id + '">' +
      '<div class="event-media-date">' +
        mediaHtml +
        '<div class="date-pill">' + relTime + '</div>' +
      '</div>' +
      '<div class="event-info">' +
        '<div class="event-header">' +
          '<span class="event-title">' + escapeHtml(ev.title || "(Untitled Event)") + '</span>' +
          statusBadge +
          diffBadge +
          tagsHtml +
        '</div>' +
        '<div class="event-meta">' +
          '<span class="meta-item">📅 <strong>' + dateFormatted + '</strong></span>' +
          (ev.venue ? '<span class="meta-item">📍 ' + escapeHtml(ev.venue) + '</span>' : '') +
          (ev.author ? '<span class="meta-item">👤 ' + escapeHtml(ev.author) + '</span>' : '') +
        '</div>' +
        (ev.excerpt ? '<div class="event-excerpt">' + escapeHtml(ev.excerpt) + '</div>' : '') +
        '<div class="event-links">' +
          (ev.url ? '<a href="' + escapeHtml(ev.url) + '" target="_blank" class="event-link-pill">Tickets ↗</a>' : '') +
          (ev.learn_more ? '<a href="' + escapeHtml(ev.learn_more) + '" target="_blank" class="event-link-pill">Forum Post ↗</a>' : '') +
        '</div>' +
      '</div>' +
      '<div class="event-actions">' +
        '<div class="actions-row">' +
          '<label class="switch-container" title="Toggle event visibility on website">' +
            '<label class="switch">' +
              '<input type="checkbox" class="toggle-enabled" data-id="' + ev.id + '"' + (ev.enabled ? ' checked' : '') + '>' +
              '<span class="slider"></span>' +
            '</label>' +
            '<span>' + (ev.enabled ? 'Live' : 'Off') + '</span>' +
          '</label>' +
          '<button class="btn btn-outline btn-sm" onclick="openEditModal(' + ev.id + ')">Edit</button>' +
          '<button class="btn btn-outline btn-sm" onclick="openDeleteModal(' + ev.id + ')" title="Delete duplicate or old event" style="color:var(--danger); border-color:#ef444430;">✕</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join("");
}

// Tab Switching
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.currentTab = btn.dataset.tab;
    render();
  });
});

// Search Filter
document.getElementById("search-input").addEventListener("input", (e) => {
  state.searchQuery = e.target.value;
  render();
});

// Refresh button
document.getElementById("btn-refresh").addEventListener("click", async () => {
  const btn = document.getElementById("btn-refresh");
  btn.disabled = true;
  await loadData();
  btn.disabled = false;
  showToast("Database refreshed", "info");
});

// Publish Live Button
async function publishLive() {
  const btn = document.getElementById("btn-publish");
  const label = document.getElementById("btn-publish-label");
  btn.classList.add("loading");
  label.textContent = "Deploying…";

  try {
    await api("/api/admin/publish", { method: "POST" });
    showToast("Website build triggered! Updates will be live in 1-2 minutes.", "success");
    document.getElementById("publish-banner").classList.remove("show");
  } catch (err) {
    showToast("Publish error: " + err.message, "error");
  } finally {
    btn.classList.remove("loading");
    label.textContent = "Publish to Website";
  }
}
document.getElementById("btn-publish").addEventListener("click", publishLive);

// Pull from Sources (GitHub Actions on-demand ingest)
let pullPollTimer = null;
async function pullFromSources() {
  const btn = document.getElementById("btn-pull");
  const label = document.getElementById("btn-pull-label");
  const banner = document.getElementById("pull-status-banner");
  const statusText = document.getElementById("pull-status-text");
  const statusLink = document.getElementById("pull-status-link");

  btn.disabled = true;
  label.textContent = "Triggering…";

  try {
    const res = await api("/api/admin/pull", { method: "POST" });
    if (!res.ok && res.error) throw new Error(res.error);

    banner.classList.add("show");
    statusText.textContent = "Ingestion started... Fetching from blr.today & Underline Center";
    statusLink.style.display = "none";
    showToast("Started pulling from blr.today & Underline Center", "info");

    const startTime = Date.now();
    clearInterval(pullPollTimer);
    pullPollTimer = setInterval(async () => {
      try {
        const st = await api("/api/admin/pull/status");
        if (st.htmlUrl) {
          statusLink.href = st.htmlUrl;
          statusLink.style.display = "inline";
        }
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        if (st.status === "in_progress" || st.status === "queued") {
          statusText.textContent = "Ingesting events from blr.today & Underline Center... (" + elapsed + "s, " + st.status + ")";
        } else if (st.status === "completed") {
          clearInterval(pullPollTimer);
          btn.disabled = false;
          label.textContent = "Pull from Sources";
          if (st.conclusion === "success") {
            statusText.textContent = "Completed in " + elapsed + "s! Updating events list...";
            setTimeout(() => banner.classList.remove("show"), 3500);
            showToast("Successfully pulled and updated events!", "success");
            await loadData();
          } else {
            statusText.textContent = "Ingestion failed (" + st.conclusion + "). Check GitHub logs.";
            showToast("Ingestion ended with: " + st.conclusion, "error");
          }
        }
      } catch (pollErr) {
        console.warn("Pull status poll error:", pollErr);
      }
    }, 3500);
  } catch (err) {
    btn.disabled = false;
    label.textContent = "Pull from Sources";
    banner.classList.remove("show");
    showToast("Pull failed: " + err.message, "error");
  }
}
document.getElementById("btn-pull").addEventListener("click", pullFromSources);

// Quick toggle enable/disable
document.getElementById("events-container").addEventListener("change", async (e) => {
  if (e.target.classList.contains("toggle-enabled")) {
    const id = Number(e.target.dataset.id);
    const enabled = e.target.checked;
    try {
      await api("/api/admin/events/" + id, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const ev = state.events.find(x => x.id === id);
      if (ev) ev.enabled = enabled;
      updateCounts();
      render();
      document.getElementById("publish-banner").classList.add("show");
      showToast(enabled ? "Event enabled" : "Event disabled", "info");
    } catch (err) {
      e.target.checked = !enabled;
      showToast("Failed to update status: " + err.message, "error");
    }
  }
});

// Edit Modal Functions
function openEditModal(id) {
  const ev = state.events.find(x => x.id === id);
  if (!ev) return;

  state.editingEventId = id;
  document.getElementById("modal-title").textContent = "Edit: " + (ev.title || "Untitled");
  document.getElementById("modal-slug").textContent = "Slug: " + ev.slug + " (ID #" + ev.id + ")";

  // Set form values
  document.getElementById("edit-title").value = ev.title || "";
  document.getElementById("edit-starts").value = toLocalDatetimeInput(ev.event_starts_at);
  document.getElementById("edit-ends").value = toLocalDatetimeInput(ev.event_ends_at);
  document.getElementById("edit-starts-hint").textContent = formatISTDate(ev.event_starts_at);
  document.getElementById("edit-ends-hint").textContent = formatISTDate(ev.event_ends_at);

  document.getElementById("edit-venue").value = ev.venue || "";
  document.getElementById("edit-tags").value = (ev.tags || []).join(", ");
  document.getElementById("edit-url").value = ev.url || "";
  document.getElementById("edit-learn-more").value = ev.learn_more || "";
  document.getElementById("edit-image-url").value = ev.image_url || "";
  document.getElementById("edit-excerpt").value = ev.excerpt || "";
  document.getElementById("edit-full-content").value = ev.full_content || "";
  document.getElementById("edit-enabled").checked = !!ev.enabled;
  document.getElementById("edit-occurrence-status").value = ev.occurrence_status || "";

  updateImagePreview(ev.image_url);

  // Check diffs with ingested source
  const diffBox = document.getElementById("modal-diff-box");
  const diffs = ev.pending_source_update || {};
  const diffKeys = Object.keys(diffs);

  if (diffKeys.length > 0) {
    diffBox.style.display = "flex";
    diffBox.innerHTML =
      '<div class="diff-alert-title">' +
        '<span>⚡ Discourse / blr.today has new source data for this event</span>' +
        '<button class="btn btn-outline btn-sm" onclick="acceptAllSourceFields(' + ev.id + ')" style="font-size:0.75rem;">Accept All Source Data</button>' +
      '</div>' +
      diffKeys.map(k =>
        '<div class="diff-field-row">' +
          '<span class="diff-field-name">' + k + ':</span>' +
          '<span class="diff-field-val">' + escapeHtml(String(diffs[k])) + '</span>' +
          '<button class="btn btn-outline btn-sm" style="font-size:0.7rem; padding:0.15rem 0.4rem;" onclick="acceptSourceField(\\'' + k + '\\', ' + JSON.stringify(diffs[k]).replace(/"/g, '&quot;') + ')">Apply</button>' +
        '</div>'
      ).join("");
  } else {
    diffBox.style.display = "none";
  }

  document.getElementById("edit-modal").classList.add("open");
}

function closeEditModal() {
  document.getElementById("edit-modal").classList.remove("open");
  state.editingEventId = null;
}

function updateImagePreview(url) {
  const img = document.getElementById("image-preview");
  const label = document.getElementById("image-preview-label");
  if (url) {
    img.src = url;
    img.style.display = "block";
    label.style.display = "none";
  } else {
    img.style.display = "none";
    label.style.display = "block";
    label.textContent = "No image URL entered";
  }
}
document.getElementById("edit-image-url").addEventListener("input", (e) => updateImagePreview(e.target.value));

document.getElementById("edit-starts").addEventListener("input", (e) => {
  const iso = fromLocalDatetimeInput(e.target.value);
  document.getElementById("edit-starts-hint").textContent = iso ? formatISTDate(iso) : "";
});
document.getElementById("edit-ends").addEventListener("input", (e) => {
  const iso = fromLocalDatetimeInput(e.target.value);
  document.getElementById("edit-ends-hint").textContent = iso ? formatISTDate(iso) : "";
});

window.acceptSourceField = function(key, val) {
  const map = {
    title: "edit-title",
    venue: "edit-venue",
    url: "edit-url",
    learn_more: "edit-learn-more",
    image_url: "edit-image-url",
    excerpt: "edit-excerpt",
    full_content: "edit-full-content"
  };
  if (key in map) {
    document.getElementById(map[key]).value = val || "";
    if (key === "image_url") updateImagePreview(val);
  } else if (key === "event_starts_at") {
    document.getElementById("edit-starts").value = toLocalDatetimeInput(val);
    document.getElementById("edit-starts-hint").textContent = formatISTDate(val);
  } else if (key === "event_ends_at") {
    document.getElementById("edit-ends").value = toLocalDatetimeInput(val);
    document.getElementById("edit-ends-hint").textContent = formatISTDate(val);
  } else if (key === "tags") {
    document.getElementById("edit-tags").value = Array.isArray(val) ? val.join(", ") : val;
  }
  showToast("Applied source " + key, "info");
};

window.acceptAllSourceFields = function(id) {
  const ev = state.events.find(x => x.id === id);
  if (!ev || !ev.pending_source_update) return;
  for (const [k, v] of Object.entries(ev.pending_source_update)) {
    window.acceptSourceField(k, v);
  }
  showToast("All source fields applied into form", "success");
};

async function saveEvent(andPublish = false) {
  if (!state.editingEventId) return;
  const id = state.editingEventId;

  const startsAt = fromLocalDatetimeInput(document.getElementById("edit-starts").value);
  const endsAt = fromLocalDatetimeInput(document.getElementById("edit-ends").value);

  const tagsRaw = document.getElementById("edit-tags").value;
  const tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);

  const payload = {
    title: document.getElementById("edit-title").value.trim(),
    event_starts_at: startsAt,
    event_ends_at: endsAt,
    venue: document.getElementById("edit-venue").value.trim(),
    tags: tags,
    url: document.getElementById("edit-url").value.trim(),
    learn_more: document.getElementById("edit-learn-more").value.trim(),
    image_url: document.getElementById("edit-image-url").value.trim(),
    excerpt: document.getElementById("edit-excerpt").value.trim(),
    full_content: document.getElementById("edit-full-content").value.trim(),
    enabled: document.getElementById("edit-enabled").checked,
    occurrence_status: document.getElementById("edit-occurrence-status").value || null,
  };

  const btn = document.getElementById(andPublish ? "btn-save-and-publish" : "btn-save-event");
  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Saving…";

  try {
    await api("/api/admin/events/" + id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    showToast("Event saved to database!", "success");
    closeEditModal();
    document.getElementById("publish-banner").classList.add("show");

    if (andPublish) {
      await publishLive();
    }

    await loadData();
  } catch (err) {
    showToast("Save error: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

document.getElementById("btn-save-event").addEventListener("click", () => saveEvent(false));
document.getElementById("btn-save-and-publish").addEventListener("click", () => saveEvent(true));

// Delete Event Functions
function openDeleteModal(id) {
  const ev = state.events.find(x => x.id === id);
  if (!ev) return;
  state.deletingEventId = id;
  document.getElementById("delete-event-title").textContent = ev.title || "Untitled";
  document.getElementById("delete-event-date").textContent = formatISTDate(ev.event_starts_at);
  document.getElementById("delete-modal").classList.add("open");
}

function closeDeleteModal() {
  document.getElementById("delete-modal").classList.remove("open");
  state.deletingEventId = null;
}

document.getElementById("btn-confirm-delete").addEventListener("click", async () => {
  if (!state.deletingEventId) return;
  const id = state.deletingEventId;
  const btn = document.getElementById("btn-confirm-delete");
  btn.disabled = true;
  btn.textContent = "Deleting…";

  try {
    await api("/api/admin/events/" + id, { method: "DELETE" });
    showToast("Event deleted from database", "info");
    closeDeleteModal();
    document.getElementById("publish-banner").classList.add("show");
    await loadData();
  } catch (err) {
    showToast("Delete failed: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Delete Permanently";
  }
});

// Initial load
loadData();
</script>
</body>
</html>`;

export function handleAdminPage() {
  return new Response(PAGE, { headers: { "content-type": "text/html; charset=utf-8" } });
}
