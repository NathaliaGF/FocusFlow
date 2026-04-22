# Changelog

Todas as mudanças relevantes do FocusFlow serão documentadas neste arquivo.

## 4.3.1 - 2026-04-22

- Preparação do projeto para publicação no GitHub.
- Arquivos antigos movidos para `legacy/`.
- Adicionados `.gitignore`, `LICENSE`, `CHANGELOG.md`, workflow de GitHub Pages e testes base com Playwright.
- README padronizado com nome FocusFlow, screenshot, dependências e roadmap.
- Handlers inline removidos do HTML em favor de delegação por `data-action`.
- JavaScript dividido em módulos por domínio em `js/modules/`.

## 4.4.0 - 2026-04-22

- Navegação inferior para mobile.
- Cards e ações de tarefa/histórico ajustados para telas pequenas.
- Onboarding inicial com ações rápidas e dados de exemplo.
- Aviso antes de sair com sessão em andamento e restauração via `sessionStorage`.
- Lembrete de último backup e exportação de relatório semanal em Markdown.
- Ícones PWA reais em PNG e página offline amigável.
- Metas semanais por matéria com progresso no dashboard.

## 4.3.0 - 2026-04-22

- Separação do app em `index.html`, `css/styles.css` e JavaScript externo.
- Correção do salvamento de sessões com duração zerada.
- Datas passam a usar o dia local.
- Histórico com filtros por matéria, data e busca.
- Busca adicionada à Wiki.
- Edição e exclusão de sessões antigas.
- Pomodoro e meta diária configuráveis.
- Dashboard com novos resumos.
- Chart.js movido para `vendor/` e cacheado pelo Service Worker.
