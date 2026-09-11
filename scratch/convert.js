const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../demo_landing_page.html');
const outputFile = path.join(__dirname, '../src/app/page.tsx');

let html = fs.readFileSync(inputFile, 'utf8');

// Extract body contents inside <body ...> ... </body>
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (!bodyMatch) {
  console.error('No body found');
  process.exit(1);
}
let content = bodyMatch[1];

// Remove Testimonials section
content = content.replace(/<!-- ==================== SOCIAL PROOF & TESTIMONIALS ==================== -->[\s\S]*?(?=<!-- ====================)/i, '');

// Remove Pricing section
content = content.replace(/<!-- ==================== PRICING SECTION ==================== -->[\s\S]*?(?=<!-- ====================)/i, '');

// Remove FAQ section
content = content.replace(/<!-- ==================== FAQ ACCORDION SECTION ==================== -->[\s\S]*?(?=<!-- ====================)/i, '');

// Convert HTML to JSX
// 1. class=" -> className="
content = content.replace(/class="/g, 'className="');

// 2. Self-closing tags
content = content.replace(/<input([^>]*?)>/g, (match, p1) => {
  if (p1.endsWith('/')) return match;
  return `<input${p1}/>`;
});
content = content.replace(/<br>/g, '<br/>');
content = content.replace(/<img([^>]*?)>/g, (match, p1) => {
  if (p1.endsWith('/')) return match;
  return `<img${p1}/>`;
});
content = content.replace(/<hr>/g, '<hr/>');

// 3. style="..."
content = content.replace(/style="([^"]*)"/g, (match, p1) => {
  const styles = p1.split(';').filter(s => s.trim() !== '');
  const styleObj = [];
  styles.forEach(s => {
    const [key, value] = s.split(':');
    if (key && value) {
      const camelKey = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      styleObj.push(`${camelKey}: '${value.trim().replace(/'/g, '"')}'`);
    }
  });
  
  if (p1.includes('font-variation-settings')) {
    const fillMatch = p1.match(/'FILL'\s+(\d+)/);
    if (fillMatch) {
      return `style={{ fontVariationSettings: "'FILL' ${fillMatch[1]}" }}`;
    }
  }
  
  if (p1.includes('width:')) {
      const wMatch = p1.match(/width:\s*([^;]+)/);
      if (wMatch) {
          return `style={{ width: '${wMatch[1].trim()}' }}`;
      }
  }

  return `style={{ ${styleObj.join(', ')} }}`;
});

// 4. HTML comments to JSX comments
content = content.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

// 5. Adjust hrefs for login/signup
content = content.replace(/href="#login"/g, 'href="/login"');
content = content.replace(/href="#signup"/g, 'href="/signup"');

// Fix unescaped entities
content = content.replace(/&amp;/g, '&'); // First unescape to avoid double escape
content = content.replace(/&/g, '&amp;');

// Strip scripts and onclicks to prevent JSX parsing errors
content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
content = content.replace(/ onclick="[^"]*"/g, '');

const finalJsx = `"use client";

import Link from "next/link";
import { useEffect } from "react";
import LandingPageTour from "@/components/LandingPageTour";

export default function Home() {
  return (
    <div className="font-[family-name:var(--font-jakarta)] bg-surface text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed font-body-md text-body-md min-h-screen">
      <LandingPageTour />
      ${content}
    </div>
  );
}
`;

fs.writeFileSync(outputFile, finalJsx);
console.log('Conversion complete!');
