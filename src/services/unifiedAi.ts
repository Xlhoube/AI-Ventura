import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getAPIKeys } from "./ai"; // We will modify ai.ts to export this or move it here
import { useAppStore, AIProvider } from '@/store/useAppStore';

export interface AIProviderConfig {
    systemInstruction?: string;
    jsonMode?: boolean;
    stream?: boolean;
}

const _executeUnifiedAIBase = async (
    prompt: string,
    config: AIProviderConfig = {}
) => {
    const { provider, key } = getAPIKeys();
    
    if (provider === 'google') {
        const ai = new GoogleGenAI({ apiKey: key });
        const geminiConfig: any = {};
        if (config.systemInstruction) geminiConfig.systemInstruction = config.systemInstruction;
        if (config.jsonMode) {
            geminiConfig.responseMimeType = "application/json";
            geminiConfig.responseSchema = { type: Type.OBJECT };
        }
        
        const googleModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
        let lastError = null;

        for (const model of googleModels) {
            try {
                if (config.stream) {
                    const stream = await ai.models.generateContentStream({
                        model,
                        contents: prompt,
                        config: geminiConfig
                    });
                    async function* textStream() {
                        for await (const chunk of stream) {
                            yield chunk.text || "";
                        }
                    }
                    return textStream();
                } else {
                    const response = await ai.models.generateContent({
                        model,
                        contents: prompt,
                        config: geminiConfig
                    });
                    return response.text || "";
                }
            } catch (err: any) {
                lastError = err;
                console.warn(`[UnifiedAI - Google] Modelo ${model} falhou, a tentar próximo:`, err.message);
                continue;
            }
        }
        if (lastError) throw lastError;
    }


    
    if (provider === 'openai') {
        const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
        const messages: any[] = [];
        if (config.systemInstruction) {
            messages.push({ role: 'system', content: config.systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });
        
        if (config.stream) {
            const stream = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages,
                stream: true,
                response_format: config.jsonMode ? { type: "json_object" } : undefined
            });
            async function* textStream() {
                for await (const chunk of stream) {
                    yield chunk.choices[0]?.delta?.content || "";
                }
            }
            return textStream();
        } else {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages,
                response_format: config.jsonMode ? { type: "json_object" } : undefined
            });
            return response.choices[0]?.message?.content || "";
        }
    }
    
    if (provider === 'anthropic') {
        const anthropic = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
        
        // Detetar se é uma chamada de manuscrito (prompt longo) para ajustar os tokens
        const isLargeTask = prompt.length > 3000;
        const maxTokens = isLargeTask ? 8000 : 4000;
        
        if (config.stream) {
            const stream = await anthropic.messages.create({
                model: 'claude-sonnet-4-5',
                system: config.systemInstruction,
                max_tokens: maxTokens,
                messages: [{ role: 'user', content: prompt }],
                stream: true
            });
            async function* textStream() {
                for await (const chunk of stream) {
                    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                        yield chunk.delta.text;
                    }
                }
            }
            return textStream();
        } else {
            let finalPrompt = prompt;
            if (config.jsonMode) {
                finalPrompt += "\n\nProvide the output purely in JSON format. Start with { and end with }.";
            }
            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-5',
                system: config.systemInstruction,
                max_tokens: maxTokens,
                messages: [{ role: 'user', content: finalPrompt }],
            });
            return (response.content[0] as any).text || "";
        }
    }
    
    // Groq e Mistral utilizam a API standard da OpenAI, permitindo reaproveitar a lógica
    if (provider === 'groq' || provider === 'mistral') {
        const baseURL = provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.mistral.ai/v1';
        
        // Modelos com lista de fallback no Groq caso a conta não tenha acesso a um modelo específico
        const groqCandidates = ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
        const mistralCandidates = ['open-mistral-nemo', 'mistral-small-latest'];
        const candidateModels = provider === 'groq' ? groqCandidates : mistralCandidates;

        const openai = new OpenAI({ apiKey: key, baseURL, dangerouslyAllowBrowser: true });
        const messages: any[] = [];
        if (config.systemInstruction) {
            messages.push({ role: 'system', content: config.systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });
        
        let lastError = null;
        for (const model of candidateModels) {
            try {
                if (config.stream) {
                    const stream = await openai.chat.completions.create({
                        model,
                        messages,
                        stream: true,
                        response_format: config.jsonMode ? { type: "json_object" } : undefined
                    });
                    async function* textStream() {
                        for await (const chunk of stream) {
                            yield chunk.choices[0]?.delta?.content || "";
                        }
                    }
                    return textStream();
                } else {
                    const response = await openai.chat.completions.create({
                        model,
                        messages,
                        response_format: config.jsonMode ? { type: "json_object" } : undefined
                    });
                    return response.choices[0]?.message?.content || "";
                }
            } catch (err: any) {
                lastError = err;
                console.warn(`[UnifiedAI - ${provider}] Modelo ${model} falhou, a tentar próximo modelo:`, err.message);
                // Se o erro for 404 (modelo não existe / sem acesso), continua para o próximo candidato
                if (err?.status === 404 || err?.message?.includes('404') || err?.message?.includes('model')) {
                    continue;
                }
                throw err;
            }
        }
        if (lastError) throw lastError;
    }

    
    throw new Error(`Unsupported provider: ${provider}`);
};

export const executeUnifiedAI = async (
    prompt: string,
    config: AIProviderConfig = {},
    attemptedProviders: AIProvider[] = []
): Promise<any> => {
    try {
        return await _executeUnifiedAIBase(prompt, config);
    } catch (e: any) {
        const store = useAppStore.getState();
        const currentProvider = store.activeProvider;
        attemptedProviders.push(currentProvider);
        
        const availableProviders = ['google', 'openai', 'anthropic', 'groq', 'mistral'] as AIProvider[];
        let nextProvider: AIProvider | null = null;
        for (const p of availableProviders) {
            if (!attemptedProviders.includes(p) && store.apiKeys[p] && store.apiKeysStatus[p] !== 'exceeded') {
                nextProvider = p;
                break;
            }
        }
        
        if (nextProvider) {
            console.warn(`[AI Fallback] ${currentProvider} failed. Trying ${nextProvider}...`, e);
            store.setActiveProvider(nextProvider);
            window.dispatchEvent(new CustomEvent('ai_fallback_triggered', { 
                detail: { from: currentProvider, to: nextProvider } 
            }));
            return executeUnifiedAI(prompt, config, attemptedProviders);
        } else {
            throw e;
        }
    }
};
