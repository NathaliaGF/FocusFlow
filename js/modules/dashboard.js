// ============================================================
// CONFETES
// ============================================================
let confettiActive = false;
function showConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  canvas.style.display = "block";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  const particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - 200,
      size: Math.random() * 6 + 3,
      color: `hsl(${Math.random() * 360},70%,60%)`,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 5 + 3,
      rotation: 0,
      spin: (Math.random() - 0.5) * 10,
    });
  }
  let frame = 0;
  function animate() {
    if (frame > 150) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = "none";
      confettiActive = false;
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
      if (p.y > canvas.height + 50) p.y = -50;
    });
    frame++;
    requestAnimationFrame(animate);
  }
  animate();
}
function updateDailyProgress() {
  const todayMs = state.sessions
    .filter((s) => s.date === getDateStr())
    .reduce((a, b) => a + b.duration, 0);
  const todayMin = Math.round(todayMs / 60000);
  const goalMin = getGoalMinutes();
  const pct = Math.min(100, (todayMin / goalMin) * 100);
  document.getElementById("today-min").textContent = todayMin;
  document.getElementById("today-bar").style.width = pct + "%";
  const goalLabel = document.getElementById("daily-goal-label");
  if (goalLabel) goalLabel.textContent = goalMin;
}

// ============================================================
// DASHBOARD
// ============================================================
let weekChart = null;

// ============================================================
// HEATMAP
// ============================================================
function renderHeatmap() {
  const container = document.getElementById("heatmap-container");
  if (!container) return;

  // Limpar container anterior
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const grid = document.createElement("div");
  grid.className = "heatmap-grid";

  // Últimos 365 dias
  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = getDateStr(d);
    const mins = Math.round(
      state.sessions
        .filter((s) => s.date === ds)
        .reduce((a, b) => a + b.duration, 0) / 60000,
    );

    // Calcular nível de intensidade (0-4)
    const level =
      mins === 0 ? 0 : mins < 30 ? 1 : mins < 60 ? 2 : mins < 120 ? 3 : 4;

    const cell = document.createElement("div");
    cell.className = `hm-cell l${level}`;
    cell.title = `${ds}: ${mins}min`;
    cell.style.cursor = "pointer";
    grid.appendChild(cell);
  }
  container.appendChild(grid);
}

const HEATMAP_COLORS = {
  roxo: { base: "#7c6af7", name: "Roxo" },
  verde: { base: "#3ecf8e", name: "Verde" },
  azul: { base: "#5ba4cf", name: "Azul" },
  vermelho: { base: "#e05252", name: "Vermelho" },
};

function setHeatmapColor(color) {
  if (!HEATMAP_COLORS[color]) return;
  state.heatmapColor = color;
  saveState();

  // Atualizar visual dos botões
  document.querySelectorAll('[id^="heatmap-color-"]').forEach((btn) => {
    btn.style.borderWidth = "1px";
    btn.style.borderColor = "var(--border2)";
  });
  const selectedBtn = document.getElementById(`heatmap-color-${color}`);
  if (selectedBtn) {
    selectedBtn.style.borderWidth = "2px";
    selectedBtn.style.borderColor = HEATMAP_COLORS[color].base;
  }

  // Re-renderizar heatmap
  updateDashboard();
}

function getHeatmapColorClass(level) {
  const color = state.heatmapColor || "roxo";
  const baseColor = HEATMAP_COLORS[color].base;
  const intensity = [0, 0.2, 0.4, 0.65, 0.9][level];
  const rgb = parseInt(baseColor.slice(1), 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;
  return `rgba(${r},${g},${b},${intensity})`;
}

function updateDashboard() {
  const today = getDateStr();
  const todayMs = state.sessions
    .filter((s) => s.date === today)
    .reduce((a, b) => a + b.duration, 0);
  const weekMs = getThisWeekSessions().reduce((a, b) => a + b.duration, 0);
  const totalMs = state.sessions.reduce((a, b) => a + b.duration, 0);
  const streak = calcStreak();
  document.getElementById("dash-today").textContent = formatDuration(todayMs);
  document.getElementById("dash-week").textContent = formatDuration(weekMs);
  document.getElementById("dash-streak").textContent = streak + "🔥";
  document.getElementById("dash-total").textContent = formatDuration(totalMs);
  updateDashboardInsights();
  updateDailyProgress();
  buildWeekChart();
  renderHeatmap();
  document.querySelectorAll(".hm-cell").forEach((cell) => {
    const level = cell.className.match(/l(\d)/) ? parseInt(RegExp.$1) : 0;
    if (level > 0) cell.style.background = getHeatmapColorClass(level);
  });
}
function updateDashboardInsights() {
  const byDate = {};
  const bySubject = {};
  state.sessions.forEach((s) => {
    byDate[s.date] = (byDate[s.date] || 0) + s.duration;
    const key = s.subjId || "";
    bySubject[key] = (bySubject[key] || 0) + s.duration;
  });
  const best = Object.entries(byDate).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("dash-best-day").textContent = best
    ? formatDuration(best[1])
    : "0min";
  document.getElementById("dash-best-day-label").textContent = best
    ? best[0]
    : "Sem dados";
  const top = Object.entries(bySubject).sort((a, b) => b[1] - a[1])[0];
  const topSubj = top ? state.subjects.find((s) => s.id == top[0]) : null;
  document.getElementById("dash-top-subject").textContent = top
    ? topSubj
      ? topSubj.name
      : "Sem matéria"
    : "-";
  document.getElementById("dash-top-subject-time").textContent = top
    ? formatDuration(top[1])
    : "0min";
  const avg = state.sessions.length
    ? state.sessions.reduce((a, b) => a + b.duration, 0) / state.sessions.length
    : 0;
  document.getElementById("dash-avg-session").textContent = formatDuration(avg);
  document.getElementById("dash-session-count").textContent =
    `${state.sessions.length} sessões`;
}
function getThisWeekSessions() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return state.sessions.filter((s) => new Date(s.date + "T12:00:00") >= start);
}
function calcStreak() {
  let streak = 0;
  for (let i = 0; i <= 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = getDateStr(d);
    const mins = Math.round(
      state.sessions
        .filter((s) => s.date === ds)
        .reduce((a, b) => a + b.duration, 0) / 60000,
    );
    if (mins >= 10) streak++;
    else if (i > 0) break;
  }
  return streak;
}
function buildWeekChart() {
  const labels = [],
    data = [];
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = getDateStr(d);
    labels.push(days[d.getDay()]);
    data.push(
      Math.round(
        state.sessions
          .filter((s) => s.date === ds)
          .reduce((a, b) => a + b.duration, 0) / 60000,
      ),
    );
  }
  const canvas = document.getElementById("week-chart");
  if (!canvas) return;
  if (typeof Chart === "undefined") {
    canvas.parentElement.innerHTML =
      '<div class="empty">Gráfico indisponível offline até o Chart.js ser carregado uma vez.</div>';
    return;
  }
  const ctx = canvas.getContext("2d");
  if (weekChart) weekChart.destroy();
  weekChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: "rgba(124,106,247,.5)",
          borderColor: "rgba(124,106,247,1)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}
