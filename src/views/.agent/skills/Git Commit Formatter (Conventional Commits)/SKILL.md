---
name: git-commit-formatter
description: Use this skill when the user asks to criar, rever ou melhorar mensagens de commit Git, garantindo o padrão Conventional Commits.
---

Git Commit Formatter Skill

Goal
Garantir que todas as mensagens de commit seguem o padrão Conventional Commits.

Formato
<type>[optional scope]: <description>

Allowed Types
- feat: nova funcionalidade
- fix: correção de bug
- docs: alterações apenas de documentação
- style: alterações de formatação, espaços, etc., sem alterar lógica
- refactor: mudança de código que não corrige bug nem adiciona feature
- perf: melhoria de performance
- test: adicionar ou corrigir testes
- chore: mudanças em build, tooling, configs, etc.

Instructions
1. Analisa o diff ou descrição do utilizador para determinar o type principal.
2. Identifica um scope curto se fizer sentido (ex.: auth, ui, api, game-loop).
3. Escreve uma description curta, em modo imperativo (ex.: "add login screen", não "added login screen").
4. Se houver breaking changes, adiciona um footer separado começando por "BREAKING CHANGE:" a explicar o que quebrou.

Examples
- feat(auth): add magic-link login
- fix(game-loop): prevent negative score on timeout
- docs: update README with deploy instructions
