const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Improv Lore — Events Admin</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --bg-page: #fafafa;
    --bg-card: #ffffff;
    --border: #e4e4e7;
    --border-light: #f4f4f5;
    --text-primary: #18181b;
    --text-secondary: #52525b;
    --text-muted: #71717a;
    --btn-primary-bg: #18181b;
    --btn-primary-text: #ffffff;
    --btn-primary-hover: #27272a;
    --link-color: #2563eb;
    --status-green: #15803d;
    --status-green-bg: #f0fdf4;
    --status-amber: #b45309;
    --status-amber-bg: #fefce8;
    --status-red: #b91c1c;
    --status-red-bg: #fef2f2;
    --status-blue: #1d4ed8;
    --status-blue-bg: #eff6ff;
    --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg-page: #09090b;
      --bg-card: #18181b;
      --border: #27272a;
      --border-light: #27272a;
      --text-primary: #f4f4f5;
      --text-secondary: #a1a1aa;
      --text-muted: #71717a;
      --btn-primary-bg: #f4f4f5;
      --btn-primary-text: #18181b;
      --btn-primary-hover: #e4e4e7;
      --link-color: #60a5fa;
      --status-green: #4ade80;
      --status-green-bg: #052e16;
      --status-amber: #fde047;
      --status-amber-bg: #422006;
      --status-red: #f87171;
      --status-red-bg: #450a0a;
      --status-blue: #93c5fd;
      --status-blue-bg: #172554;
    }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--font);
    background-color: var(--bg-page);
    color: var(--text-primary);
    line-height: 1.5;
    padding: 0 1.25rem 4rem;
  }

  .container { max-width: 980px; margin: 0 auto; }

  /* Header */
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1.5rem;
  }
  .brand { display: flex; align-items: baseline; gap: 0.6rem; }
  .brand-title { font-size: 1.15rem; font-weight: 600; letter-spacing: -0.01em; }
  .brand-badge {
    font-size: 0.72rem;
    color: var(--text-muted);
    background: var(--bg-card);
    border: 1px solid var(--border);
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: 500;
  }

  .header-actions { display: flex; align-items: center; gap: 0.5rem; }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.8rem;
    border-radius: 6px;
    font-size: 0.825rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background-color 0.1s ease;
    text-decoration: none;
    font-family: inherit;
    line-height: 1;
  }
  .btn-primary {
    background-color: var(--btn-primary-bg);
    color: var(--btn-primary-text);
  }
  .btn-primary:hover { background-color: var(--btn-primary-hover); }
  .btn-outline {
    background-color: var(--bg-card);
    border-color: var(--border);
    color: var(--text-primary);
  }
  .btn-outline:hover {
    background-color: var(--border-light);
  }
  .btn-danger {
    background-color: var(--status-red-bg);
    border-color: transparent;
    color: var(--status-red);
  }
  .btn-danger:hover {
    background-color: var(--status-red);
    color: #fff;
  }
  .btn-sm { padding: 0.3rem 0.55rem; font-size: 0.775rem; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Controls & Search */
  .controls-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
    gap: 0.25rem;
  }
  .tab-btn {
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: -1px;
  }
  .tab-btn:hover { color: var(--text-primary); }
  .tab-btn.active {
    color: var(--text-primary);
    border-bottom-color: var(--text-primary);
    font-weight: 600;
  }
  .badge-count {
    font-size: 0.72rem;
    background: var(--border);
    color: var(--text-secondary);
    padding: 0.05rem 0.4rem;
    border-radius: 10px;
    font-weight: 500;
  }

  .search-box {
    position: relative;
    min-width: 220px;
  }
  .search-input {
    width: 100%;
    padding: 0.4rem 0.7rem 0.4rem 1.8rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.825rem;
    outline: none;
  }
  .search-input:focus { border-color: var(--text-secondary); }
  .search-icon {
    position: absolute;
    left: 0.6rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    font-size: 0.75rem;
    pointer-events: none;
  }

  /* Status Bar */
  .status-bar {
    display: none;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.9rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.825rem;
    border: 1px solid var(--border);
    background: var(--bg-card);
  }
  .status-bar.show { display: flex; }

  /* Event List */
  .event-list { display: flex; flex-direction: column; gap: 0.6rem; }
  .event-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.9rem 1rem;
    display: grid;
    grid-template-columns: 52px 1fr auto;
    gap: 1rem;
    align-items: center;
  }
  .event-card.disabled { opacity: 0.55; }
  .event-card.past { opacity: 0.75; }

  /* Thumbnail Column */
  .poster-thumb {
    width: 52px;
    height: 52px;
    border-radius: 6px;
    object-fit: cover;
    background-color: var(--bg-page);
    border: 1px solid var(--border);
  }
  .poster-placeholder {
    width: 52px;
    height: 52px;
    border-radius: 6px;
    background: var(--bg-page);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  /* Info Column */
  .event-info { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
  .event-header { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
  .event-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .event-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.65rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  .event-excerpt {
    font-size: 0.8rem;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 600px;
  }
  .event-links { display: flex; gap: 0.4rem; margin-top: 0.15rem; }
  .event-link-pill {
    font-size: 0.72rem;
    color: var(--link-color);
    text-decoration: none;
  }
  .event-link-pill:hover { text-decoration: underline; }

  /* Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.01em;
  }
  .badge-upcoming { background: var(--status-green-bg); color: var(--status-green); }
  .badge-past { background: var(--border); color: var(--text-secondary); }
  .badge-cancelled { background: var(--status-red-bg); color: var(--status-red); }
  .badge-disabled { background: var(--status-amber-bg); color: var(--status-amber); }
  .badge-diff { background: var(--status-blue-bg); color: var(--status-blue); }
  .badge-tag { background: transparent; border: 1px solid var(--border); color: var(--text-muted); }

  /* Actions Column */
  .event-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  /* Switch */
  .switch-container { display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: var(--text-secondary); }
  .switch {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 18px;
  }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider {
    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
    background-color: var(--border);
    transition: .15s;
    border-radius: 18px;
  }
  .slider:before {
    position: absolute; content: "";
    height: 12px; width: 12px; left: 3px; bottom: 3px;
    background-color: white;
    transition: .15s;
    border-radius: 50%;
  }
  input:checked + .slider { background-color: var(--status-green); }
  input:checked + .slider:before { transform: translateX(14px); }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.4);
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
    border-radius: 8px;
    width: 100%;
    max-width: 640px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  }
  .modal-header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .modal-title { font-size: 1rem; font-weight: 600; }
  .modal-close {
    background: none; border: none; font-size: 1.25rem;
    color: var(--text-muted); cursor: pointer;
  }
  .modal-close:hover { color: var(--text-primary); }
  .modal-body {
    padding: 1.25rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .modal-footer {
    padding: 0.85rem 1.25rem;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-page);
    border-radius: 0 0 8px 8px;
  }

  /* Form Controls */
  .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .form-label {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text-secondary);
  }
  .form-input, .form-textarea, .form-select {
    width: 100%;
    padding: 0.45rem 0.65rem;
    background: var(--bg-page);
    border: 1px solid var(--border);
    border-radius: 5px;
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.825rem;
    outline: none;
  }
  .form-input:focus, .form-textarea:focus, .form-select:focus {
    border-color: var(--text-primary);
  }
  .form-textarea { min-height: 70px; resize: vertical; line-height: 1.4; }
  .form-hint { font-size: 0.72rem; color: var(--text-muted); }

  /* Source Diff Box in Modal */
  .diff-alert {
    background: var(--status-blue-bg);
    border: 1px solid var(--status-blue);
    border-radius: 6px;
    padding: 0.7rem 0.85rem;
    font-size: 0.78rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
  .diff-alert-title { font-weight: 600; color: var(--status-blue); display: flex; justify-content: space-between; align-items: center; }
  .diff-field-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    background: var(--bg-card);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--border);
  }
  .diff-field-name { font-weight: 500; color: var(--text-secondary); }
  .diff-field-val {
    font-family: monospace;
    font-size: 0.72rem;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 280px;
  }

  /* Image preview */
  .image-preview-wrap {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.2rem;
  }
  .image-preview {
    width: 48px;
    height: 48px;
    border-radius: 5px;
    object-fit: cover;
    background: var(--bg-page);
    border: 1px solid var(--border);
  }

  /* Toasts */
  .toast-container {
    position: fixed;
    bottom: 1.25rem;
    right: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    z-index: 2000;
  }
  .toast {
    padding: 0.6rem 0.9rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #fff;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .toast-success { background: #166534; }
  .toast-error { background: #991b1b; }
  .toast-info { background: #1e3a8a; }

  @media (max-width: 700px) {
    .event-card { grid-template-columns: 1fr; gap: 0.6rem; }
    .event-actions { width: 100%; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 0.5rem; }
    .form-row { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<div class="container">
  <header>
    <div class="brand">
      <span class="brand-title">Improv Lore</span>
      <span class="brand-badge">Events Admin</span>
    </div>
    <div class="header-actions">
      <button class="btn btn-outline" id="btn-refresh" title="Reload from database">
        Refresh
      </button>
      <button class="btn btn-outline" id="btn-pull" title="Pull latest events from blr.today & Underline Center">
        Pull from Sources
      </button>
      <button class="btn btn-primary" id="btn-publish" title="Rebuild and deploy updates to improvlore.com">
        Publish to Website
      </button>
    </div>
  </header>

  <div class="status-bar" id="pull-status-banner">
    <div style="display:flex; align-items:center; gap:0.5rem;">
      <span style="display:inline-block; width:12px; height:12px; border:2px solid var(--text-muted); border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></span>
      <span id="pull-status-text">Ingesting events from blr.today and Underline Center...</span>
    </div>
    <a id="pull-status-link" href="#" target="_blank" style="color:var(--link-color); font-size:0.78rem; text-decoration:none; display:none;">View logs ↗</a>
  </div>

  <div class="status-bar" id="publish-banner" style="background:var(--status-amber-bg); border-color:transparent; color:var(--status-amber);">
    <span>You have modified events in D1. Click "Publish to Website" to deploy them live.</span>
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
      <input type="text" id="search-input" class="search-input" placeholder="Filter events…">
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
        <div style="font-size:0.72rem; color:var(--text-muted); font-family:monospace;" id="modal-slug"></div>
      </div>
      <button class="modal-close" onclick="closeEditModal()">&times;</button>
    </div>

    <div class="modal-body">
      <div id="modal-diff-box" class="diff-alert" style="display:none;"></div>

      <div class="form-group">
        <label class="form-label" for="edit-title">Title</label>
        <input type="text" id="edit-title" class="form-input" placeholder="Event Title">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="edit-starts">Starts At (Local)</label>
          <input type="datetime-local" id="edit-starts" class="form-input">
          <span class="form-hint" id="edit-starts-hint"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-ends">Ends At (Local)</label>
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
          <label class="form-label" for="edit-url">Tickets URL</label>
          <input type="url" id="edit-url" class="form-input" placeholder="https://district.in/...">
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-learn-more">Forum / Learn More URL</label>
          <input type="url" id="edit-learn-more" class="form-input" placeholder="https://underline.center/t/...">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="edit-image-url">Poster Image URL</label>
        <input type="url" id="edit-image-url" class="form-input" placeholder="https://...">
        <div class="image-preview-wrap">
          <img id="image-preview" class="image-preview" src="" alt="Poster" style="display:none;">
          <span class="form-hint" id="image-preview-label">No poster preview</span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="edit-excerpt">Excerpt</label>
        <textarea id="edit-excerpt" class="form-textarea" rows="2" placeholder="Short description for cards..."></textarea>
      </div>

      <div class="form-group">
        <label class="form-label" for="edit-full-content">Full Content</label>
        <textarea id="edit-full-content" class="form-textarea" rows="4" placeholder="Full details..."></textarea>
      </div>

      <div class="form-row" style="background:var(--bg-page); padding:0.6rem 0.8rem; border-radius:6px; border:1px solid var(--border);">
        <div class="form-group">
          <label class="form-label">Visibility</label>
          <label class="switch-container" style="margin-top:0.3rem;">
            <label class="switch">
              <input type="checkbox" id="edit-enabled">
              <span class="slider"></span>
            </label>
            <span id="edit-enabled-label">Live on website</span>
          </label>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-occurrence-status">History Status</label>
          <select id="edit-occurrence-status" class="form-select" style="margin-top:0.2rem;">
            <option value="">Default (Upcoming)</option>
            <option value="occurred">Occurred</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeEditModal()">Cancel</button>
      <div style="display:flex; gap:0.5rem;">
        <button class="btn btn-outline" id="btn-save-event">Save to Database</button>
        <button class="btn btn-primary" id="btn-save-and-publish">Save &amp; Publish</button>
      </div>
    </div>
  </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal-backdrop" id="delete-modal">
  <div class="modal" style="max-width:400px;">
    <div class="modal-header">
      <h2 class="modal-title" style="color:var(--status-red)">Delete Event</h2>
      <button class="modal-close" onclick="closeDeleteModal()">&times;</button>
    </div>
    <div class="modal-body">
      <p style="font-size:0.85rem;">Permanently remove this event occurrence from the database?</p>
      <div style="background:var(--bg-page); padding:0.6rem; border-radius:5px; border:1px solid var(--border); font-size:0.825rem;">
        <strong id="delete-event-title"></strong>
        <div style="color:var(--text-muted); font-size:0.75rem; margin-top:0.15rem;" id="delete-event-date"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeDeleteModal()">Cancel</button>
      <button class="btn btn-danger" id="btn-confirm-delete">Delete</button>
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
    setTimeout(() => el.remove(), 200);
  }, 3000);
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

    events.sort((a, b) => new Date(a.event_starts_at || 0) - new Date(b.event_starts_at || 0));

    state.events = events;
    updateCounts();
    render();
  } catch (err) {
    showToast("Failed to load events: " + err.message, "error");
    document.getElementById("events-container").innerHTML =
      '<div class="empty-state">Error loading events: ' + escapeHtml(err.message) + '</div>';
  }
}

function updateCounts() {
  const up = state.events.filter(e => !e.is_past && e.enabled).length;
  // Only future events can be in Needs Review
  const rev = state.events.filter(e => !e.is_past && e.pending_source_update && Object.keys(e.pending_source_update).length > 0).length;
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
    if (q) {
      const match =
        (ev.title && ev.title.toLowerCase().includes(q)) ||
        (ev.venue && ev.venue.toLowerCase().includes(q)) ||
        (ev.slug && ev.slug.toLowerCase().includes(q)) ||
        (ev.tags && ev.tags.some(t => t.toLowerCase().includes(q))) ||
        (ev.author && ev.author.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (state.currentTab === "upcoming") {
      return !ev.is_past && ev.enabled;
    }
    if (state.currentTab === "review") {
      return !ev.is_past && ev.pending_source_update && Object.keys(ev.pending_source_update).length > 0;
    }
    if (state.currentTab === "past") {
      return ev.is_past;
    }
    if (state.currentTab === "disabled") {
      return !ev.enabled;
    }
    return true;
  });
}

function render() {
  const container = document.getElementById("events-container");
  const filtered = getFilteredEvents();

  if (filtered.length === 0) {
    let emptyMsg = "No events found.";
    if (state.currentTab === "upcoming") emptyMsg = "No upcoming events scheduled.";
    if (state.currentTab === "review") emptyMsg = "No events need review. Everything is synced.";
    if (state.searchQuery) emptyMsg = 'No events match "' + escapeHtml(state.searchQuery) + '".';

    container.innerHTML = '<div class="empty-state">' + emptyMsg + '</div>';
    return;
  }

  container.innerHTML = filtered.map(ev => {
    // Only future events show update available
    const hasDiff = !ev.is_past && ev.pending_source_update && Object.keys(ev.pending_source_update).length > 0;
    const cardClasses = ["event-card", !ev.enabled ? "disabled" : "", ev.is_past ? "past" : ""].filter(Boolean).join(" ");

    let statusBadge = '<span class="badge badge-upcoming">Upcoming</span>';
    if (!ev.enabled) {
      statusBadge = '<span class="badge badge-disabled">Disabled</span>';
    } else if (ev.occurrence_status === "cancelled") {
      statusBadge = '<span class="badge badge-cancelled">Cancelled</span>';
    } else if (ev.is_past) {
      statusBadge = '<span class="badge badge-past">Occurred</span>';
    }

    const diffBadge = hasDiff ? '<span class="badge badge-diff">Update Available</span>' : '';
    const tagsHtml = (ev.tags || []).map(t => '<span class="badge badge-tag">' + escapeHtml(t) + '</span>').join(" ");
    const dateFormatted = formatISTDate(ev.event_starts_at);
    const relTime = getRelativeTime(ev.event_starts_at);

    const mediaHtml = ev.image_url
      ? '<img class="poster-thumb" src="' + escapeHtml(ev.image_url) + '" alt="" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML=\\'<div class=poster-placeholder>None</div>\\';">'
      : '<div class="poster-placeholder">None</div>';

    return '<div class="' + cardClasses + '" data-id="' + ev.id + '">' +
      '<div>' + mediaHtml + '</div>' +
      '<div class="event-info">' +
        '<div class="event-header">' +
          '<span class="event-title">' + escapeHtml(ev.title || "(Untitled)") + '</span>' +
          statusBadge +
          diffBadge +
          tagsHtml +
        '</div>' +
        '<div class="event-meta">' +
          '<span>' + dateFormatted + ' (' + relTime + ')</span>' +
          (ev.venue ? '<span>· ' + escapeHtml(ev.venue) + '</span>' : '') +
          (ev.author ? '<span>· by ' + escapeHtml(ev.author) + '</span>' : '') +
        '</div>' +
        (ev.excerpt ? '<div class="event-excerpt">' + escapeHtml(ev.excerpt) + '</div>' : '') +
        '<div class="event-links">' +
          (ev.url ? '<a href="' + escapeHtml(ev.url) + '" target="_blank" class="event-link-pill">Tickets ↗</a>' : '') +
          (ev.learn_more ? '<a href="' + escapeHtml(ev.learn_more)}" target="_blank" class="event-link-pill">Forum ↗</a>' : '') +
        '</div>' +
      '</div>' +
      '<div class="event-actions">' +
        '<label class="switch-container">' +
          '<label class="switch">' +
            '<input type="checkbox" class="toggle-enabled" data-id="' + ev.id + '"' + (ev.enabled ? ' checked' : '') + '>' +
            '<span class="slider"></span>' +
          '</label>' +
        '</label>' +
        '<button class="btn btn-outline btn-sm" onclick="openEditModal(' + ev.id + ')">Edit</button>' +
        '<button class="btn btn-outline btn-sm" onclick="openDeleteModal(' + ev.id + ')" title="Delete" style="color:var(--status-red);">✕</button>' +
      '</div>' +
    '</div>';
  }).join("");
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.currentTab = btn.dataset.tab;
    render();
  });
});

