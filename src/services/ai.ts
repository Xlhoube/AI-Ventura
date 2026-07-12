
















import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { executeUnifiedAI } from './unifiedAi';
import { getEnv } from '@/services/services';
import { Language } from '@/utils/constants';
import { useAppStore } from '@/store/useAppStore';

export const getAPIKeys = () => {
  const store = useAppStore.getState();
  const provider = store.activeProvider;
  const key = store.apiKeys[provider];
  
  if (!key) {
    throw new Error(`API_KEY_MISSING_${provider.toUpperCase()}`);
  }
  return { provider, key };
};

const getAIInstance = () => {
  const { provider, key } = getAPIKeys();
  if (provider === 'google') {
    return new GoogleGenAI({ apiKey: key });
  }
  return null; // For OpenAI and Anthropic we'll use direct fetch
};

// Helper para limpar e formatar erros da API
const formatAIError = (e: any): Error => {
  let msg = e.message || "Erro desconhecido.";

  if (typeof msg === 'string' && msg.includes('{')) {
    try {
      const match = msg.match(/\{[\s\S]*\}/); // Captura o objeto JSON
      if (match) {
        const json = JSON.parse(match[0]);
        if (json.error?.message) msg = json.error.message;
        else if (json.message) msg = json.message;
      }
    } catch { /* Ignora falhas no parse */ }
  }

  if (msg.includes("API key not valid")) return new Error("A Chave de API configurada é inválida.");
  if (msg.includes("API_KEY_MISSING")) return new Error("Chave de API não encontrada.");
  if (msg.includes("Failed to fetch")) return new Error("Erro de conexão. Verifique a internet.");
  if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("exhausted")) {
      return new Error("🚨 LIMITE DA API ATINGIDO: Atingiste o limite de uso da tua chave. Se usas um plano gratuito, aguarda uns minutos ou verifica o teu saldo.");
  }

  return new Error(msg);
};

// HELPER: Limpar JSON vindo da IA (remove ```json e ```)
const cleanAIJSON = (text: string) => {
  if (!text) return "";
  let cleaned = text.trim();
  // Remove blocos de código markdown se existirem
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
  }
  return cleaned.trim();
};

