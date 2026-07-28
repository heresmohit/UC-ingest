const PAGE = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Improv Lore — Events Admin</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
  h1 { display: flex; align-items: center; gap: 0.75rem; font-size: 1.4rem; }
  .community-toggle { font-size: 0.85rem; font-weight: normal; display: flex; align-items: center; gap: 0.4rem; }
  .group { border: 1px solid #8884; border-radius: 8px; margin-bottom: 1rem; padding: 0.75rem 1rem; }
  .group h2 { font-size: 1.05rem; margin: 0 0 0.5rem; }
  table { width: 100%; border-collapse: collapse; }
  td, th { text-align: left; padding: 0.3rem 0.4rem; font-size: 0.9rem; vertical-align: top; }
  tr.past { opacity: 0.6; }
  tr.disabled { text-decoration: line-through; opacity: 0.5; }
  .pending { background: #ffd54f33; border-radius: 3px; padding: 0 3px; }
  input[type=text], textarea { width: 100%; box-sizing: border-box; font: inherit; padding: 2px 4px; }
  textarea { min-height: 3rem; }
  button { font: inherit; cursor: pointer; }
  .status-select { font: inherit; }
  .field-label { font-size: 0.75rem; opacity: 0.6; display: block; }
  .loading { opacity: 0.5; }
</style>
</head>
<body>
<h1>
  Improv Lore Events
  <label class="community-toggle">
    <input type="checkbox" id="community-enabled"> community enabled
  </label>
</h1>
<div id="groups">Loading…</div>

<script>
async function api(path, opts) {
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

function fieldRow(event, key, label, multiline) {
  const value = event[key] ?? "";
  const pending = event.pending_source_update && key in event.pending_source_update;
  const sourceValue = pending ? String(event.pending_source_update[key] ?? "") : "";
  const pendingHtml = pending
    ? '<div class="pending">source: ' + escapeHtml(sourceValue) +
      ' <button data-accept="' + key + '" data-id="' + event.id + '" data-source-value="' +
      escapeHtml(sourceValue) + '">accept</button></div>'
    : "";
  const input = multiline
    ? '<textarea data-field="' + key + '" data-id="' + event.id + '">' + escapeHtml(value) + '</textarea>'
    : '<input type="text" data-field="' + key + '" data-id="' + event.id + '" value="' + escapeHtml(value) + '">';
  return '<div><span class="field-label">' + label + '</span>' + input + pendingHtml + '</div>';
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function eventRow(event) {
  const isPast = event.is_past;
  const rowClasses = [isPast ? "past" : "", !event.enabled ? "disabled" : ""].filter(Boolean).join(" ");
  const statusControl = isPast
    ? '<select class="status-select" data-status-id="' + event.id + '">' +
        '<option value="occurred"' + (event.occurrence_status !== "cancelled" ? " selected" : "") + '>occurred</option>' +
        '<option value="cancelled"' + (event.occurrence_status === "cancelled" ? " selected" : "") + '>cancelled</option>' +
      '</select>'
    : "";
  return '<tr class="' + rowClasses + '" data-row-id="' + event.id + '">' +
    '<td>' +
      fieldRow(event, "event_starts_at", "starts") +
      fieldRow(event, "event_ends_at", "ends") +
      statusControl +
    '</td>' +
    '<td>' +
      fieldRow(event, "title", "title") +
      fieldRow(event, "excerpt", "excerpt", true) +
      fieldRow(event, "full_content", "full_content", true) +
      fieldRow(event, "venue", "venue") +
      fieldRow(event, "url", "url") +
      fieldRow(event, "learn_more", "learn_more") +
      fieldRow(event, "image_url", "image_url") +
      fieldRow(event, "author", "author") +
    '</td>' +
    '<td><button data-toggle-id="' + event.id + '" data-enabled="' + event.enabled + '">' +
      (event.enabled ? "disable" : "enable") + '</button></td>' +
  '</tr>';
}

function groupHtml(group) {
  return '<div class="group"><h2>' + escapeHtml(group.title || "(untitled)") + '</h2>' +
    '<table>' + group.events.map(eventRow).join("") + '</table></div>';
}

async function render() {
  const [groups, community] = await Promise.all([
    api("/api/admin/events"),
    api("/api/admin/communities/improvlore"),
  ]);
  document.getElementById("community-enabled").checked = community.enabled;
  document.getElementById("groups").innerHTML = groups.map(groupHtml).join("") || "<p>No events.</p>";
}

document.getElementById("community-enabled").addEventListener("change", async (e) => {
  await api("/api/admin/communities/improvlore", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ enabled: e.target.checked }),
  });
});

document.getElementById("groups").addEventListener("click", async (e) => {
  const toggle = e.target.closest("[data-toggle-id]");
  if (toggle) {
    await api("/api/admin/events/" + toggle.dataset.toggleId, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: toggle.dataset.enabled !== "true" }),
    });
    return render();
  }
  const accept = e.target.closest("[data-accept]");
  if (accept) {
    const field = accept.dataset.accept;
    await api("/api/admin/events/" + accept.dataset.id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [field]: accept.dataset.sourceValue }),
    });
    return render();
  }
});

document.getElementById("groups").addEventListener("change", async (e) => {
  const statusSelect = e.target.closest("[data-status-id]");
  if (statusSelect) {
    await api("/api/admin/events/" + statusSelect.dataset.statusId, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ occurrence_status: statusSelect.value }),
    });
  }
});

document.getElementById("groups").addEventListener(
  "blur",
  async (e) => {
    const field = e.target.closest("[data-field]");
    if (!field) return;
    await api("/api/admin/events/" + field.dataset.id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [field.dataset.field]: field.value }),
    });
  },
  true
);

render();
</script>
</body>
</html>`;

export function handleAdminPage() {
  return new Response(PAGE, { headers: { "content-type": "text/html; charset=utf-8" } });
}