document.getElementById("search-input").addEventListener("input", (e) => {
  state.searchQuery = e.target.value;
  render();
});

document.getElementById("btn-refresh").addEventListener("click", async () => {
  const btn = document.getElementById("btn-refresh");
  btn.disabled = true;
  await loadData();
  btn.disabled = false;
  showToast("Refreshed", "info");
});

async function publishLive() {
  const btn = document.getElementById("btn-publish");
  btn.disabled = true;
  const origText = btn.textContent;
  btn.textContent = "Publishing…";

  try {
    await api("/api/admin/publish", { method: "POST" });
    showToast("Publish triggered! Website will rebuild in ~1-2 min.", "success");
    document.getElementById("publish-banner").classList.remove("show");
  } catch (err) {
    showToast("Publish error: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}
document.getElementById("btn-publish").addEventListener("click", publishLive);

let pullPollTimer = null;
async function pullFromSources() {
  const btn = document.getElementById("btn-pull");
  const banner = document.getElementById("pull-status-banner");
  const statusText = document.getElementById("pull-status-text");
  const statusLink = document.getElementById("pull-status-link");

  btn.disabled = true;
  const origText = btn.textContent;
  btn.textContent = "Pulling…";

  try {
    const res = await api("/api/admin/pull", { method: "POST" });
    if (!res.ok && res.error) throw new Error(res.error);

    banner.classList.add("show");
    statusText.textContent = "Started ingest on GitHub Actions runner...";
    statusLink.style.display = "none";
    showToast("Ingest started on GitHub Actions", "info");

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
          statusText.textContent = "Ingesting events from blr.today & Underline Center (" + elapsed + "s, " + st.status + ")";
        } else if (st.status === "completed") {
          clearInterval(pullPollTimer);
          btn.disabled = false;
          btn.textContent = origText;
          if (st.conclusion === "success") {
            statusText.textContent = "Ingest completed in " + elapsed + "s. Database updated.";
            setTimeout(() => banner.classList.remove("show"), 3000);
            showToast("Events updated from source", "success");
            await loadData();
          } else {
            statusText.textContent = "Ingest finished with: " + st.conclusion + ". Check logs.";
            showToast("Ingest ended: " + st.conclusion, "error");
          }
        }
      } catch (pollErr) {
        console.warn("Pull status error:", pollErr);
      }
    }, 3500);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = origText;
    banner.classList.remove("show");
    showToast("Pull failed: " + err.message, "error");
  }
}
document.getElementById("btn-pull").addEventListener("click", pullFromSources);

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
      showToast(enabled ? "Enabled" : "Disabled", "info");
    } catch (err) {
      e.target.checked = !enabled;
      showToast("Update failed: " + err.message, "error");
    }
  }
});