// FUNÇÃO ORIGINAL (MANTIDA PARA USO DE COMPATIBILIDADE SE NECESSÁRIO)
// AGORA A PRINCIPAL É A streamAIConversation
export const callAI = async (
  messages: any[],
  userPrompt: string,
  systemRole: string,
  mode: 'development' | 'ending' | 'definitive_ending',
  lang: Language = 'en'
) => {
  try {
    // // const ai = getAIInstance();
    const historyStr = messages.map(m => `${m.role === 'user' ? 'AUTOR' : 'EDITOR'}: ${m.content}`).join('\n\n');

    const instructions = {
      pt: {
        ending: "FINALIZAR CENA: Redige um desfecho literário elegante e conclusivo para esta sequência em PORTUGUÊS. Garante que o tom é profissional e encerra os fios narrativos pendentes. NÃO converses com o autor. Devolve JSON com 'narrative' (texto) e 'suggestions' (array vazio).",
        definitive: "FIM DEFINITIVO: Redige o capítulo final absoluto desta obra em PORTUGUÊS. Todos os conflitos principais devem ser resolvidos. O tom deve ser de encerramento total. Não deixes ganchos. NÃO digas 'aqui está o fim'. Devolve JSON com 'narrative' (texto final) e 'suggestions' (array vazio).",
        develop: "DESENVOLVER PROSA: Expande a ideia do Autor com prosa de alta qualidade em PORTUGUÊS (PT-PT). Foca na narrativa, diálogos e descrições. IMPORTANTE: Cada fala de diálogo deve começar num novo parágrafo com travessão (—). NÃO respondas a comandos. Devolve JSON com 'narrative' (texto literário em PORTUGUÊS) e 3 'suggestions' (OBRIGATORIAMENTE em PORTUGUÊS) curtas para o próximo passo da história."
      },
      en: {
        ending: "FINALIZE SCENE: Write an elegant and conclusive literary ending for this sequence in ENGLISH. Ensure the tone is professional and wraps up the pending narrative threads. NO meta-commentary. Return JSON with 'narrative' and empty 'suggestions'.",
        definitive: "DEFINITIVE END: Write the absolute final chapter of this work in ENGLISH. All major conflicts must be resolved. The tone should be one of total closure. NO chatting. Return JSON with 'narrative' and empty 'suggestions'.",
        develop: "DEVELOP PROSE: Expand the Author's idea with high-quality prose in ENGLISH. Focus on narrative, dialogue, and descriptions. IMPORTANT: Each dialogue line must start on a new paragraph with a long dash (—). DO NOT reply to user commands. Return JSON with 'narrative' (literary text in ENGLISH) and 3 editorial 'suggestions' (MUST BE IN ENGLISH) for the next step."
      },
      fr: {
        ending: "FINALISER LA SCÈNE : Rédigez une fin littéraire élégante et concluante pour cette séquence en FRANÇAIS. Assurez-vous que le ton est professionnel. PAS de discussion. Renvoyez un JSON avec 'narrative' et 'suggestions' (vide).",
        definitive: "FIN DÉFINITIVE : Rédigez le chapitre final absolu de cette œuvre en FRANÇAIS. Tous les conflits majeurs doivent être résolus. Le ton doit être celui d'une clôture totale. PAS de discussion. Renvoyez un JSON avec 'narrative' et 'suggestions' (vide).",
        develop: "DÉVELOPPER LA PROSE : Développez l'idée de l'Auteur avec une prose de haute qualité en FRANÇAIS. Concentrez-vous sur la narration, les dialogues et les descriptions. IMPORTANT : Chaque ligne de dialogue doit commencer par un nouveau paragraphe avec un tiret cadratin (—). NE PAS répondre aux commandes. Renvoyez un JSON avec 'narrative' (texte littéraire en FRANÇAIS) et 3 'suggestions' (OBLIGATOIREMENT en FRANÇAIS) pour la prochaine étape."
      }
    };

    const currentLangInstructions = instructions[lang] || instructions['en'];

    let instruction = "";
    if (mode === 'ending') {
      instruction = currentLangInstructions.ending;
    } else if (mode === 'definitive_ending') {
      instruction = currentLangInstructions.definitive;
    } else {
      instruction = currentLangInstructions.develop;
    }

    const fullPrompt = `LOG DA OBRA:\n${historyStr}\n\nINPUT DO AUTOR: ${userPrompt}\n\nDIRETRIZ EDITORIAL: ${instruction}`;

    const responseText = await executeUnifiedAI(fullPrompt, { systemInstruction: systemRole, jsonMode: true });

    try {
      const cleanText = cleanAIJSON(responseText);
      const start = cleanText.indexOf('{');
      const end = cleanText.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const jsonBody = cleanText.substring(start, end + 1);
        const parsed = JSON.parse(jsonBody);
        return {
          narrative: parsed.narrative || cleanText,
          suggestions: parsed.suggestions || []
        };
      }
    } catch (jsonErr) {
      console.warn("[callAI] Falha no parse JSON:", jsonErr);
    }

    return { narrative: responseText, suggestions: [] };
  } catch (e: any) {
    console.error("[callAI] Erro fatal:", e);
    throw formatAIError(e);
  }
};

// NOVA FUNÇÃO: Gerar Apenas Sugestões (Para Resume/Reload) - OTIMIZADA
export const generateSuggestions = async (
  messages: any[],
  lang: Language = 'en'
) => {
  try {
    // const ai = getAIInstance();

    // OTIMIZAÇÃO DE CONTEXTO: Janela Deslizante (Sliding Window)
    // Ler apenas as últimas 20 mensagens para poupar tokens e acelerar a resposta
    const RECENT_MSG_LIMIT = 20;
    const recentMessages = messages.slice(-RECENT_MSG_LIMIT);

    const historyStr = recentMessages.map(m => `${m.role === 'user' ? 'AUTOR' : 'EDITOR'}: ${m.content}`).join('\n\n');

    const instructions = {
      pt: "Com base neste excerto recente da história, devolve APENAS um array JSON contendo 3 sugestões curtas e criativas (strings) para a próxima ação do Autor, em Português.",
      en: "Based on this recent excerpt of the story, return ONLY a JSON array containing 3 short and creative suggestions (strings) for the Author's next action, in English.",
      fr: "Basé sur cet extrait récent de l'histoire, retournez UNIQUEMENT un tableau JSON contenant 3 suggestions courtes et créatives (chaînes) pour la prochaine action de l'Auteur, en Français."
    };

    const promptText = `EXCERTO RECENTE DA HISTÓRIA:\n${historyStr}\n\nTAREFA: ${instructions[lang] || instructions['en']}`;

    const responseText = await executeUnifiedAI(promptText, { jsonMode: true });

    // Parse Robustez
    const cleanText = cleanAIJSON(responseText);
    const start = cleanText.indexOf('[');
    const end = cleanText.lastIndexOf(']');

    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(cleanText.substring(start, end + 1));
      } catch (parseErr) {
        console.warn("JSON parse failed inside brackets, fallback empty");
        return [];
      }
    }

    // Tentativa final de parse direto se a string for limpa
    try {
      const directParse = JSON.parse(cleanText);
      if (Array.isArray(directParse)) return directParse;
    } catch (e) { }

    return [];

  } catch (e: any) {
    console.warn("[generateSuggestions] Falha leve:", e);
    return []; // Falha silenciosa para não bloquear a UI
  }
};

