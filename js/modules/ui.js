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
function hasAnyUserData() {
  return Boolean(
    state.tasks.length ||
    state.sessions.length ||
    state.subjects.length ||
    state.wikiItems.length,
  );
}
function updateOnboarding() {
  const panel = document.getElementById("onboarding-panel");
  if (panel) panel.hidden = hasAnyUserData();
}
function loadSampleData() {
  if (
    hasAnyUserData() &&
    !confirm("Adicionar dados de exemplo aos dados atuais?")
  )
    return;
  const base = Date.now();
  const math = base;
  const chem = base + 1;
  const task = base + 2;
  state.subjects.push(
    { id: math, name: "Matemática", color: "#7c6af7", notes: "" },
    { id: chem, name: "Química", color: "#3ecf8e", notes: "" },
  );
  state.tasks.push({
    id: task,
    title: "Revisar derivadas",
    subjectId: math,
    status: "pending",
    timeSpent: 0,
    tags: ["revisar"],
    createdAt: new Date().toISOString(),
  });
  state.wikiItems.push({
    id: base + 3,
    title: "Regra da cadeia",
    category: "conteudo",
    content: "Se y = f(g(x)), então y' = f'(g(x)) * g'(x).",
    links: [],
    subjectId: math,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  state.subjectGoals[math] = 300;
  saveState();
  updateSubjectFilter();
  renderSubjects();
  renderTasks();
  renderWiki();
  updateDashboard();
  updateOnboarding();
  showToast("✅ Dados de exemplo carregados", "success");
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
  state.lastBackupAt = new Date().toISOString();
  saveState();
  updateBackupStatus();
  showToast("✅ Dados exportados!", "success");
}
function exportWeeklyReport() {
  const week = getThisWeekSessions();
  const total = week.reduce((sum, s) => sum + s.duration, 0);
  const bySubject = {};
  week.forEach((s) => {
    const subject = state.subjects.find((x) => x.id == s.subjId);
    const name = subject ? subject.name : "Sem matéria";
    bySubject[name] = (bySubject[name] || 0) + s.duration;
  });
  const lines = [
    `# Relatório semanal FocusFlow - ${getDateStr()}`,
    "",
    `Total estudado: ${formatDuration(total)}`,
    `Sessões: ${week.length}`,
    `Streak atual: ${calcStreak()} dias`,
    "",
    "## Por matéria",
    ...Object.entries(bySubject)
      .sort((a, b) => b[1] - a[1])
      .map(([name, ms]) => `- ${name}: ${formatDuration(ms)}`),
    "",
    "## Sessões",
    ...week.map((s) => {
      const subject = state.subjects.find((x) => x.id == s.subjId);
      return `- ${s.date}: ${formatDuration(s.duration)}${subject ? ` - ${subject.name}` : ""}${s.notes ? ` - ${s.notes}` : ""}`;
    }),
    "",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `focusflow-relatorio-semanal-${getDateStr()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("✅ Relatório semanal exportado!", "success");
}
function updateBackupStatus() {
  const el = document.getElementById("backup-status");
  if (!el) return;
  if (!state.lastBackupAt) {
    el.textContent = "Nenhum backup exportado neste navegador.";
    return;
  }
  const days = Math.floor(
    (Date.now() - new Date(state.lastBackupAt).getTime()) / 86400000,
  );
  el.textContent =
    days === 0
      ? "Último backup exportado hoje."
      : `Último backup exportado há ${days} dia${days > 1 ? "s" : ""}.`;
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
        updateOnboarding();
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
    subjectGoals: {},
    lastBackupAt: null,
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
  renderSubjectGoalsSettings();
  updateBackupStatus();
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
  updateDashboard();
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
  document
    .querySelectorAll(".mobile-nav-item")
    .forEach((x) => x.classList.toggle("active", x.dataset.page === p));
}
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("hidden");
  document.getElementById("main").classList.toggle("full");
}
