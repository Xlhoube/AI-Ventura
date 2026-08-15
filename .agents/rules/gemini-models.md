# ?? Regras de Seleção e Atualização de Modelos Gemini

> **Aplica-se a qualquer alteração de modelos de IA no projeto.**

## ?? Regras de Configuração

1. **Evitar Modelos Experimentais/Preview ou Descontinuados em Produção:**
   - **NÃO** utilizar modelos antigos descontinuados/desativados (como a gama `gemini-2.0-*` ou `gemini-2.5-*` que dão erro 404).
   - Utilizar sempre os modelos da gama **Gemini 3** estáveis.

2. **Modelos Recomendados (Atualização 2026 - Gemini 3):**
   - **Padrão Principal / Inteligente:** `gemini-3.5-flash`
   - **Padrão Rápido / Económico:** `gemini-3.5-flash-lite`
   - **Modelo Avançado / Mais Recente:** `gemini-3.6-flash`

3. **Validação e Referência de Modelos:**
   - Consultar sempre o ficheiro de documentação local [models.txt](file:///c:/Users/PC_Suplente/Desktop/Projetos%20Antigravity/AI-Ventura/models.txt) ou o link estável oficial:
     https://ai.google.dev/gemini-api/docs/models?hl=pt-br#gemini-3-stable

4. **Procedimento de Teste:**
   - Qualquer alteração ao modelo de produção em `src/services/unifiedAi.ts` deve ser replicada no método de validação de chave API `testGeminiAPIKey` em `src/services/ai.ts` para garantir consistência.