// NOVA FUNÇÃO: Gerar Prompt de Imagem baseado na narrativa
export const generateImagePrompt = async (narrative: string, genre: string = "Geral", lang: Language = 'en') => {
  try {
    // const ai = getAIInstance();

    const instructions = {
      pt: `Cria um prompt curto e visual para um gerador de imagem (como DALL-E) baseado neste excerto. O estilo deve ser "${genre}". Foca-te em atmosfera e visual. Retorna APENAS o prompt em inglês, SEM introduções ou formatação.`,
      en: `Create a short, visual prompt for an image generator (like DALL-E) based on this excerpt. The style should be "${genre}". Focus on atmosphere and visuals. Return ONLY the prompt in English, WITHOUT introductions or formatting.`,
      fr: `Créez um prompt court et visuel pour um générateur d'images (comme DALL-E) baseado neste excerto. O estilo deve ser "${genre}". Concentrez-vous sur l'atmosphère. Retornar UNIQUEMENT le prompt en anglais, SANS introduction ni formatage.`
    };

    const promptText = `${instructions[lang] || instructions['en']}\n\nNARRATIVA:\n${narrative.substring(0, 500)}`;

    const responseText = await executeUnifiedAI(promptText, {});
    let prompt = responseText?.trim() || "";
    prompt = prompt.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
    prompt = prompt.replace(/^(Here is|This is|A prompt).*:\s*/i, '');
    
    return prompt || "A cinematic scene representing a new chapter";
  } catch (e) {
    console.warn("[generateImagePrompt] Erro:", e);
    return "";
  }
};

