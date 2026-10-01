import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import 'dotenv/config';

const KOBOLD_ENDPOINT = process.env.KOBOLD_ENDPOINT || 'http://127.0.0.1:5001/v1/chat/completions';
const TARGET_BRANCH = process.env.TARGET_BRANCH || 'origin/dev';
const RULES_PATH = path.resolve('tools/ai-reviewer/angular-rules.md');

// 1. Validate ruleset existence
if (!fs.existsSync(RULES_PATH)) {
  console.error(`Rulebook not found at: ${RULES_PATH}`);
  process.exit(1);
}
const angularRules = fs.readFileSync(RULES_PATH, 'utf-8');

// 2. Resolve modified Angular source files (.ts, .html, excluding specs)
let changedFiles = [];
try {
  const fileListOutput = execSync(
    `git diff ${TARGET_BRANCH}...HEAD --name-only -- "*.ts" "*.html" ":!*.spec.ts"`,
    { encoding: 'utf-8' }
  );
  changedFiles = fileListOutput.split('\n').map((f) => f.trim()).filter(Boolean);
} catch (error) {
  console.error('Failed to parse changed files against target branch:', error.message);
  process.exit(1);
}

if (changedFiles.length === 0) {
  console.log('No relevant Angular source files (.ts, .html) modified. Skipping review.');
  process.exit(0);
}

// 3. Extract exact git diff chunks
const gitDiff = execSync(
  `git diff ${TARGET_BRANCH}...HEAD -- "*.ts" "*.html" ":!*.spec.ts"`,
  { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
);

// 4. Smart Context Enrichment (Pairing companion templates and stores)
const enrichedContext = [];
const visitedFiles = new Set(changedFiles);

for (const file of changedFiles) {
  if (file.endsWith('.component.ts')) {
    const companionHtml = file.replace(/\.component\.ts$/, '.component.html');
    if (fs.existsSync(companionHtml) && !visitedFiles.has(companionHtml)) {
      enrichedContext.push({
        path: companionHtml,
        content: fs.readFileSync(companionHtml, 'utf-8'),
        reason: 'Companion template of modified component',
      });
      visitedFiles.add(companionHtml);
    }
  }

  if (file.endsWith('.component.html')) {
    const companionTs = file.replace(/\.component\.html$/, '.component.ts');
    if (fs.existsSync(companionTs) && !visitedFiles.has(companionTs)) {
      enrichedContext.push({
        path: companionTs,
        content: fs.readFileSync(companionTs, 'utf-8'),
        reason: 'Backing component definition of modified template',
      });
      visitedFiles.add(companionTs);
    }
  }
}

// Enrich centralized MasterDataStore if consumed in diff but not in changed files
const storePath = 'libs/shared/data-access/src/lib/stores/master-data.store.ts';
if (gitDiff.includes('MasterDataStore') && fs.existsSync(storePath) && !visitedFiles.has(storePath)) {
  enrichedContext.push({
    path: storePath,
    content: fs.readFileSync(storePath, 'utf-8'),
    reason: 'Centralized MasterDataStore contract referenced in diff',
  });
}

// Construct context section
let contextSection = '';
if (enrichedContext.length > 0) {
  contextSection = '\n\n### ADDITIONAL RELEVANT CONTEXT FILES:\n';
  for (const item of enrichedContext) {
    contextSection += `\n--- File: ${item.path} (${item.reason}) ---\n\`\`\`typescript\n${item.content}\n\`\`\`\n`;
  }
}

const userPrompt = `### GIT DIFF UNDER REVIEW (Targeting ${TARGET_BRANCH}):\n\`\`\`diff\n${gitDiff}\n\`\`\`\n${contextSection}`;

// 5. Inference Handlers: Primary (KoboldCpp) & Fallback (Gemini API via Genkit)
async function requestKoboldCpp() {
  console.log('Sending request to Local KoboldCpp (RX 6800 XT)...');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 40000); // 40-second timeout threshold

  const res = await fetch(KOBOLD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      model: 'qwen2.5-coder',
      messages: [
        { role: 'system', content: angularRules },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 3072,
    }),
  });
  clearTimeout(timeoutId);

  if (!res.ok) {
    throw new Error(`KoboldCpp responded with HTTP status: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

async function requestGeminiFallback() {
  console.log('Local AI offline or timed out. Engaging Genkit Gemini API fallback...');
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable for fallback.');
  }

  const ai = genkit({
    plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  });

  const response = await ai.generate({
    model: gemini15Flash,
    system: angularRules,
    prompt: userPrompt,
    config: {
      temperature: 0.1,
    },
  });

  return response.text;
}

// 6. Execution orchestration
let reviewReport = '';
let activeEngine = 'Local KoboldCpp (RX 6800 XT)';

try {
  reviewReport = await requestKoboldCpp();
} catch (primaryErr) {
  console.warn(`Primary engine failed (${primaryErr.message}). Initiating fallback...`);
  try {
    reviewReport = await requestGeminiFallback();
    activeEngine = 'Google Gemini 1.5 Flash (Genkit Fallback)';
  } catch (fallbackErr) {
    console.error(`Fallback failed: ${fallbackErr.message}`);
    process.exit(1);
  }
}

// 7. Format output and write artifact
const finalArtifact = `> **Review Engine:** ${activeEngine}\n\n${reviewReport}`;

console.log('\n=================== AI CODE REVIEW REPORT ===================');
console.log(finalArtifact);
console.log('=============================================================\n');

fs.writeFileSync('pr-review-report.md', finalArtifact, 'utf-8');

if (finalArtifact.includes('VERDICT: CHANGES_REQUESTED')) {
  console.error('Merge Gate: Architectural violations flagged. Resolve before merging to dev.');
  process.exit(1);
} else {
  console.log('Merge Gate: Code meets Angular architectural guidelines.');
  process.exit(0);
}