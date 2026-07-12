# STATUS - Projeto Luna

**Ultima atualizacao:** 2026-07-04

## Limpeza Completa (2 rondas)

### Ronda 1 - Eliminado
- fix.py, patch.py, script.py, fix_db.sql, gen_vapid.py, check_sdk.py
- __pycache__/, .memory_backup_tmp/ (vazio), .agents.rar
- Luna/ (repositorio git aninhado - clone duplicado do projeto)
- memoria.md, memory.md da raiz -> consolidados em .agents/memory/

### Ronda 2 - Eliminado
- private_key.pem, public_key.pem, ssh-key.key, token.json do rastreio git
- frontend_dist/ do rastreio git (pasta de build, continua localmente)
- ag-kit-2026.5.31/ (instalador do framework, nao precisa no repo)
- frontend/src/assets/react.svg, vite.svg, hero.png (assets Vite nao usados)
- .agents/agent/, .agents/rules/, .agents/scripts/ (diretorios vazios)

### .gitignore melhorado
- token.json, ip.txt, luna.db, frontend_dist/, ag-kit-*/, memoria.md, memory.md, *.key, *.pem

### Commits
- 25f1ad4 - Ronda 1
- c348aa8 - Ronda 2 (push para main em github.com/Xlhoube/Assitente)

## Estado Atual do Projeto
- app.py (backend principal) - OK
- frontend/ (source React) - OK
- frontend_dist/ (build local para Caddy) - OK, fora do git
- android/ (projeto Android) - OK
- chroma_db/ - OK
- .agents/ (configuracao agente) - limpo
- Fix: resolvido o erro de estado que impedia carregar a aba de estado (schema mismatch).
- Fix: as notificações (lembretes) agora são guardadas na bd historico_conversas e aparecem no chat mesmo após recarregar.