// Placeholder para Integração de Imagem (pode ser expandido com API real)
export const requestImageGeneration = async (prompt: string): Promise<string> => {
  if (!prompt || prompt.trim().length < 5) return '';
  // Limitar o tamanho do prompt para garantir que a URL não excede os limites (URL segura até ~2000 chars)
  const safePrompt = prompt.substring(0, 400).trim();
  const encodedPrompt = encodeURIComponent(safePrompt);
  const seed = Math.floor(Math.random() * 99999);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=512&nologo=true&seed=${seed}&model=flux`;
};

// NOVA FUNÇÃO: Extrair Estado (Inventário e Relações) da Narrativa
export const extractStoryState = async (messages: any[], lang: Language = 'en') => {
  try {
    const historyStr = messages.slice(-5).map(m => `${m.role === 'user' ? 'AUTOR' : 'EDITOR'}: ${m.content}`).join('\n\n');
    const prompt = `Based on the recent story events, extract the current inventory (key items, weapons, artifacts held by the characters) and the current relationship levels (0 to 100) between the main characters.
    
    Return EXACTLY a JSON object with this format, and nothing else:
    {
      "inventory": ["Item 1", "Item 2"],
      "relationships": { "Character A": 80, "Character B": 50 }
    }
    
    If there are no items, return an empty array for inventory. If there are no clear relationships, return an empty object.
    RECENT STORY:
    ${historyStr}`;

    const responseText = await executeUnifiedAI(prompt, {
      response_format: { type: "json_object" }
    });

    let cleanJson = responseText?.trim() || "{}";
    cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(cleanJson);
    return {
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      relationships: typeof parsed.relationships === 'object' ? parsed.relationships : {}
    };
  } catch (e) {
    console.warn("[extractStoryState] Erro ao extrair estado:", e);
    return { inventory: [], relationships: {} };
  }
};

// NOVA FUNÇÃO OTIMIZADA PARA STREAMING
export const streamAIConversation = async (
  messages: any[],
  userPrompt: string,
  systemRole: string,
  lang: Language = 'en'
) => {
  try {
    // const ai = getAIInstance();
    const historyStr = messages.map(m => `${m.role === 'user' ? 'AUTOR' : 'EDITOR'}: ${m.content}`).join('\n\n');

    // INSTRUÇÕES REFORÇADAS PARA IGNORAR COMANDOS E EVITAR META-COMENTÁRIOS E LISTAS MARKDOWN NAS SUGESTOES
    const instructions = {
      pt: "DESENVOLVER PROSA: Escreve a narrativa em PORTUGUÊS (PT-PT). REGRAS DE OURO: 1. NUNCA respondas a comentários do autor (ex: 'ok', 'desculpa'). 2. Se o input for 'continua' ou uma instrução, apenas escreve a história e ignora o texto da ordem na narrativa. 3. O teu output deve ser 100% narrativa literária. 4. No final, adiciona EXATAMENTE '---SUGGESTIONS---' seguido de 3 opções separadas por ' | ' sem qualquer markdown, sem números e sem listas (exemplo: ---SUGGESTIONS---Opção UM | Opção DOIS | Opção TRES).",
      en: "DEVELOP PROSE: Write the narrative in ENGLISH. GOLDEN RULES: 1. NEVER reply to user comments (e.g., 'ok', 'sorry'). 2. If the input is 'continue' or a command, just write the story and ignore the command text in the narrative. 3. Your output must be 100% literary narrative. 4. At the end, add EXACTLY '---SUGGESTIONS---' followed by 3 options separated by ' | ' without any markdown, numbers, or lists (example: ---SUGGESTIONS---Option ONE | Option TWO | Option THREE).",
      fr: "DÉVELOPPER LA PROSE : Écrivez la narration en FRANÇAIS. RÈGLES D'OR : 1. NE JAMAIS répondre aux commentaires de l'auteur (ex : 'ok', 'désolé'). 2. Si l'entrée est une commande, écrivez juste l'histoire et ignorez le texte de commande. 3. Votre sortie doit être 100% narrative. 4. À la fin, ajoutez EXACTEMENT '---SUGGESTIONS---' suivi de 3 options séparées par ' | ' sans aucun markdown, numéros ou listes (exemple: ---SUGGESTIONS---Option UNE | Option DEUX | Option TROIS)."
    };

    const instruction = instructions[lang] || instructions['en'];
    const fullPrompt = `LOG DA OBRA:\n${historyStr}\n\nINPUT DO AUTOR (Pode ser texto da história ou uma instrução de comando): ${userPrompt}\n\nDIRETRIZ EDITORIAL: ${instruction}`;

    const stream = await executeUnifiedAI(fullPrompt, { systemInstruction: systemRole, stream: true });
    return stream;

  } catch (e: any) {
    console.error("[streamAIConversation] Erro crítico na stream:", e);
    throw formatAIError(e);
  }
};

export const polishManuscript = async (messages: any[], lang: string, currentTitle?: string) => {
  // Truncar o histórico para evitar exceder limites de tokens (~8000 chars ~ 2000 tokens)
  const MAX_CHARS = 8000;
  const allAIContent = messages.filter(m => m.role === 'ai').map(m => m.content).join('\n\n');
  const historyStr = allAIContent.length > MAX_CHARS
    ? '...[início da obra omitido para otimização]...\n\n' + allAIContent.slice(-MAX_CHARS)
    : allAIContent;

  const promptLangMap: Record<string, string> = {
    pt: 'PORTUGUÊS (PT-PT)',
    fr: 'FRANÇAIS',
    en: 'ENGLISH'
  };

  const targetLang = promptLangMap[lang] || 'ENGLISH';

  const prompts: Record<string, string> = {
    pt: `Atua como um editor literário sénior. Transforma o diálogo de co-escrita abaixo numa OBRA LITERÁRIA FINAL em ${targetLang}.
      CRITÉRIOS OBRIGATÓRIOS:
      1. CRIA EXATAMENTE 3 OPÇÕES DE TÍTULOS CRIATIVOS e DISTINTOS para a obra num array de strings.
      2. Coesão total e fluidez de parágrafos.
      3. FORMATAÇÃO DE DIÁLOGO: Cada mudança de interlocutor exige um NOVO PARÁGRAFO.
      4. TRAVESSÕES: Usa sempre travessão longo (—) no início da fala e para separar incisos do narrador. Nunca uses hífens (-).
      5. Cria uma SINOPSE EDITORIAL envolvente.
      
      Retorna APENAS JSON válido com "titleOptions" (Array de 3 strings), "synopsis" e "content". Não devolvas markdown.`,

    en: `Act as a senior literary editor. Transform the co-writing dialogue below into a FINAL LITERARY WORK in ${targetLang}.
      MANDATORY CRITERIA:
      1. CREATE EXACTLY 3 CREATIVE and DISTINCT TITLE OPTIONS for the work in a string array.
      2. Total cohesion and paragraph fluidity.
      3. DIALOGUE FORMATTING: Each speaker change requires a NEW PARAGRAPH.
      4. DASHES: Always use a long dash (—) at the start of speech and to separate narrator asides. Never use hyphens (-).
      5. Create an engaging EDITORIAL SYNOPSIS.
      
      Return ONLY valid JSON with "titleOptions" (Array of 3 strings), "synopsis" and "content". No markdown.`,

    fr: `Agissez en tant qu'éditeur littéraire senior. Transformez le dialogue de co-écriture ci-dessous en un MANUSCRIT LITTÉRAIRE FINAL en ${targetLang}.
      CRITÈRES OBLIGATOIRES :
      1. CRÉEZ EXACTEMENT 3 OPTIONS DE TITRES CRÉATIFS et DISTINCTS pour l'œuvre dans un tableau de chaînes.
      2. Cohésion totale et fluidité des paragraphes.
      3. FORMATAGE DU DIALOGUE : Chaque changement d'interlocuteur nécessite un NOUVEAU PARAGRAPHE.
      4. TIRETS : Utilisez toujours un tiret cadratin (—) au début du discours et pour séparer les incises du narrateur. N'utilisez jamais de traits d'union (-).
      5. Création d'un SYNOPSIS ÉDITORIAL engageant.
      
      Retournez UNIQUEMENT un JSON valide avec "titleOptions" (Tableau de 3 chaînes), "synopsis" et "content". Pas de markdown.`
  };

  const tryPolish = async () => {
    const instruction = prompts[lang] || prompts['en'];
    const fullPrompt = `${instruction}\n\nTEXTO BRUTO:\n${historyStr}`;

    const responseText = await executeUnifiedAI(fullPrompt, { jsonMode: true });
    const cleanText = cleanAIJSON(responseText);

    const start = cleanText.indexOf('{');
    const end = cleanText.lastIndexOf('}');

    if (start !== -1 && end !== -1) {
      const result = JSON.parse(cleanText.substring(start, end + 1));
      if (!result.titleOptions || !Array.isArray(result.titleOptions) || result.titleOptions.length === 0) {
        result.titleOptions = [
          currentTitle || "Obra Sem Título",
          `A Crónica de ${currentTitle || "História"}`,
          `${currentTitle || "Conto"} - Edição Final`
        ];
      }
      return result;
    }
    throw new Error("JSON_MISSING");
  };

  try {
    return await tryPolish();
  } catch (e1) {
    console.warn("[polishManuscript] 1ª tentativa falhou, aguardando 5s e repetindo...", e1);
    try {
      // Aguardar 5 segundos antes de tentar de novo (evita rate limit)
      await new Promise(r => setTimeout(r, 5000));
      return await tryPolish();
    } catch (e2) {
      console.error("[polishManuscript] Erro após 2 tentativas:", e2);
      const safeTitle = currentTitle || "Obra";
      const cleanTitle = safeTitle.replace(/\.\.\.$/, '');
      const fallbackSynopsis = {
        pt: `Esta obra nasceu de uma escrita colaborativa entre autor e Editor IA. Uma história única que aguarda a tua próxima leitura.`,
        en: `This work was born from a collaborative writing between author and AI Editor. A unique story awaiting your next read.`,
        fr: `Cette œuvre est née d'une écriture collaborative entre l'auteur et l'Éditeur IA. Une histoire unique qui attend votre prochaine lecture.`
      };
      return {
        titleOptions: [
          cleanTitle,
          `As Crónicas de ${cleanTitle}`,
          `O Conto de ${cleanTitle}`
        ],
        synopsis: fallbackSynopsis[lang as 'pt' | 'en' | 'fr'] || fallbackSynopsis['en'],
        content: messages.map(m => m.content).join('\n\n')
      };
    }
  }
};

