---
name: react-minigame-scaffold
description: Use this skill when the user asks to criar um novo mini-jogo em React/TypeScript ou uma nova cena de jogo em browser, incluindo componentes, hooks e estilos base.
---

React Mini-Game Scaffold Skill

Goal
Criar a estrutura inicial de um mini-jogo em React/TypeScript, pronta para ser ligada ao resto da aplicação.

Instructions
- Antes de criar ficheiros:
  - Pergunta o nome do mini-jogo (ex.: "Penalty Shootout", "Miner Tycoon").
  - Pergunta se deve ser uma página/route nova ou um componente embutido.
  - Pergunta se deve usar o sistema de estilos já existente (CSS modules, Tailwind, SCSS, etc.).

- Estrutura recomendada (ajusta ao padrão do projeto):
  - Criar uma pasta em src/games/<slug-do-jogo>/.
  - Criar pelo menos:
    - Game.tsx (componente principal do jogo).
    - useGameLogic.ts (hook com estado, timers, pontuação, etc.).
    - styles.(css|module.css|scss) com classes básicas para layout.

- No Game.tsx:
  - Exportar um componente React com:
    - Estado principal vindo de useGameLogic.
    - Callbacks claros para input do jogador (cliques, teclas, toques).
    - Área para HUD (pontuação, tempo, nível).

- Em useGameLogic.ts:
  - Definir tipos para o GameState.
  - Implementar lógica mínima:
    - estado inicial,
    - atualização de score,
    - controlo de tempo de jogo (se aplicável),
    - reset do jogo.

- Integração:
  - Se for uma route nova, adicionar a route ao router do projeto.
  - Se for um componente, explicar ao utilizador onde e como o pode importar.

Constraints
- Não adicionar novas bibliotecas sem perguntar primeiro ao utilizador.
- Respeitar o estilo e convenções já existentes no projeto (linting, naming, estrutura de pastas).
- Gerar código idiomático em TypeScript sempre que o projeto usar TS.
