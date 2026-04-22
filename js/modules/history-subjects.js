function renderHistory() {
  const list = document.getElementById("history-list");
  const fSubj = document.getElementById("hist-subj-filter")?.value || "";
  const fDate = document.getElementById("hist-date-filter")?.value || "";
  const search = (
    document.getElementById("hist-search")?.value || ""
  ).toLowerCase();
  let sessions = [...state.sessions].sort((a, b) => b.id - a.id);
  if (fSubj) sessions = sessions.filter((s) => s.subjId == fSubj);
  if (fDate) sessions = sessions.filter((s) => s.date === fDate);
  if (search)
    sessions = sessions.filter((s) => {
      const subj = state.subjects.find((x) => x.id == s.subjId);
      const task = state.tasks.find((t) => t.id == s.taskId);
      return `${s.date || ""} ${s.notes || ""} ${subj?.name || ""} ${task?.title || ""}`
        .toLowerCase()
        .includes(search);
    });
  if (!sessions.length) {
    list.innerHTML = '<div class="empty">Nenhuma sessão</div>';
    return;
  }
  list.innerHTML = sessions
    .map((s) => {
      const subj = state.subjects.find((x) => x.id == s.subjId);
      const task = state.tasks.find((t) => t.id == s.taskId);
      return `<div class="history-item"><div class="history-duration">${formatDuration(s.duration)}</div><div class="history-meta">${subj ? `<span class="tag" style="background:${subj.color}22;color:${subj.color}">${sanitizeHTML(subj.name)}</span>` : ""}${task ? `<span style="font-size:12px;color:var(--text2)">📋 ${sanitizeHTML(task.title)}</span>` : ""}<div class="history-date">${sanitizeHTML(s.date || "")}</div>${s.notes ? `<div class="history-notes">"${sanitizeHTML(s.notes)}"</div>` : ""}</div><div class="task-actions"><button class="btn small" data-action="open-session" data-id="${s.id}">✏️</button><button class="btn small danger" data-action="delete-session" data-id="${s.id}">🗑</button></div></div>`;
    })
    .join("");
}
function renderSubjects() {
  const list = document.getElementById("subjects-list");
  if (!state.subjects.length) {
    list.innerHTML = '<div class="empty">Nenhuma matéria</div>';
    return;
  }
  list.innerHTML = state.subjects
    .map(
      (s) =>
        `<div class="subject-item"><div class="color-dot" style="background:${s.color}"></div><span style="flex:1;font-weight:600">${sanitizeHTML(s.name)}</span><button class="btn small" data-action="open-subject" data-id="${s.id}">✏️</button><button class="btn small danger" data-action="delete-subject" data-id="${s.id}">🗑</button></div>`,
    )
    .join("");
}
function openSubjectModal(id = null) {
  state.editingSubjectId = id;
  document.getElementById("subject-modal-title").textContent = id
    ? "Editar"
    : "Nova Matéria";
  if (id) {
    const s = state.subjects.find((x) => x.id == id);
    document.getElementById("subject-name-input").value = s.name;
    document.getElementById("subject-color-input").value = s.color;
  } else {
    document.getElementById("subject-name-input").value = "";
    document.getElementById("subject-color-input").value = "#7c6af7";
  }
  document.getElementById("subject-modal").classList.add("open");
  document.getElementById("subject-name-input").focus();
}
function saveSubject() {
  const name = document.getElementById("subject-name-input").value.trim();
  if (!name) {
    showToast("❌ Nome obrigatório", "warn");
    document.getElementById("subject-name-input").focus();
    return;
  }
  const color = document.getElementById("subject-color-input").value;
  if (state.editingSubjectId) {
    const s = state.subjects.find((x) => x.id == state.editingSubjectId);
    s.name = name;
    s.color = color;
    showToast("✏️ Matéria atualizada", "success");
  } else {
    state.subjects.push({ id: Date.now(), name, color, notes: "" });
    showToast("✅ Matéria criada", "success");
  }
  saveState();
  renderSubjects();
  updateSubjectFilter();
  closeModal("subject-modal");
}
function deleteSubject(id) {
  if (!confirm("⚠️ Deletar esta matéria?")) return;
  state.subjects = state.subjects.filter((s) => s.id != id);
  saveState();
  renderSubjects();
  updateSubjectFilter();
  showToast("🗑 Matéria removida", "warn");
}
function openSessionModal(id) {
  const s = state.sessions.find((x) => x.id == id);
  if (!s) return;
  state.editingSessionId = id;
  updateSubjectFilter();
  document.getElementById("hist-duration-input").value = Math.max(
    1,
    Math.round((s.duration || 0) / 60000),
  );
  document.getElementById("hist-edit-date-input").value =
    s.date || getDateStr();
  document.getElementById("hist-edit-subject-select").value = s.subjId || "";
  document.getElementById("hist-edit-task-select").value = s.taskId || "";
  document.getElementById("hist-edit-notes-input").value = s.notes || "";
  document.getElementById("history-modal").classList.add("open");
}
function saveEditedSession() {
  const s = state.sessions.find((x) => x.id == state.editingSessionId);
  if (!s) return;
  const oldTask = state.tasks.find((t) => t.id == s.taskId);
  if (oldTask)
    oldTask.timeSpent = Math.max(
      0,
      (oldTask.timeSpent || 0) - (s.duration || 0),
    );
  const minutes = clampNumber(
    document.getElementById("hist-duration-input").value,
    1,
    1440,
    1,
  );
  s.duration = minutes * 60000;
  s.date =
    document.getElementById("hist-edit-date-input").value || getDateStr();
  s.subjId = document.getElementById("hist-edit-subject-select").value;
  s.taskId = document.getElementById("hist-edit-task-select").value;
  s.notes = document.getElementById("hist-edit-notes-input").value.trim();
  const newTask = state.tasks.find((t) => t.id == s.taskId);
  if (newTask) newTask.timeSpent = (newTask.timeSpent || 0) + s.duration;
  recalculateXPFromSessions();
  saveState();
  closeModal("history-modal");
  updateXP();
  updateDashboard();
  renderHistory();
  renderTasks();
  showToast("✏️ Sessão atualizada", "success");
}
function deleteSession(id) {
  if (!confirm("⚠️ Excluir esta sessão?")) return;
  const s = state.sessions.find((x) => x.id == id);
  if (s && s.taskId) {
    const t = state.tasks.find((task) => task.id == s.taskId);
    if (t) t.timeSpent = Math.max(0, (t.timeSpent || 0) - (s.duration || 0));
  }
  state.sessions = state.sessions.filter((x) => x.id != id);
  recalculateXPFromSessions();
  saveState();
  closeModal("history-modal");
  updateXP();
  updateDashboard();
  renderHistory();
  renderTasks();
  showToast("🗑 Sessão removida", "warn");
}
function recalculateXPFromSessions() {
  state.xp = state.sessions.reduce(
    (sum, s) => sum + Math.max(1, Math.floor((s.duration || 0) / 60000)),
    0,
  );
}
function updateXP() {
  const xp = state.xp;
  const thresholds = [
    0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200, 6600,
  ];
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
  }
  level = Math.min(10, level);
  const currentMin = thresholds[level - 1] || 0;
  const nextXP = thresholds[level] || thresholds[thresholds.length - 1];
  const pct =
    level >= 10
      ? 100
      : Math.min(
          100,
          Math.round(((xp - currentMin) / (nextXP - currentMin)) * 100),
        );
  document.getElementById("xp-level").textContent = level;
  document.getElementById("xp-current").textContent = xp;
  document.getElementById("xp-fill").style.width = pct + "%";
  document.getElementById("xp-next").textContent =
    level < 10 ? `Próximo nível: ${nextXP} XP` : "Nível máximo!";
  const todayMins = Math.round(
    state.sessions
      .filter((s) => s.date === getDateStr())
      .reduce((a, b) => a + b.duration, 0) / 60000,
  );
  const weekMins = Math.round(
    getThisWeekSessions().reduce((a, b) => a + b.duration, 0) / 60000,
  );
  document.getElementById("xp-today").textContent = `${todayMins} min`;
  document.getElementById("xp-week").textContent = `${weekMins} min`;
  document.getElementById("xp-streak").textContent = calcStreak() + " 🔥";
}