export const translateManuscript = async (text: string, targetLang: Language): Promise<string> => {
  if (!text || !targetLang) return text;
  const langNames: Record<string, string> = {
    pt: 'Portuguese (PT-PT)',
    en: 'English',
    fr: 'French'
  };
  try {
    const prompt = `Translate the following literary text to ${langNames[targetLang] || targetLang}. Preserve the style, tone, and formatting exactly. Return ONLY the translated text, nothing else:

${text.substring(0, 6000)}`;
    const result = await executeUnifiedAI(prompt, {});
    return result?.trim() || text;
  } catch (e) {
    console.warn('[translateManuscript] Failed:', e);
    return text;
  }
};

export const generatePremises = async (lang: string, genre?: string) => {
  try {
    // const ai = getAIInstance();
    const seeds = [
      "um segredo antigo que muda tudo",
      "uma traição inesperada no primeiro ato",
      "um cenário onde a tecnologia falhou",
      "uma perspectiva de um narrador não-confiável",
      "um dilema moral impossível",
      "uma descoberta científica proibida",
      "um encontro com o sobrenatural num local mundano",
      "uma viagem sem regresso",
      "a quebra de uma lei fundamental da física",
      "um romance em tempos de guerra"
    ];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)];
    const entropyCode = Math.random().toString(36).substring(7);

    const prompts: Record<string, string> = {
      pt: `Gera 3 conceitos de obras literárias (ideias base para livros) ALTAMENTE ORIGINAIS e ÚNICAS (foge de clichés comuns) ${genre ? `do género literário "${genre}"` : "de géneros variados"} em PORTUGUÊS.
      Para garantir variedade, foca-te subtilmente neste elemento narrativo: "${randomSeed}".
      Devolve apenas um array JSON de strings com os resumos das obras.`,

      en: `Generate 3 HIGHLY ORIGINAL and UNIQUE literary work concepts (book premises) (avoiding common clichés) ${genre ? `of the literary genre "${genre}"` : "of varied genres"} in ENGLISH.
      To ensure variety, focus subtly on this narrative element: "${randomSeed}".
      Return only a JSON array of strings with the summaries of the works.`,

      fr: `Générez 3 concepts d'œuvres littéraires (idées de base pour des livres) HAUTEMENT ORIGINAUX et UNIQUES (évitez les clichés courants) ${genre ? `du genre littéraire "${genre}"` : "de genres variés"} en FRANÇAIS.
      Pour assurer la variété, concentrez-vous subtilement sur cet élément narratif : "${randomSeed}".
      Renvoyez uniquement un tableau JSON de chaînes avec les résumés des œuvres.`
    };

    const promptText = `${prompts[lang] || prompts['en']}\nCódigo de entropia: ${entropyCode}.`;

    const responseText = await executeUnifiedAI(promptText);

    try {
      // Parse Robustez
      const cleanText = cleanAIJSON(responseText);
      const start = cleanText.indexOf('[');
      const end = cleanText.lastIndexOf(']');
      let parsed = [];
      if (start !== -1 && end !== -1) {
        parsed = JSON.parse(cleanText.substring(start, end + 1));
      } else {
        parsed = JSON.parse(cleanText);
      }
      
      const array = Array.isArray(parsed) ? parsed : [parsed];
      // Garante que são strings mesmo que a IA devolva objetos (ex: [{"premise": "..."}])
      return array.map((item: any) => {
         if (typeof item === 'string') return item;
         if (typeof item === 'object' && item !== null) {
            // Se for objeto, tenta obter o primeiro valor (ex: premise)
            const values = Object.values(item);
            if (values.length > 0 && typeof values[0] === 'string') {
               return values[0];
            }
            return JSON.stringify(item);
         }
         return String(item);
      });
    } catch (parseErr) {
      console.warn("[generatePremises] Fallback parse failed, returning raw text as one premise", parseErr);
      return [responseText.trim()];
    }
  } catch (e) {
    console.error("[generatePremises] Erro:", e);
    throw formatAIError(e);
  }
};



