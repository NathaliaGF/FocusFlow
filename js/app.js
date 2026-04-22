// ============================================================
// INIT
// ============================================================
function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
let deferredInstallPrompt = null;
function setupAppEvents() {
  document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest("[data-close-modal]");
    if (closeBtn) {
      closeModal(closeBtn.dataset.closeModal);
      return;
    }
    const pageBtn = e.target.closest("[data-page]");
    if (pageBtn) {
      showPage(pageBtn.dataset.page, pageBtn);
      return;
    }
    const filterBtn = e.target.closest("[data-task-filter]");
    if (filterBtn) {
      setFilter(filterBtn.dataset.taskFilter, filterBtn);
      return;
    }
    const tagBtn = e.target.closest("[data-tag-filter]");
    if (tagBtn) {
      setTagFilter(tagBtn.dataset.tagFilter, tagBtn);
      return;
    }
    const wikiFilterBtn = e.target.closest("[data-wiki-filter]");
    if (wikiFilterBtn) {
      setWikiFilter(wikiFilterBtn.dataset.wikiFilter);
      return;
    }
    const statusBtn = e.target.closest("[data-task-status]");
    if (statusBtn) {
      updateTaskStatus(statusBtn.dataset.id, statusBtn.dataset.taskStatus);
      return;
    }
    const heatmapBtn = e.target.closest("[data-heatmap-color]");
    if (heatmapBtn) {
      setHeatmapColor(heatmapBtn.dataset.heatmapColor);
      return;
    }
    const actionBtn = e.target.closest("[data-action]");
    if (!actionBtn) return;
    const id = actionBtn.dataset.id;
    const actions = {
      "toggle-focus": () => toggleFocusMode(),
      "toggle-sidebar": () => toggleSidebar(),
      "toggle-clock": () => toggleClock(),
      "sw-toggle": () => swToggle(),
      "sw-reset": () => swReset(),
      "pomo-toggle": () => pomoToggle(),
      "pomo-reset": () => pomoReset(),
      "sess-start": () => sessStart(),
      "sess-end": () => sessEnd(),
      "open-task": () => openTaskModal(id || null),
      "save-task": () => saveTask(),
      "delete-task": () => deleteTask(id),
      "open-wiki": () => openWikiModal(id || null),
      "save-wiki": () => saveWikiItem(),
      "delete-wiki": () => deleteWikiItem(id),
      "open-subject": () => openSubjectModal(id || null),
      "save-subject": () => saveSubject(),
      "delete-subject": () => deleteSubject(id),
      "save-session": () => saveSession(),
      "open-session": () => openSessionModal(id),
      "delete-session": () => deleteSession(id),
      "delete-current-session": () => deleteSession(state.editingSessionId),
      "save-edited-session": () => saveEditedSession(),
      "clear-history-filters": () => clearHistoryFilters(),
      "export-data": () => exportData(),
      "open-import": () => document.getElementById("import-file").click(),
      "clear-data": () => clearAllData(),
      "save-preferences": () => savePreferences(),
      "load-sample-data": () => loadSampleData(),
      "export-weekly-report": () => exportWeeklyReport(),
      "add-subject-goal": () => addSubjectGoal(),
      "remove-subject-goal": () => updateSubjectGoal(id, 0),
      "install-app": () => installApp(),
    };
    if (actions[actionBtn.dataset.action]) actions[actionBtn.dataset.action]();
  });
  document
    .getElementById("filter-subject")
    ?.addEventListener("change", renderTasks);
  document
    .getElementById("task-search")
    ?.addEventListener("input", renderTasks);
  document.getElementById("wiki-search")?.addEventListener("input", renderWiki);
  ["hist-subj-filter", "hist-date-filter", "hist-search"].forEach((id) =>
    document
      .getElementById(id)
      ?.addEventListener(
        id === "hist-search" ? "input" : "change",
        renderHistory,
      ),
  );
  document
    .getElementById("import-file")
    ?.addEventListener("change", (e) => importData(e.target));
  document.addEventListener("change", (e) => {
    const select = e.target.closest("[data-subject-goal-select]");
    if (select) {
      const oldId = select.dataset.subjectGoalSelect;
      const value = state.subjectGoals[oldId];
      delete state.subjectGoals[oldId];
      state.subjectGoals[select.value] = value;
      saveState();
      renderSubjectGoalsSettings();
      renderSubjectGoalsDashboard();
      return;
    }
    const minutes = e.target.closest("[data-subject-goal-minutes]");
    if (minutes)
      updateSubjectGoal(minutes.dataset.subjectGoalMinutes, minutes.value);
  });
  const taskList = document.getElementById("task-list");
  taskList?.addEventListener("dragover", (e) => e.preventDefault());
  taskList?.addEventListener("drop", handleDrop);
  taskList?.addEventListener("dragstart", (e) => {
    const item = e.target.closest(".task-item");
    if (item) handleDragStart(e, item.dataset.id);
  });
  taskList?.addEventListener("dragend", (e) => {
    const item = e.target.closest(".task-item");
    if (item) handleDragEnd(e);
  });
}
function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const btn = document.getElementById("install-prompt");
    if (btn) btn.hidden = false;
  });
}
function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt = null;
  document.getElementById("install-prompt").hidden = true;
}
function setupBeforeUnloadWarning() {
  window.addEventListener("beforeunload", (e) => {
    if (!sess.running) return;
    persistActiveSession();
    e.preventDefault();
    e.returnValue = "";
  });
}
function init() {
  loadState();
  setupAppEvents();
  setupInstallPrompt();
  setupBeforeUnloadWarning();
  const focus = getPomoSeconds("focus");
  pomo.remaining = focus;
  pomo.baseRemaining = focus;
  if (!state.clockVisible) {
    document.getElementById("clock-display").style.display = "none";
    document.getElementById("clock-toggle-btn").textContent = "Exibir";
  }
  startClock();
  updatePomoRing();
  updateXP();
  updateSubjectFilter();
  renderTagFilterButtons();
  renderTasks();
  renderWiki();
  renderSubjects();
  renderHistory();
  updateDashboard();
  populatePreferenceInputs();
  const selectedBtn = document.getElementById(
    `heatmap-color-${state.heatmapColor}`,
  );
  if (selectedBtn) {
    selectedBtn.style.borderWidth = "2px";
    selectedBtn.style.borderColor = HEATMAP_COLORS[state.heatmapColor].base;
  }
  restoreActiveSession();
  updateOnboarding();
  setInterval(() => {
    updateDailyProgress();
  }, 60000);
  registerServiceWorker();
}
document.addEventListener("DOMContentLoaded", init);
document.querySelectorAll(".modal-overlay").forEach((el) => {
  el.addEventListener("click", (e) => {
    if (e.target === el) el.classList.remove("open");
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document
      .querySelectorAll(".modal-overlay.open")
      .forEach((m) => m.classList.remove("open"));
    document.getElementById("focus-overlay").classList.remove("open");
  }
});
function setupFocusTrap(modal) {
  const focusables = modal.querySelectorAll(
    'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
  );
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first)
          (last.focus(), e.preventDefault());
      } else {
        if (document.activeElement === last)
          (first.focus(), e.preventDefault());
      }
    }
  });
}
document.querySelectorAll(".modal").forEach((m) => setupFocusTrap(m));
