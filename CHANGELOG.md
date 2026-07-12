# Registo de Alterações (Changelog) - AI Ventura

## [0.0.48] - 2026-02-28
### Corrigido
- Restaurada a geração inicial das Opções e da Introdução Narrativa assim que uma nova Obra é iniciada.
- Adicionada mensagem de erro detalhada aos alertas de "Ligação Interrompida" para facilitar diagnóstico.

## [0.0.47] - 2026-02-28
### Corrigido
- Refatoração total do fluxo de Autenticação inicial para eliminar o piscar da página (alternância rápida entre Landing Page e Dashboard) ao recarregar a aplicação.
- Mudança obrigatória do modelo da IA de `gemini-1.5-flash` para `gemini-2.5-flash` de modo a colmatar o erro critíco imposto por depreciação súbita no SDK "@google/genai" ("MODEL NOT FOUND FOR API VERSION").
- Sincronização e unificação rigorosa do versionamento em todo o projeto.
- O botão "Gerar Sugestões" da Configuração Inicial agora apresenta melhor feedback de carregamento alertas de erro imediatos.
- Re-escrita do modelo de avaliação de sinopse para o PDF de form a prevenir o abandono súbito da sinopse acompanhado da mensagem "Erro de Conexão".

## [0.0.46] - 2026-02-27
### Adicionado
- **Geração Automática de Imagens em Novos Capítulos**: O sistema reconhece palavras relacionadas a "capítulo" sendo digitadas pelo utilizador e gera uma nova ilustração visual instantânea pós-avaliação do modelo IA.

## [0.0.45] - 2026-02-25
### Corrigido
- Erro "Connection Interrupted" causado por persistência de modelos depreciados nas chamadas de IA.
- Otimização das rotas de tradução para maior resiliência.

## [0.0.44] - 2026-02-25
### Adicionado
- **Árvore Narrativa (Branching)**: Estrutura de mensagens com IDs únicos para suporte a ramificações.
- **Geração de Imagens**: Ilustrações automáticas baseadas no contexto e género.
- **Narrador AI (TTS)**: Suporte para PT-PT, ENG e FR.
- **Sidebars**: Inventário e Relações de personagens.
- **Modo Zen**: Interface minimalista para escrita focada.
- **Sistema de Inventário e Personagens**: Painel lateral para gestão de itens e relações com NPCs.
- **Refinamentos UI/UX**:
    - Implementação de Glassmorphism.
    - Animações suaves de escrita e efeitos de "magia AI".
    - Introdução do Modo Zen.

---

### [0.0.43] - Versão Anterior
- Finalização do botão "Voltar ao Lobby" no Dashboard.
- Melhorias na estabilidade geral e build.
- Substituição do ícone de lixo pelo ícone 'X' no modal de seleção de modo.