// NOVA FUNÇÃO: Gerar Título Criativo para a Obra
export const generateStoryTitle = async (config: any, lang: Language = 'pt') => {
  try {
    // const ai = getAIInstance();

    const prompts: Record<string, string> = {
      pt: `Com base nesta ideia de história, gera um título literário ÚNICO, CURTO e CRIATIVO (máximo 6 palavras) ESTRITAMENTE EM PORTUGUÊS.
      Género: ${config.genre || 'Vários'}
      Ideia: ${config.idea}
      Personagens: ${config.characters || 'Várias'}
      
      Devolve APENAS o título em PORTUGUÊS, sem aspas ou explicações.`,

      en: `Based on this story idea, generate a UNIQUE, SHORT, and CREATIVE literary title (maximum 6 words) STRICTLY IN ENGLISH.
      Genre: ${config.genre || 'Various'}
      Idea: ${config.idea}
      Characters: ${config.characters || 'Various'}
      
      Return ONLY the title in ENGLISH, without quotes or explanations.`,

      fr: `Sur la base de cette idée d'histoire, générez un titre littéraire UNIQUE, COURT et CRÉATIF (maximum 6 mots) STRICTEMENT EN FRANÇAIS.
      Genre : ${config.genre || 'Divers'}
      Idée : ${config.idea}
      Personnages : ${config.characters || 'Divers'}
      
      Renvoyez UNIQUEMENT le titre en FRANÇAIS, sans guillemets ni explications.`
    };

    const promptText = prompts[lang] || prompts['pt'];

    const responseText = await executeUnifiedAI(promptText, {});
    const title = responseText || "";
    return title.trim().replace(/^"(.*)"$/, '$1'); // Remove aspas se existirem
  } catch (e) {
    console.warn("[generateStoryTitle] Falha:", e);
    // Fallback para os 30 caracteres iniciais se a IA falhar
    return config.idea.substring(0, 30) + "...";
  }
};

