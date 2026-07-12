---
name: webgame-performance-audit
description: Use this skill when the user asks to analisar performance, lentidão ou otimização de um jogo ou aplicação web no browser, incluindo métricas de carregamento e uso de CPU/JS.
---

Webgame Performance Audit Skill

Goal
Avaliar rapidamente a performance de uma página/jogo web e sugerir otimizações práticas.

Instructions
- Clarificar primeiro:
  - URL ou route local a auditar.
  - Plataforma alvo principal (desktop, mobile, ambos).

- Se existir Lighthouse ou script equivalente:
  - Tentar usar npx lighthouse <url> ou scripts definidos em package.json (ex.: "npm run lighthouse").
  - Guardar o resumo das métricas principais (LCP, CLS, TBT, tamanho total de JS/CSS).

- Usando o browser controlado pelo Antigravity:
  - Abrir a página/jogo no navegador.
  - Observar:
    - Tempo até o jogo ficar interativo.
    - Uso de CPU e memória na aba (se ferramentas estiverem disponíveis).
    - Tamanho e número de pedidos de rede iniciais.

- Análise & Recomendações:
  - Detetar problemas comuns:
    - Bundles JS muito grandes para a página inicial.
    - Imagens sem compressão ou sem lazy-loading.
    - Loops de jogo ou animações que correm fora de requestAnimationFrame.
  - Sugerir ações concretas:
    - Dividir código em chunks (code splitting).
    - Otimizar assets (spritesheets, compressão, formatos modernos).
    - Reduzir trabalho pesado no main thread dentro do game loop.

Constraints
- Não correr ferramentas que não estejam instaladas; em vez disso, explicar claramente o que é necessário instalar (ex.: Lighthouse CLI).
- Não alterar código automaticamente durante a auditoria; sugerir mudanças e só editar ficheiros quando o utilizador pedir.
