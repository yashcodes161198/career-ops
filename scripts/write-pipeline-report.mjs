#!/usr/bin/env node
/**
 * Write evaluation report + update pipeline.md + tracker TSV
 * Usage: node scripts/write-pipeline-report.mjs <json-file>
 * JSON: { url, company, role, score, archetype, legitimacy, workAuth, reportBody, keywords, jdArchive }
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { TSV_ADDITION_HEADER } from '../tracker-parse.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const input = JSON.parse(readFileSync(process.argv[2], 'utf-8'));
const {
  url, company, role, score, archetype, legitimacy, workAuth = '➖ Not needed',
  reportBody, keywords = [], jdArchive, pipelineRaw
} = input;

const today = new Date().toISOString().split('T')[0];
const num = execFileSync('node', [join(ROOT, 'reserve-report-num.mjs')], { cwd: ROOT, encoding: 'utf-8' }).trim();
const slug = String(company).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
const filename = `${num}-${slug}-${today}.md`;
const reportPath = join(ROOT, 'reports', filename);
mkdirSync(join(ROOT, 'reports'), { recursive: true });

const header = `# Evaluation: ${company} — ${role}

**Date:** ${today}
**URL:** ${url}
**Via:** —
**Archetype:** ${archetype}
**Score:** ${score}/5
**Legitimacy:** ${legitimacy}
**Work Auth:** ${workAuth}
**PDF:** not generated — run /career-ops pdf ${slug} to create on demand

---

${reportBody}

## Keywords extracted
${keywords.map(k => `- ${k}`).join('\n')}

## Job Description (archived verbatim)
${jdArchive || 'Posted: not visible in source\n\n(JD text unavailable at extraction time.)'}
`;

writeFileSync(reportPath, header, 'utf-8');
execFileSync('node', [join(ROOT, 'reserve-report-num.mjs'), '--release', num], { cwd: ROOT });

// Tracker TSV
const trackerDir = join(ROOT, 'batch', 'tracker-additions');
mkdirSync(trackerDir, { recursive: true });
const trackerFields = [
  String(parseInt(num, 10)), today, company.replace(/[\t\r\n]+/g, ' '),
  role.replace(/[\t\r\n]+/g, ' '), 'Evaluated', `${score}/5`, '❌',
  `[${num}](reports/${filename})`, 'Pipeline evaluation'
];
writeFileSync(join(trackerDir, `${num}-${slug}.tsv`), `${TSV_ADDITION_HEADER}\n${trackerFields.join('\t')}\n`);

// Update pipeline.md
const pipelinePath = join(ROOT, 'data', 'pipeline.md');
let lines = readFileSync(pipelinePath, 'utf-8').split('\n');
lines = lines.map((line) => {
  if (line.trim().startsWith('- [ ]') && line.includes(url)) {
    return `- [x] #${num} | ${url} | ${company} | ${role} | ${score}/5 | PDF ❌`;
  }
  return line;
});
writeFileSync(pipelinePath, lines.join('\n'), 'utf-8');

console.log(JSON.stringify({ num, filename, company, role, score }));
