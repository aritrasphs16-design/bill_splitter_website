const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../src/app/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Name changes
content = content.replace(/CruiseSplit/g, 'SplitEasy');
content = content.replace(/v2\.0/g, 'v3.0');

// 2. Icon changes
content = content.replace(/<Anchor /g, '<Wallet ');

// 3. Font change
content = content.replace(
  /className="min-h-screen bg-\[var\(--color-surface\)\]/,
  'className="font-[family-name:var(--font-jakarta)] min-h-screen bg-[var(--color-surface)]'
);

// 4. Hero Subtitle text
const oldSubtitle = "Whether it's a weekend road trip or a massive cruise, CruiseSplit tracks who paid what, handles custom percentage splits, and gives you beautiful analytics so your crew can just focus on the adventure.";
const newSubtitle = "From weekend getaways to shared apartment bills — SplitEasy calculates exactly who owes what in seconds, supports any currency, and keeps your finances perfectly balanced.";
content = content.replace(oldSubtitle, newSubtitle);
// Also in case it had SplitEasy already substituted by step 1:
content = content.replace("Whether it's a weekend road trip or a massive cruise, SplitEasy tracks who paid what, handles custom percentage splits, and gives you beautiful analytics so your crew can just focus on the adventure.", newSubtitle);

// 5. Remove Critical Requirement Box
const criticalReqRegex = /<motion\.div[^>]*?>\s*<AlertTriangle[\s\S]*?<\/motion\.div>/;
content = content.replace(criticalReqRegex, '');

// 6. Update other text bits if necessary to sound professional
content = content.replace(/Start your voyage/g, 'Start Splitting Free');
content = content.replace(/smooth sailing/g, 'financial harmony');

fs.writeFileSync(pagePath, content);
console.log('Landing page fixed!');
