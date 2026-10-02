import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

// 1. Configuration & Endpoints
const KOBOLD_ENDPOINT =
  process.env.KOBOLD_ENDPOINT || 'http://127.0.0.1:5001/v1/chat/completions';
const TARGET_BRANCH = process.env.TARGET_BRANCH || 'origin/dev';
const REVIEW_TARGET_PATTERNS = [
  '*.ts',
  '*.html',
  '*.scss',
  'project.json',
  'package.json',
  ':!*.stories.ts',
  ':!**/assets/**',
  ':!**/i18n/**',
];
const FALLBACK_MODELS = (
  process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.8-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite'
).split(',').map((m) => m.trim());

// Dynamically assemble active architectural rulebooks based on changed file paths
function assembleApplicableRules(changedFiles) {
  const rules = [];
  const readRule = (fileName) =>
    fs.readFileSync(path.resolve('tools/ai-reviewer/rules', fileName), 'utf-8');

  // Shared catalog and Nx module boundaries are evaluated across all PRs
  if (fs.existsSync(path.resolve('tools/ai-reviewer/shared-catalog.md'))) {
    rules.push(fs.readFileSync(path.resolve('tools/ai-reviewer/shared-catalog.md'), 'utf-8'));
  }
  if (fs.existsSync(path.resolve('tools/ai-reviewer/rules/nx-boundaries.rules.md'))) {
    rules.push(readRule('nx-boundaries.rules.md'));
  }

  // Detect relevant layers from modified file paths
  const hasFrontendChanges = changedFiles.some(
    (f) =>
      f.includes('apps/mfe') ||
      f.includes('/features/') ||
      f.includes('/ui/') ||
      f.endsWith('.html') ||
      f.endsWith('.scss')
  );
  const hasBackendChanges = changedFiles.some(
    (f) =>
      f.includes('apps/backend') ||
      f.includes('features-backend') ||
      f.includes('data-access-backend') ||
      f.includes('guards-backend')
  );
  const hasFirestoreRepoChanges = changedFiles.some(
    (f) =>
      f.includes('data-access-backend') &&
      (f.includes('repository') || f.includes('infrastructure'))
  );

  if (hasFrontendChanges && fs.existsSync(path.resolve('tools/ai-reviewer/rules/angular.rules.md'))) {
    rules.push(readRule('angular.rules.md'));
  }
  if (hasBackendChanges && fs.existsSync(path.resolve('tools/ai-reviewer/rules/nestjs.rules.md'))) {
    rules.push(readRule('nestjs.rules.md'));
  }
  if (hasFirestoreRepoChanges && fs.existsSync(path.resolve('tools/ai-reviewer/rules/firestore.rules.md'))) {
    rules.push(readRule('firestore.rules.md'));
  }

  return rules.join('\n\n---\n\n');
}

// 2. Resolve modified source files (.ts, .html, .scss, project manifests)
let changedFiles = [];
try {
  const patternArgs = REVIEW_TARGET_PATTERNS.map((p) => `"${p}"`).join(' ');
  const fileListOutput = execSync(
    `git diff ${TARGET_BRANCH} --name-only -- ${patternArgs}`,
    { encoding: 'utf-8' }
  );
  changedFiles = fileListOutput.split('\n').map((f) => f.trim()).filter(Boolean);
} catch (error) {
  console.error('Failed to parse changed files against target branch:', error.message);
  process.exit(1);
}

if (changedFiles.length === 0) {
  console.log('No relevant source or architectural configuration files modified. Skipping review.');
  process.exit(0);
}

