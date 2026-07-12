const fs = require('fs');
const path = require('path');

const aiPath = path.join(__dirname, 'src', 'services', 'ai.ts');
let aiContent = fs.readFileSync(aiPath, 'utf8');

aiContent = aiContent.replace(`import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";`, `import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { executeUnifiedAI } from './unifiedAi';`);

aiContent = aiContent.replace(`const ai = getAIInstance();`, `// const ai = getAIInstance();`);
aiContent = aiContent.replaceAll(`const ai = getAIInstance();`, `// const ai = getAIInstance();`);

// callAI
aiContent = aiContent.replace(/const response = await ai\.models\.generateContent\(\{[\s\S]*?\}\);/m, 
`const responseText = await executeUnifiedAI(fullPrompt, { systemInstruction: systemRole, jsonMode: true });
    const response = { text: responseText };`);

// generateSuggestions
aiContent = aiContent.replace(/const response = await ai\.models\.generateContent\(\{[\s\S]*?\}\);/m, 
`const responseText = await executeUnifiedAI(promptText, { jsonMode: true });
    const response = { text: responseText };`);

// generateImagePrompt
aiContent = aiContent.replace(/const response = await ai\.models\.generateContent\(\{[\s\S]*?\}\);/m, 
`const responseText = await executeUnifiedAI(promptText, {});
    const response = { text: responseText };`);

// streamAIConversation
aiContent = aiContent.replace(/const stream = await ai\.models\.generateContentStream\(\{[\s\S]*?\}\);[\s\S]*?return textStream\(\);/m, 
`const stream = await executeUnifiedAI(fullPrompt, { systemInstruction: systemRole, stream: true });
    return stream;`);

// polishManuscript
aiContent = aiContent.replace(/const response = await ai\.models\.generateContent\(\{[\s\S]*?\}\);/m, 
`const responseText = await executeUnifiedAI(fullPrompt, { jsonMode: true });
    const response = { text: responseText };`);

// generatePremises
aiContent = aiContent.replace(/const response = await ai\.models\.generateContent\(\{[\s\S]*?\}\);/m, 
`const responseText = await executeUnifiedAI(promptText, { jsonMode: true });
    const response = { text: responseText };`);

// translateManuscript
aiContent = aiContent.replace(/const response = await ai\.models\.generateContent\(\{[\s\S]*?\}\);/m, 
`const responseText = await executeUnifiedAI(prompt, {});
    const response = { text: responseText };`);

// generateStoryTitle
aiContent = aiContent.replace(/const response = await ai\.models\.generateContent\(\{[\s\S]*?\}\);/m, 
`const responseText = await executeUnifiedAI(promptText, {});
    const response = { text: responseText };`);

fs.writeFileSync(aiPath, aiContent);
console.log("Refactoring complete");
