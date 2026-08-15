# ?? Regras de Seleção e Atualização de Modelos Gemini

> **Aplica-se a qualquer alteração de modelos de IA no projeto.**

## ?? Regras de Configuração

1. **Evitar Modelos Experimentais/Preview em Produção:**
   - **NÃO** utilizar modelos contendo `-preview` ou designações de ciclo experimental (ex: `gemini-2.5-flash`, `gemini-2.5-pro` caso novos utilizadores fiquem bloqueados com erro 404).
   - Utilizar sempre os modelos de **produção geral estável** recomendados oficialmente.

2. **Modelos Recomendados (Atualização 2026):**
   - **Padrão Principal / Rápido:** `gemini-2.0-flash`
   - **Padrão Alternativo / Económico:** `gemini-2.0-flash-lite`

3. **Validação e Referência de Modelos:**
   - Consultar sempre o ficheiro de documentação local [models.txt](file:///c:/Users/PC_Suplente/Desktop/Projetos%20Antigravity/AI-Ventura/models.txt) ou o link oficial:
     https://ai.google.dev/gemini-api/docs/models?hl=pt-pt

4. **Procedimento de Teste:**
   - Qualquer alteração ao modelo de produção em `src/services/unifiedAi.ts` deve ser replicada no método de validação de chave API `testGeminiAPIKey` em `src/services/ai.ts` para garantir consistência.
