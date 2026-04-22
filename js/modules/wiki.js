// ============================================================
// WIKI PESSOAL
// ============================================================
let wikiFilter = "todos";
function openWikiModal(id = null) {
  state.editingWikiId = id;
  document.getElementById("wiki-modal-title").textContent = id
    ? "Editar Item"
    : "Novo Item Wiki";
  if (id) {
    const w = state.wikiItems.find((w) => w.id == id);
    document.getElementById("wiki-title-input").value = w.title;
    document.getElementById("wiki-cat-input").value = w.category;
    document.getElementById("wiki-content-input").value = w.content || "";
    document.getElementById("wiki-links-input").value = (w.links || []).join(
      "\n",
    );
    document.getElementById("wiki-subject-select").value = w.subjectId || "";
  } else {
    document.getElementById("wiki-title-input").value = "";
    document.getElementById("wiki-cat-input").value = "conteudo";
    document.getElementById("wiki-content-input").value = "";
    document.getElementById("wiki-links-input").value = "";
    document.getElementById("wiki-subject-select").value = "";
  }
  document.getElementById("wiki-modal").classList.add("open");
  document.getElementById("wiki-title-input").focus();
}
function saveWikiItem() {
  const title = document.getElementById("wiki-title-input").value.trim();
  if (!title) {
    showToast("❌ Título obrigatório", "warn");
    document.getElementById("wiki-title-input").focus();
    return;
  }
  const category = document.getElementById("wiki-cat-input").value;
  const content = document.getElementById("wiki-content-input").value;
  const links = document
    .getElementById("wiki-links-input")
    .value.split("\n")
    .filter((l) => l.trim());
  const subjectId = document.getElementById("wiki-subject-select").value;
  if (state.editingWikiId) {
    const w = state.wikiItems.find((w) => w.id == state.editingWikiId);
    w.title = title;
    w.category = category;
    w.content = content;
    w.links = links;
    w.subjectId = subjectId;
    w.updatedAt = new Date().toISOString();
    showToast("✏️ Item atualizado", "success");
  } else {
    state.wikiItems.push({
      id: Date.now(),
      title,
      category,
      content,
      links,
      subjectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    showToast("✅ Item criado", "success");
  }
  saveState();
  renderWiki();
  updateOnboarding();
  closeModal("wiki-modal");
}
function deleteWikiItem(id) {
  if (!confirm("⚠️ Deletar este item da wiki?")) return;
  state.wikiItems = state.wikiItems.filter((w) => w.id != id);
  saveState();
  renderWiki();
  updateOnboarding();
  showToast("🗑 Item removido", "warn");
}
function renderWiki() {
  const grid = document.getElementById("wiki-grid");
  const cats = ["todos", "conteudo", "revisar", "links", "anotacoes"];
  const catNames = {
    todos: "Todos",
    conteudo: "📖 Conteúdo Estudado",
    revisar: "🔄 Para Revisar",
    links: "🔗 Links Úteis",
    anotacoes: "📝 Anotações Gerais",
  };
  const catsHtml = cats
    .map(
      (c) =>
        `<button class="wiki-cat-btn ${wikiFilter === c ? "active" : ""}" data-wiki-filter="${c}">${catNames[c]}</button>`,
    )
    .join("");
  document.getElementById("wiki-cats").innerHTML = catsHtml;
  const search = (
    document.getElementById("wiki-search")?.value || ""
  ).toLowerCase();
  let items =
    wikiFilter === "todos"
      ? state.wikiItems
      : state.wikiItems.filter((w) => w.category === wikiFilter);
  if (search)
    items = items.filter((w) =>
      `${w.title || ""} ${w.content || ""} ${(w.links || []).join(" ")}`
        .toLowerCase()
        .includes(search),
    );
  if (!items.length) {
    grid.innerHTML = '<div class="empty">Nenhum item na wiki ainda</div>';
    return;
  }
  grid.innerHTML = items
    .map((w) => {
      const subj = state.subjects.find((s) => s.id == w.subjectId);
      const content = w.content
        ? sanitizeHTML(w.content.substring(0, 200)) +
          (w.content.length > 200 ? "..." : "")
        : "<em>Sem anotações</em>";
      const links = (w.links || [])
        .map((l) => String(l).trim())
        .filter(Boolean)
        .map((l) => {
          const href = sanitizeURL(l);
          return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer" class="wiki-link">🔗 ${sanitizeHTML(l.substring(0, 40))}${l.length > 40 ? "..." : ""}</a>`;
        })
        .join("");
      return `<div class="wiki-card"><div class="wiki-title"><span>${sanitizeHTML(w.title || "Sem título")}</span><span class="wiki-category-tag">${catNames[w.category] || "Item"}</span></div>${subj ? `<div style="font-size:11px;color:var(--text3);margin-bottom:8px">📚 ${sanitizeHTML(subj.name)}</div>` : ""}<div class="wiki-content">${content}</div>${links ? `<div class="wiki-links">${links}</div>` : ""}<div class="wiki-actions"><button class="btn small" data-action="open-wiki" data-id="${w.id}">✏️</button><button class="btn small danger" data-action="delete-wiki" data-id="${w.id}">🗑</button></div></div>`;
    })
    .join("");
}
function setWikiFilter(filter) {
  wikiFilter = filter;
  renderWiki();
}
