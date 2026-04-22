// ============================================================
// TASKS com DRAG & DROP
// ============================================================
let taskFilter = "all";
let dragSrc = null;
let tagFilter = "";
function setFilter(f, el) {
  taskFilter = f;
  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));
  el.classList.add("active");
  renderTasks();
}
function setTagFilter(tag, el) {
  tagFilter = tagFilter === tag ? "" : tag;
  if (el) {
    el.classList.toggle("active");
    const color = getTagColors(tag).color;
    if (el.classList.contains("active")) {
      el.style.background = color + "40";
      el.style.borderWidth = "2px";
    } else {
      el.style.background = color + "22";
      el.style.borderWidth = "1px";
    }
  }
  renderTasks();
}
function renderTagFilterButtons() {
  const container = document.getElementById("tag-filter-row");
  if (!container) return;
  container.innerHTML = PREDEFINED_TAGS.map(
    (t) =>
      `<button class="filter-btn ${tagFilter === t.name ? "active" : ""}" data-tag-filter="${sanitizeHTML(t.name)}" style="background:${t.color}22;color:${t.color};border:1px solid ${t.color}">${sanitizeHTML(t.emoji)} ${sanitizeHTML(t.name)}</button>`,
  ).join("");
}
function openTaskModal(id = null) {
  state.editingTaskId = id;
  document.getElementById("task-modal-title").textContent = id
    ? "Editar"
    : "Nova Tarefa";
  const sel = document.getElementById("task-subject-select");
  sel.innerHTML = '<option value="">Sem matéria</option>';
  state.subjects.forEach((s) => {
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = s.name;
    sel.appendChild(o);
  });

  // Renderizar tags disponíveis
  const tagsContainer = document.getElementById("task-tags-container");
  tagsContainer.innerHTML = PREDEFINED_TAGS.map(
    (t) => `
    <button type="button" class="tag-btn" data-tag="${t.name}" 
            style="background:${t.color}22; color:${t.color}; border:1px solid ${t.color}; padding:6px 12px; border-radius:20px; cursor:pointer; font-weight:600; font-size:12px; transition:all .15s;">
      ${t.emoji} ${t.name}
    </button>
  `,
  ).join("");

  if (id) {
    const t = state.tasks.find((t) => t.id == id);
    document.getElementById("task-title-input").value = t.title;
    sel.value = t.subjectId || "";
    // Restaurar tags selecionadas
    if (t.tags) {
      document.querySelectorAll(".tag-btn").forEach((btn) => {
        if (t.tags.includes(btn.dataset.tag)) {
          btn.classList.add("active");
          btn.style.background = getTagColors(btn.dataset.tag).color + "40";
          btn.style.borderWidth = "2px";
        }
      });
    }
  } else {
    document.getElementById("task-title-input").value = "";
    sel.value = "";
    document.querySelectorAll(".tag-btn").forEach((btn) => {
      btn.classList.remove("active");
      btn.style.background = getTagColors(btn.dataset.tag).color + "22";
      btn.style.borderWidth = "1px";
    });
  }

  // Event listeners para tags
  document.querySelectorAll(".tag-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      btn.classList.toggle("active");
      if (btn.classList.contains("active")) {
        btn.style.background = getTagColors(btn.dataset.tag).color + "40";
        btn.style.borderWidth = "2px";
      } else {
        btn.style.background = getTagColors(btn.dataset.tag).color + "22";
        btn.style.borderWidth = "1px";
      }
    });
  });

  document.getElementById("task-modal").classList.add("open");
  document.getElementById("task-title-input").focus();
}
function saveTask() {
  const title = document.getElementById("task-title-input").value.trim();
  if (!title) {
    showToast("❌ Título obrigatório", "warn");
    document.getElementById("task-title-input").focus();
    return;
  }
  const subjectId = document.getElementById("task-subject-select").value;

  // Coletar tags selecionadas
  const selectedTags = [];
  document.querySelectorAll(".tag-btn.active").forEach((btn) => {
    selectedTags.push(btn.dataset.tag);
  });

  if (state.editingTaskId) {
    const t = state.tasks.find((t) => t.id == state.editingTaskId);
    t.title = title;
    t.subjectId = subjectId;
    t.tags = selectedTags;
    showToast("✏️ Tarefa atualizada", "success");
  } else {
    state.tasks.push({
      id: Date.now(),
      title,
      subjectId,
      status: "pending",
      timeSpent: 0,
      tags: selectedTags,
      createdAt: new Date().toISOString(),
    });
    showToast("✅ Tarefa criada", "success");
  }
  saveState();
  // Limpar filtro de tags para mostrar a tarefa recém-criada
  if (!state.editingTaskId && tagFilter !== "") {
    tagFilter = "";
    renderTagFilterButtons();
  }
  renderTasks();
  closeModal("task-modal");
  updateOnboarding();
}
function updateTaskStatus(id, status) {
  const t = state.tasks.find((t) => t.id == id);
  if (t) {
    t.status = status;
    saveState();
    renderTasks();
  }
}
function deleteTask(id) {
  if (!confirm("⚠️ Deletar esta tarefa permanentemente?")) return;
  state.tasks = state.tasks.filter((t) => t.id != id);
  saveState();
  renderTasks();
  updateOnboarding();
  showToast("🗑 Tarefa removida", "warn");
}
function handleDragStart(e, id) {
  dragSrc = id;
  e.dataTransfer.effectAllowed = "move";
  e.target.classList.add("dragging");
}
function handleDragEnd(e) {
  e.target.classList.remove("dragging");
}
function handleDrop(e) {
  e.preventDefault();
  const target = e.target.closest(".task-item");
  if (target && dragSrc !== null) {
    const dragId = dragSrc;
    const dropId = parseInt(target.dataset.id);
    const dragIndex = state.tasks.findIndex((t) => t.id == dragId);
    const dropIndex = state.tasks.findIndex((t) => t.id == dropId);
    if (dragIndex !== -1 && dropIndex !== -1) {
      const [moved] = state.tasks.splice(dragIndex, 1);
      state.tasks.splice(dropIndex, 0, moved);
      saveState();
      renderTasks();
      showToast("📌 Ordem atualizada", "info");
    }
  }
  dragSrc = null;
}
function renderTasks() {
  const list = document.getElementById("task-list");
  const fSubj = document.getElementById("filter-subject").value;
  const searchText = document.getElementById("task-search")
    ? document.getElementById("task-search").value.toLowerCase()
    : "";
  let tasks = state.tasks.filter((t) => {
    if (taskFilter === "pending") return t.status === "pending";
    if (taskFilter === "done") return t.status === "done";
    if (taskFilter === "postponed") return t.status === "postponed";
    return true;
  });
  if (fSubj) tasks = tasks.filter((t) => t.subjectId == fSubj);
  if (tagFilter)
    tasks = tasks.filter((t) => (t.tags || []).includes(tagFilter));
  if (searchText)
    tasks = tasks.filter((t) =>
      (t.title || "").toLowerCase().includes(searchText),
    );
  if (!tasks.length) {
    list.innerHTML = '<div class="empty">Nenhuma tarefa</div>';
    return;
  }
  list.innerHTML = tasks
    .map((task) => {
      const subj = state.subjects.find((s) => s.id == task.subjectId);
      const tagH = subj
        ? `<span class="tag" style="background:${subj.color}22;color:${subj.color}">${sanitizeHTML(subj.name)}</span>`
        : "";
      const tagsH = renderTagsInTask(task);
      const timeH = task.timeSpent
        ? `<span class="task-time">${formatDuration(task.timeSpent)}</span>`
        : "";
      const icon =
        task.status === "done"
          ? "✅"
          : task.status === "postponed"
            ? "⏳"
            : "🔘";
      return `<div class="task-item" draggable="true" data-id="${task.id}"><span style="font-size:15px">${icon}</span><span class="task-title ${task.status === "done" ? "done" : ""}">${sanitizeHTML(task.title || "")}</span><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${tagH}${tagsH}</div>${timeH}<div class="task-actions">${task.status !== "done" ? `<button class="btn small success" data-task-status="done" data-id="${task.id}">✅</button>` : ""}${task.status !== "postponed" ? `<button class="btn small amber" data-task-status="postponed" data-id="${task.id}">⏳</button>` : ""}${task.status !== "pending" ? `<button class="btn small" data-task-status="pending" data-id="${task.id}">↩</button>` : ""}<button class="btn small" data-action="open-task" data-id="${task.id}">✏️</button><button class="btn small danger" data-action="delete-task" data-id="${task.id}">🗑</button></div></div>`;
    })
    .join("");
}
function updateSubjectFilter() {
  [
    "filter-subject",
    "hist-subj-filter",
    "wiki-subject-select",
    "hist-edit-subject-select",
  ].forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    const empty =
      id === "wiki-subject-select" || id === "hist-edit-subject-select"
        ? "Nenhuma"
        : "Todas as matérias";
    sel.innerHTML = `<option value="">${empty}</option>`;
    state.subjects.forEach((s) => {
      const o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.name;
      sel.appendChild(o);
    });
    sel.value = cur;
  });
  const taskSel = document.getElementById("hist-edit-task-select");
  if (taskSel) {
    const cur = taskSel.value;
    taskSel.innerHTML = '<option value="">Sem vínculo</option>';
    state.tasks.forEach((t) => {
      const o = document.createElement("option");
      o.value = t.id;
      o.textContent = t.title;
      taskSel.appendChild(o);
    });
    taskSel.value = cur;
  }
}
