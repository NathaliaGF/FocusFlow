// ============================================================
// UI HELPERS
// ============================================================
function startClock() {
  setInterval(() => {
    const n = new Date();
    document.getElementById("clock-display").textContent =
      `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
  }, 1000);
}
function toggleClock() {
  state.clockVisible = !state.clockVisible;
  document.getElementById("clock-display").style.display = state.clockVisible
    ? ""
    : "none";
  document.getElementById("clock-toggle-btn").textContent = state.clockVisible
    ? "Ocultar"
    : "Exibir";
  saveState();
}
function toggleFocusMode() {
  const focus = document.getElementById("focus-overlay");
  focus.classList.toggle("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}
function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  setTimeout(() => (t.className = "toast"), 3000);
}
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `focusflow-backup-${getDateStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("✅ Dados exportados!", "success");
}
function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.tasks || !data.sessions) {
        showToast("⚠️ Formato inválido", "warn");
        return;
      }
      if (
        confirm(
          "⚠️ Substituir TODOS os dados atuais? Esta ação é irreversível!",
        )
      ) {
        Object.assign(state, data);
        migrateState();
        saveState();
        showToast("✅ Importado! Recarregando...", "success");
        setTimeout(() => location.reload(), 1500);
      }
    } catch (err) {
      showToast("❌ Arquivo JSON inválido", "warn");
    }
  };
  reader.readAsText(file);
  input.value = "";
}
function clearAllData() {
  if (!confirm("⚠️ APAGAR TUDO? Esta ação não pode ser desfeita!")) {
    return;
  }
  if (!confirm("Tem certeza? Perderá TODOS os dados de estudo!")) {
    return;
  }
  localStorage.removeItem("focusflow_v4");
  sessionStorage.clear();
  state = {
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
  showToast("🗑 Dados apagados permanentemente", "warn");
  setTimeout(() => {
    location.href = location.pathname;
    location.reload();
  }, 100);
}
function clearHistoryFilters() {
  document.getElementById("hist-date-filter").value = "";
  document.getElementById("hist-subj-filter").value = "";
  document.getElementById("hist-search").value = "";
  renderHistory();
}
function populatePreferenceInputs() {
  document.getElementById("pomo-focus-input").value = state.pomodoro.focus;
  document.getElementById("pomo-short-input").value = state.pomodoro.shortBreak;
  document.getElementById("pomo-long-input").value = state.pomodoro.longBreak;
  document.getElementById("goal-day-input").value = getGoalMinutes();
}
function savePreferences() {
  state.pomodoro.focus = clampNumber(
    document.getElementById("pomo-focus-input").value,
    1,
    180,
    25,
  );
  state.pomodoro.shortBreak = clampNumber(
    document.getElementById("pomo-short-input").value,
    1,
    60,
    5,
  );
  state.pomodoro.longBreak = clampNumber(
    document.getElementById("pomo-long-input").value,
    1,
    90,
    15,
  );
  state.goals.day = clampNumber(
    document.getElementById("goal-day-input").value,
    1,
    1440,
    120,
  );
  state.goals.week = state.goals.day * 7;
  resetPomodoroDurations();
  saveState();
  updateDailyProgress();
  populatePreferenceInputs();
  showToast("✅ Preferências salvas", "success");
}
function showPage(p, el) {
  document
    .querySelectorAll(".page")
    .forEach((x) => x.classList.remove("active"));
  document.getElementById("page-" + p).classList.add("active");
  document
    .querySelectorAll(".nav-item")
    .forEach((x) => x.classList.remove("active"));
  if (el) el.classList.add("active");
  const titles = {
    home: "Temporizadores",
    tasks: "Tarefas",
    subjects: "Matérias",
    wiki: "Wiki Pessoal",
    history: "Histórico",
    dashboard: "Dashboard",
    settings: "Configurações",
  };
  document.getElementById("page-title").textContent = titles[p] || p;
  if (p === "dashboard") updateDashboard();
  if (p === "tasks") renderTasks();
  if (p === "wiki") renderWiki();
  if (p === "subjects") renderSubjects();
  if (p === "history") renderHistory();
  if (p === "settings") populatePreferenceInputs();
}
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("hidden");
  document.getElementById("main").classList.toggle("full");
}