/**
 * Valida uma chave de API do Gemini em tempo real fazendo um pedido ultra leve.
 */
export const testGeminiAPIKey = async (apiKey: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Olá! Isto é um teste rápido de conexão.',
      config: {
        maxOutputTokens: 5
      }
    });
    return Boolean(response && response.text);
  } catch (e) {
    console.warn("[testGeminiAPIKey] Falha na validação da chave API:", e);
    return false;
  }
};

export const generateCharacters = async (config: any, lang: string = 'pt') => {
  try {
    const prompts: Record<string, string> = {
      pt: `Baseado nesta premissa de história, gera 3 personagens interessantes.\nGénero: ${config.genre || 'Desconhecido'}\nIdeia: ${config.idea}\n\nDevolve APENAS um array JSON de objetos com este formato:\n[{"name": "Nome", "role": "Protagonist | Antagonist | Sidekick"}]`,
      en: `Based on this story premise, generate 3 interesting characters.\nGenre: ${config.genre || 'Unknown'}\nIdea: ${config.idea}\n\nReturn ONLY a JSON array of objects with this format:\n[{"name": "Name", "role": "Protagonist | Antagonist | Sidekick"}]`,
      fr: `Sur la base de cette prémisse d'histoire, générez 3 personnages intéressants.\nGenre: ${config.genre || 'Inconnu'}\nIdée: ${config.idea}\n\nRenvoyez UNIQUEMENT un tableau JSON d'objets avec ce format:\n[{"name": "Nom", "role": "Protagonist | Antagonist | Sidekick"}]`
    };

    const promptText = prompts[lang] || prompts['pt'];

    const responseText = await executeUnifiedAI(promptText);
    
    try {
      let cleanText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const start = cleanText.indexOf('[');
      const end = cleanText.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        cleanText = cleanText.substring(start, end + 1);
      }
      return JSON.parse(cleanText);
    } catch (parseErr) {
      console.warn("[generateCharacters] JSON parse failed", parseErr);
      return [];
    }
  } catch (e) {
    console.error("[generateCharacters] Erro:", e);
    return [];
  }
};