function openEditModal(id) {
  const ev = state.events.find(x => x.id === id);
  if (!ev) return;

  state.editingEventId = id;
  document.getElementById("modal-title").textContent = ev.title || "Untitled";
  document.getElementById("modal-slug").textContent = "slug: " + ev.slug + " · id: " + ev.id;

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

  // Diffs only shown for future events
  const diffBox = document.getElementById("modal-diff-box");
  const diffs = (!ev.is_past && ev.pending_source_update) ? ev.pending_source_update : {};
  const diffKeys = Object.keys(diffs);

  if (diffKeys.length > 0) {
    diffBox.style.display = "flex";
    diffBox.innerHTML =
      '<div class="diff-alert-title">' +
        '<span>Source has newer information for this event</span>' +
        '<button class="btn btn-outline btn-sm" onclick="acceptAllSourceFields(' + ev.id + ')" style="font-size:0.72rem;">Accept All</button>' +
      '</div>' +
      diffKeys.map(k =>
        '<div class="diff-field-row">' +
          '<span class="diff-field-name">' + k + ':</span>' +
          '<span class="diff-field-val">' + escapeHtml(String(diffs[k])) + '</span>' +
          '<button class="btn btn-outline btn-sm" style="font-size:0.7rem; padding:0.1rem 0.35rem;" onclick="acceptSourceField(\\'' + k + '\\', ' + JSON.stringify(diffs[k]).replace(/"/g, '&quot;') + ')">Apply</button>' +
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
    label.textContent = "No poster preview";
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
  showToast("Applied " + key, "info");
};

window.acceptAllSourceFields = function(id) {
  const ev = state.events.find(x => x.id === id);
  if (!ev || !ev.pending_source_update) return;
  for (const [k, v] of Object.entries(ev.pending_source_update)) {
    window.acceptSourceField(k, v);
  }
  showToast("All source fields applied", "success");
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

    showToast("Saved", "success");
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
    showToast("Deleted", "info");
    closeDeleteModal();
    document.getElementById("publish-banner").classList.add("show");
    await loadData();
  } catch (err) {
    showToast("Delete failed: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Delete";
  }
});

loadData();
</script>
</body>
</html>`;

export function handleAdminPage() {
  return new Response(PAGE, { headers: { "content-type": "text/html; charset=utf-8" } });
}
