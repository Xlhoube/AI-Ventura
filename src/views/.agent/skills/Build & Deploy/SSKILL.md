---
name: webgame-build-deploy
description: Use this skill when the user asks to fazer build e deploy do jogo ou aplicação web (staging ou produção), incluindo execução de scripts de build e comandos de deploy (Netlify, Vercel ou hosting estático).
---

Webgame Build & Deploy Skill

Goal
Executar um fluxo padrão de build e, opcionalmente, deploy do projeto web, com passos claros e reporte de erros.

Instructions
- Clarificar primeiro:
  - Se o alvo é "staging" ou "produção".
  - Qual o provedor de hosting (Netlify, Vercel, GitHub Pages, outro).
  - Se há scripts específicos em package.json (ex.: "build:staging", "deploy").

- Detetar o package manager:
  - Se existir yarn.lock, usar yarn.
  - Se existir pnpm-lock.yaml, usar pnpm.
  - Caso contrário, usar npm.

- Build:
  - Correr o script de build apropriado via run_command:
    - npm run build, yarn build ou pnpm build, salvo indicação diferente no package.json.
  - Em caso de erro, mostrar o resumo das mensagens de erro e sugerir correções.

- Deploy (exemplos genéricos, adaptar ao projeto):
  - Netlify:
    - Se existir netlify.toml ou comandos definidos, usar o CLI (netlify deploy ...) quando disponível.
  - Vercel:
    - Se existir vercel.json ou configs, usar o CLI (vercel --prod ou vercel) quando disponível.
  - Hosting estático:
    - Explicar ao utilizador como subir a pasta de build (ex.: dist/ ou build/) para o serviço escolhido (S3, FTP, etc.).

- Relatório:
  - No final, apresentar um resumo em Markdown com:
    - Comandos executados.
    - Erros encontrados (se houver).
    - URL de pré-visualização ou produção se o CLI devolver links.

Constraints
- Nunca expor tokens ou segredos do ambiente nos logs apresentados ao utilizador.
- Pedir confirmação explícita antes de fazer deploy em produção.
- Se o CLI ou provider não estiver configurado, não inventar comandos; explicar claramente o que falta configurar.
