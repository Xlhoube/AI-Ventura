const fs = require('fs');
const path = require('path');

const aiPath = path.join(__dirname, 'src', 'services', 'ai.ts');
let aiContent = fs.readFileSync(aiPath, 'utf8');

// Fix duplicate responseText declarations
aiContent = aiContent.replace(/const responseText = await executeUnifiedAI\(([^)]+)\);\s*const response = { text: responseText };\s*const responseText = response\.text \|\| '';/g, 
`const responseText = await executeUnifiedAI($1);`);

// For the translation one:
aiContent = aiContent.replace(/const responseText = await executeUnifiedAI\(prompt, \{\}\);\s*const response = { text: responseText };\s*return response\.text \|\| text;/g, 
`const responseText = await executeUnifiedAI(prompt, {});
    return responseText || text;`);

// For generateStoryTitle
aiContent = aiContent.replace(/const responseText = await executeUnifiedAI\(promptText, \{\}\);\s*const response = { text: responseText };\s*const title = response\.text \|\| "";/g, 
`const responseText = await executeUnifiedAI(promptText, {});
    const title = responseText || "";`);

// For generateImagePrompt
aiContent = aiContent.replace(/const responseText = await executeUnifiedAI\(promptText, \{\}\);\s*const response = { text: responseText };\s*return response\.text\?\.trim\(\) \|\| "";/g, 
`const responseText = await executeUnifiedAI(promptText, {});
    return responseText?.trim() || "";`);

// Fix AppUser assignment in AppRoutes
const appRoutesPath = path.join(__dirname, 'src', 'AppRoutes.tsx');
let appRoutesContent = fs.readFileSync(appRoutesPath, 'utf8');
appRoutesContent = appRoutesContent.replace(/setCurrentUser\(\{ id: 'guest', user_metadata: \{ username: 'Guest' \}, email: 'guest@iaventura\.com' \}\);/g, 
`setCurrentUser({ id: 'guest', user_metadata: { username: 'Guest' }, email: 'guest@iaventura.com', app_metadata: {}, aud: 'authenticated', created_at: new Date().toISOString() } as any);`);

fs.writeFileSync(aiPath, aiContent);
fs.writeFileSync(appRoutesPath, appRoutesContent);
console.log("Fixes applied");
