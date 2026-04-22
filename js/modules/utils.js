// ============================================================
// TAGS
// ============================================================
const PREDEFINED_TAGS = [
  { name: "urgente", color: "#e05252", emoji: "🔴" },
  { name: "importante", color: "#f5a623", emoji: "⭐" },
  { name: "revisar", color: "#5ba4cf", emoji: "🔄" },
  { name: "completo", color: "#3ecf8e", emoji: "✅" },
];

function getTagColors(tagName) {
  return (
    PREDEFINED_TAGS.find((t) => t.name === tagName) || {
      name: tagName,
      color: "#7c6af7",
      emoji: "🏷",
    }
  );
}

function renderTagsInTask(task) {
  if (!task.tags || !task.tags.length) return "";
  return task.tags
    .map((t) => {
      const tag = getTagColors(t);
      return `<span class="tag" style="background:${tag.color}22;color:${tag.color}" title="${escapeAttr(t)}">${sanitizeHTML(tag.emoji)} ${sanitizeHTML(t)}</span>`;
    })
    .join("");
}
function pad(n) {
  return String(n).padStart(2, "0");
}
function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
function formatDuration(ms) {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return mins + "min";
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return m > 0 ? h + "h " + m + "min" : h + "h";
}
function getDateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}
function getGoalMinutes() {
  return Number(state.goals && state.goals.day) || 120;
}
function getPomoSeconds(kind) {
  const p = state.pomodoro || {};
  if (kind === "longBreak") return clampNumber(p.longBreak, 1, 90, 15) * 60;
  if (kind === "shortBreak") return clampNumber(p.shortBreak, 1, 60, 5) * 60;
  return clampNumber(p.focus, 1, 180, 25) * 60;
}

function validateEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function sanitizeHTML(t) {
  const d = document.createElement("div");
  d.textContent = t ?? "";
  return d.innerHTML;
}
function escapeAttr(t) {
  return sanitizeHTML(t).replace(/"/g, "&quot;");
}
function sanitizeURL(url) {
  try {
    const parsed = new URL(url, location.href);
    if (parsed.protocol === "http:" || parsed.protocol === "https:")
      return parsed.href;
    return "#";
  } catch {
    return "#";
  }
}
let debounceTimer;
function debounceSave() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      localStorage.setItem("focusflow_v4", JSON.stringify(state));
    } catch (e) {}
  }, 500);
}
