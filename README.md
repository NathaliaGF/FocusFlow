# FocusFlow

FocusFlow é um app local de estudos feito com HTML, CSS e JavaScript puro. Ele reúne temporizadores, Pomodoro configurável, tarefas com tags, matérias, wiki pessoal, histórico editável e dashboard de produtividade.

![Preview do FocusFlow](docs/assets/screenshot.svg)

## Funcionalidades

- Cronômetro livre.
- Pomodoro com duração de foco, pausa curta e pausa longa configuráveis.
- Sessões de estudo com duração, matéria, tarefa e notas.
- Tarefas com CRUD, status, busca, filtros por matéria/status/tag e drag and drop.
- Wiki pessoal com categorias, busca, links seguros e vínculo com matérias.
- Histórico com filtro por matéria, data, busca, edição e exclusão de sessões.
- Dashboard com hoje, semana, streak, total, melhor dia, matéria mais estudada, sessão média, gráfico de 7 dias e heatmap anual.
- Exportação/importação de backup JSON.
- PWA com `manifest.webmanifest` e `sw.js`.

## Como Rodar

O app funciona como site estático. Para abrir com Service Worker e comportamento de PWA, use um servidor local:

```bash
python3 -m http.server 8090
```

Depois acesse:

```text
http://localhost:8090
```

Também é possível abrir `index.html` direto no navegador, mas o Service Worker não registra em `file://`.

## Estrutura

```text
index.html                 Interface principal
css/styles.css             Estilos do app
js/app.js                  Entrada, eventos e inicialização
js/modules/                Estado, timers, tarefas, wiki, dashboard e UI
vendor/chart.umd.min.js    Chart.js local para gráficos
manifest.webmanifest       Manifest do PWA
sw.js                      Service Worker
docs/assets/screenshot.svg Preview usado no README
legacy/                    Arquivos antigos preservados
tests/                     Testes básicos com Playwright
```

## Dependências

Runtime:

- Chart.js está versionado localmente em `vendor/chart.umd.min.js`.
- As fontes Syne e JetBrains Mono ainda são carregadas pelo Google Fonts no `index.html`.

Desenvolvimento:

- Playwright para testes.
- Prettier para formatação.

Instalação opcional para testes/formatação:

```bash
npm install
npm test
npm run format
```

Para remover a última dependência externa em runtime, baixe as fontes usadas pelo Google Fonts para uma pasta local e ajuste o `<link>` de fontes no `index.html`.

## Dados

Os dados ficam no `localStorage`, na chave:

```text
focusflow_v4
```

Formato principal:

```json
{
  "tasks": [],
  "sessions": [],
  "subjects": [],
  "wikiItems": [],
  "xp": 0,
  "clockVisible": true,
  "heatmapColor": "roxo",
  "goals": { "day": 120, "week": 840 },
  "pomodoro": {
    "focus": 25,
    "shortBreak": 5,
    "longBreak": 15,
    "longBreakEvery": 4
  }
}
```

Backups antigos são migrados ao carregar/importar. Por exemplo, metas antigas em horas pequenas, como `day: 2`, viram `120` minutos.

## GitHub Pages

O workflow `.github/workflows/pages.yml` publica o projeto no GitHub Pages quando houver push na branch `main`.

No repositório GitHub, habilite:

```text
Settings > Pages > Build and deployment > Source: GitHub Actions
```

## Roadmap

- Baixar fontes para uso 100% local/offline desde o primeiro carregamento.
- Melhorar o layout mobile com navegação inferior.
- Adicionar revisão espaçada na Wiki.
- Adicionar metas por matéria.
- Exportar relatório semanal em Markdown.
- Criar migração versionada com `schemaVersion`.
- Aumentar a cobertura dos testes Playwright.
- Refinar a modularização com ES modules quando houver uma etapa de build ou suporte explícito.

## Histórico

Veja [CHANGELOG.md](CHANGELOG.md).

## Licença

MIT. Veja [LICENSE](LICENSE).