// 3. Extract exact git diff chunks
const patternArgs = REVIEW_TARGET_PATTERNS.map((p) => `"${p}"`).join(' ');
const gitDiff = execSync(
  `git diff ${TARGET_BRANCH} -- ${patternArgs}`,
  { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
);

// 4. Smart Context Enrichment (Pairing companion templates, backing components, and contracts)
const enrichedContext = [];
const visitedFiles = new Set(changedFiles);

const importMatches = [
  ...gitDiff.matchAll(/from\s+['"](@[a-zA-Z0-9\/-]+|(?:\.\.?\/[^\s'"]+))['"]/g),
];
const tsConfigPaths =
  JSON.parse(fs.readFileSync('tsconfig.base.json', 'utf-8')).compilerOptions
    .paths || {};

for (const match of importMatches) {
  const importPath = match[1];
  let resolvedFilePath = null;

  // Resolve path aliases mapped in tsconfig.base.json
  if (tsConfigPaths[importPath]) {
    const candidate = tsConfigPaths[importPath][0];
    if (fs.existsSync(candidate)) resolvedFilePath = candidate;
  }

  if (resolvedFilePath && !visitedFiles.has(resolvedFilePath)) {
    // Inject only Store contracts, Interfaces, and Models to conserve token window
    if (
      resolvedFilePath.includes('store') ||
      resolvedFilePath.includes('model') ||
      resolvedFilePath.includes('interface')
    ) {
      enrichedContext.push({
        path: resolvedFilePath,
        content: fs.readFileSync(resolvedFilePath, 'utf-8'),
        reason: `Contract definition imported via ${importPath}`,
      });
      visitedFiles.add(resolvedFilePath);
    }
  }
}

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
const masterStorePath = 'libs/shared/data-access/src/lib/stores/master-data.store.ts';
if (
  gitDiff.includes('MasterDataStore') &&
  fs.existsSync(masterStorePath) &&
  !visitedFiles.has(masterStorePath)
) {
  enrichedContext.push({
    path: masterStorePath,
    content: fs.readFileSync(masterStorePath, 'utf-8'),
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
const activeRules = assembleApplicableRules(changedFiles);

// 5. Inference Handlers: Primary (KoboldCpp) & Fallback (Gemini API via Interactions API)
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
        { role: 'system', content: activeRules },
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
  console.log('Local AI offline or timed out. Engaging official Gemini Interactions API fallback...');
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY or GOOGLE_API_KEY environment variable.');
  }

  const ai = new GoogleGenAI();
  let lastError = null;

  // Execute cascading fallback across configured models
  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`Attempting cloud review with model: ${modelName}...`);
      const interaction = await ai.interactions.create({
        model: modelName,
        input: `${activeRules}\n\n${userPrompt}`,
      });

      return {
        content: interaction.output_text,
        modelUsed: modelName,
      };
    } catch (err) {
      lastError = err;
      const isTransientOrQuotaError =
        err.status === 429 ||
        err.status === 503 ||
        err.status === 500 ||
        err.message?.includes('429') ||
        err.message?.includes('503') ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.toLowerCase().includes('quota') ||
        err.message?.toLowerCase().includes('high demand') ||
        err.message?.toLowerCase().includes('overloaded') ||
        err.message?.toLowerCase().includes('unavailable');

      if (isTransientOrQuotaError) {
        console.warn(`[Cascading] Model ${modelName} unavailable/throttled. Trying next candidate...`);
        continue;
      }

      // Re-throw unrecoverable issues (e.g., auth failure, invalid tokens) immediately
      throw err;
    }
  }

  throw new Error(`All cloud fallback models exhausted quota. Last error: ${lastError?.message}`);
}

// 6. Execution Orchestration
let reviewReport = '';
let activeEngine = 'Local KoboldCpp (RX 6800 XT)';

try {
  reviewReport = await requestKoboldCpp();
} catch (primaryErr) {
  console.warn(`Primary engine failed (${primaryErr.message}). Initiating fallback...`);
  try {
    const fallbackResult = await requestGeminiFallback();
    reviewReport = fallbackResult.content;
    activeEngine = `Google ${fallbackResult.modelUsed} (Cloud Fallback)`;
  } catch (fallbackErr) {
    console.error(`Fallback failed: ${fallbackErr.message}`);
    process.exit(1);
  }
}

// 7. Format Output & Write Artifact
const finalArtifact = `> **Review Engine:** ${activeEngine}\n\n${reviewReport}`;

console.log('\n=================== AI CODE REVIEW REPORT ===================');
console.log(finalArtifact);
console.log('=============================================================\n');

fs.writeFileSync('pr-review-report.md', finalArtifact, 'utf-8');

if (finalArtifact.includes('VERDICT: CHANGES_REQUESTED') || finalArtifact.includes('VERDICT: REJECTED')) {
  console.error('Merge Gate: Architectural violations flagged. Resolve before merging to target branch.');
  process.exit(1);
} else {
  console.log('Merge Gate: Code meets monorepo architectural guidelines.');
  process.exit(0);
}