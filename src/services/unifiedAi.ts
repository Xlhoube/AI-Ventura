import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getAPIKeys } from "./ai"; // We will modify ai.ts to export this or move it here

export interface AIProviderConfig {
    systemInstruction?: string;
    jsonMode?: boolean;
    stream?: boolean;
}

export const executeUnifiedAI = async (
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
        
        if (config.stream) {
            const stream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
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
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: geminiConfig
            });
            return response.text || "";
        }
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
    
    throw new Error(`Unsupported provider: ${provider}`);
};
