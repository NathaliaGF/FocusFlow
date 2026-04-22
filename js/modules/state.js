// ============================================================
// STATE
// ============================================================
let state = {
  tasks: [],
  sessions: [],
  subjects: [],
  wikiItems: [],
  xp: 0,
  clockVisible: true,
  taskOrder: [],
  lastWeeklyReport: null,
  tags: [],
  heatmapColor: "roxo",
  goals: { day: 120, week: 840 },
  pomodoro: { focus: 25, shortBreak: 5, longBreak: 15, longBreakEvery: 4 },
};

function migrateState() {
  state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
  state.sessions = Array.isArray(state.sessions) ? state.sessions : [];
  state.subjects = Array.isArray(state.subjects) ? state.subjects : [];
  state.wikiItems = Array.isArray(state.wikiItems) ? state.wikiItems : [];
  state.goals = state.goals || {};
  state.goals.day = Number(state.goals.day) || 120;
  state.goals.week = Number(state.goals.week) || state.goals.day * 7;
  if (state.goals.day <= 24) state.goals.day *= 60;
  if (state.goals.week <= 168) state.goals.week *= 60;
  state.pomodoro = Object.assign(
    { focus: 25, shortBreak: 5, longBreak: 15, longBreakEvery: 4 },
    state.pomodoro || {},
  );
  state.pomodoro.focus = clampNumber(state.pomodoro.focus, 1, 180, 25);
  state.pomodoro.shortBreak = clampNumber(state.pomodoro.shortBreak, 1, 60, 5);
  state.pomodoro.longBreak = clampNumber(state.pomodoro.longBreak, 1, 90, 15);
  state.pomodoro.longBreakEvery = clampNumber(
    state.pomodoro.longBreakEvery,
    2,
    12,
    4,
  );
  state.xp = Number(state.xp) || 0;
  state.heatmapColor = state.heatmapColor || "roxo";
}
function loadState() {
  try {
    const s = localStorage.getItem("focusflow_v4");
    if (s) Object.assign(state, JSON.parse(s));
  } catch (e) {}
  migrateState();
}
function saveState() {
  try {
    localStorage.setItem("focusflow_v4", JSON.stringify(state));
  } catch (e) {}
}
