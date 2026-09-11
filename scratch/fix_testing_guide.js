const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TestingGuideModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace "CruiseSplit" with "SplitEasy" globally
content = content.replace(/CruiseSplit/g, 'SplitEasy');

// Since this is the TestingGuideModal, let's also remove the "CRITICAL REQUIREMENT" box completely as per previous user request where they said the AI-generated blocks should be removed. Wait, the user specifically highlighted the text "How to experience the magic of CruiseSplit". They didn't explicitly ask to remove the requirement block here, but it looks like an AI artifact. Let's just do the name replace for now so I don't accidentally break their instructions.
// Actually, the user's screenshot has the "CRITICAL REQUIREMENT" box in it. I'll leave it but just change the name.

fs.writeFileSync(filePath, content);
console.log('Fixed Testing Guide!');
