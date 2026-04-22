let sw = { running: false, elapsed: 0, startTs: null, interval: null };
function swToggle() {
  if (sw.running) {
    sw.elapsed += Date.now() - sw.startTs;
    sw.running = false;
    clearInterval(sw.interval);
    document.getElementById("sw-start-btn").textContent = "Continuar";
  } else {
    sw.startTs = Date.now();
    sw.running = true;
    sw.interval = setInterval(() => {
      document.getElementById("stopwatch-display").textContent = formatMs(
        sw.elapsed + (Date.now() - sw.startTs),
      );
    }, 200);
    document.getElementById("sw-start-btn").textContent = "Pausar";
  }
}
function swReset() {
  clearInterval(sw.interval);
  sw = { running: false, elapsed: 0, startTs: null, interval: null };
  document.getElementById("stopwatch-display").textContent = "00:00:00";
  document.getElementById("sw-start-btn").textContent = "Iniciar";
}

let pomo = {
  remaining: 25 * 60,
  running: false,
  isBreak: false,
  isLongBreak: false,
  cycles: 0,
  startTs: null,
  baseRemaining: 25 * 60,
  interval: null,
};
function resetPomodoroDurations() {
  if (pomo.running) return;
  pomo.remaining = pomo.isBreak
    ? getPomoSeconds(pomo.isLongBreak ? "longBreak" : "shortBreak")
    : getPomoSeconds("focus");
  pomo.baseRemaining = pomo.remaining;
  updatePomoRing();
}
function updatePomoRing() {
  const total = pomo.isBreak
    ? getPomoSeconds(pomo.isLongBreak ? "longBreak" : "shortBreak")
    : getPomoSeconds("focus");
  const pct = total ? Math.max(0, Math.min(1, pomo.remaining / total)) : 0;
  const circ = 396;
  document.getElementById("pomo-ring").style.strokeDashoffset =
    circ - circ * pct;
  document.getElementById("pomo-display").textContent =
    `${pad(Math.floor(pomo.remaining / 60))}:${pad(pomo.remaining % 60)}`;
  document.getElementById("pomo-label").textContent = pomo.isBreak
    ? pomo.isLongBreak
      ? "PAUSA LONGA"
      : "PAUSA"
    : "FOCO";
}
function pomoToggle() {
  if (pomo.running) {
    pomo.remaining = Math.max(
      0,
      pomo.baseRemaining - Math.floor((Date.now() - pomo.startTs) / 1000),
    );
    pomo.running = false;
    clearInterval(pomo.interval);
    document.getElementById("pomo-start-btn").textContent = "Continuar";
  } else {
    pomo.startTs = Date.now();
    pomo.baseRemaining = pomo.remaining;
    pomo.running = true;
    document.getElementById("pomo-start-btn").textContent = "Pausar";
    pomo.interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - pomo.startTs) / 1000);
      pomo.remaining = Math.max(0, pomo.baseRemaining - elapsed);
      updatePomoRing();
      if (pomo.remaining <= 0) {
        clearInterval(pomo.interval);
        pomo.running = false;
        if (!pomo.isBreak) {
          pomo.cycles++;
          document.getElementById("pomo-cycles").textContent = pomo.cycles;
          pomo.isBreak = true;
          pomo.isLongBreak = pomo.cycles % state.pomodoro.longBreakEvery === 0;
          pomo.remaining = getPomoSeconds(
            pomo.isLongBreak ? "longBreak" : "shortBreak",
          );
          showToast("🍅 Pomodoro concluído!", "success");
        } else {
          pomo.isBreak = false;
          pomo.isLongBreak = false;
          pomo.remaining = getPomoSeconds("focus");
          showToast("⚡ Pausa acabou!", "info");
        }
        pomo.baseRemaining = pomo.remaining;
        document.getElementById("pomo-start-btn").textContent = "Iniciar";
        updatePomoRing();
      }
    }, 500);
  }
}
function pomoReset() {
  clearInterval(pomo.interval);
  const focus = getPomoSeconds("focus");
  pomo = {
    remaining: focus,
    running: false,
    isBreak: false,
    isLongBreak: false,
    cycles: pomo.cycles,
    startTs: null,
    baseRemaining: focus,
    interval: null,
  };
  document.getElementById("pomo-start-btn").textContent = "Iniciar";
  updatePomoRing();
}

let sess = { running: false, startTs: null, elapsed: 0, interval: null };
let pendingSessionMs = 0;
function sessStart() {
  if (sess.running) return;
  sess.startTs = Date.now();
  sess.elapsed = 0;
  sess.running = true;
  sess.interval = setInterval(() => {
    const cur = sess.elapsed + (Date.now() - sess.startTs);
    document.getElementById("session-display").textContent = formatMs(cur);
    document.getElementById("focus-timer-display").textContent = formatMs(cur);
  }, 500);
  document.getElementById("sess-start-btn").style.display = "none";
  document.getElementById("sess-end-btn").style.display = "";
  document.getElementById("focus-start-btn").style.display = "none";
  document.getElementById("focus-end-btn").style.display = "";
  document.getElementById("session-status").textContent = "🟢 Estudando...";
}
function sessEnd() {
  if (!sess.running) return;
  const totalMs = sess.elapsed + (Date.now() - sess.startTs);
  pendingSessionMs = totalMs;
  sess.running = false;
  clearInterval(sess.interval);
  document.getElementById("sess-start-btn").style.display = "";
  document.getElementById("sess-end-btn").style.display = "none";
  document.getElementById("focus-start-btn").style.display = "";
  document.getElementById("focus-end-btn").style.display = "none";
  document.getElementById("session-status").textContent = "Pressione Iniciar";
  document.getElementById("session-display").textContent = "00:00:00";
  document.getElementById("focus-timer-display").textContent = "00:00:00";
  document.getElementById("session-final-time").textContent = formatMs(totalMs);
  populateSessionModal();
  document.getElementById("session-modal").classList.add("open");
  sess = { running: false, startTs: null, elapsed: 0, interval: null };
}
function populateSessionModal() {
  const ts = document.getElementById("session-task-select");
  ts.innerHTML = '<option value="">Sem vínculo</option>';
  state.tasks.forEach((t) => {
    if (t.status !== "done") {
      const o = document.createElement("option");
      o.value = t.id;
      o.textContent = t.title;
      ts.appendChild(o);
    }
  });
  const ss = document.getElementById("session-subject-select");
  ss.innerHTML = '<option value="">Sem matéria</option>';
  state.subjects.forEach((s) => {
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = s.name;
    ss.appendChild(o);
  });
}
function saveSession() {
  const ms = pendingSessionMs || 0;
  if (ms <= 0) {
    showToast("⚠️ Sessão sem duração para salvar", "warn");
    return;
  }
  const mins = Math.floor(ms / 60000);
  const taskId = document.getElementById("session-task-select").value;
  const subjId = document.getElementById("session-subject-select").value;
  const notes = document.getElementById("session-notes").value.trim();
  const now = new Date();
  state.sessions.push({
    id: Date.now(),
    date: getDateStr(now),
    hour: now.getHours(),
    duration: ms,
    taskId,
    subjId,
    notes,
  });
  if (taskId) {
    const t = state.tasks.find((t) => t.id == taskId);
    if (t) t.timeSpent = (t.timeSpent || 0) + ms;
  }
  state.xp += Math.max(1, mins);
  pendingSessionMs = 0;
  saveState();
  document.getElementById("session-notes").value = "";
  closeModal("session-modal");
  updateXP();
  updateDashboard();
  renderHistory();
  showToast(`✅ ${formatDuration(ms)} salvos!`, "success");
}
