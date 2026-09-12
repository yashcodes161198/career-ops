#!/usr/bin/env node
/**
 * Apply liveness results and a fresher-focused pre-screen to data/pipeline.md.
 *
 * The location rules below are starter defaults for an India-focused search.
 * Personalize them with the candidate's actual eligibility before use.
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PIPELINE = join(ROOT, 'data', 'pipeline.md');
const DISCARD = join(ROOT, 'data', 'discard.log');
const LIVENESS = process.argv[2] || '/tmp/liveness-results.txt';

const OUTSIDE_INDIA_ONLY = /\b(remote[,\s-]*(?:usa|us\b)|united states|san diego|california,\s*united states|remote,\s*canada(?:\s*;\s*remote,\s*united states)?|remote,\s*united kingdom|remote,\s*poland|remote,\s*israel|us-ca-remote|us-remote|us-wa-remote|finland-remote|sweden-remote)\b/i;
const INDIA_OK = /\b(india|hyderabad|bengaluru|bangalore|chennai|mumbai|pune|noida|delhi|kolkata|work from home,\s*india|anywhere in the world)\b/i;
const NON_FRESHER_SENIORITY = /\b(senior|staff|principal|lead engineer|engineering manager|manager|director|vice president|vp)\b/i;
const INTERNSHIP_ROLE = /\b(intern|internship|co-op|summer intern|winter intern)\b/i;

function ts() {
  return new Date().toISOString();
}

function logDiscard(url, reason) {
  appendFileSync(DISCARD, `${ts()}\t${url}\t${reason}\n`);
}

function parseExpired(text) {
  const urls = [];
  for (const line of text.split('\n')) {
    const m = line.match(/❌\s+expired\s+(https?:\/\/\S+)/);
    if (m) urls.push(m[1]);
  }
  return urls;
}

function parseLine(line) {
  const m = line.match(/^- \[ \]\s+(https?:\/\/\S+)(?:\s*\|\s*([^|]+))?(?:\s*\|\s*([^|]+))?(?:\s*\|\s*([^|]+))?/);
  if (!m) return null;
  return { url: m[1], company: (m[2] || '').trim(), role: (m[3] || '').trim(), location: (m[4] || '').trim(), raw: line };
}

function prescreenReason(entry) {
  const loc = entry.location;
  const role = entry.role;
  if (loc && OUTSIDE_INDIA_ONLY.test(loc) && !INDIA_OK.test(loc)) {
    return `pre-screen mismatch: location restricts hiring outside India (${loc})`;
  }
  if (NON_FRESHER_SENIORITY.test(role)) {
    return `pre-screen mismatch: non-fresher seniority (${role})`;
  }
  if (INTERNSHIP_ROLE.test(role)) {
    return `pre-screen mismatch: internship role (${role})`;
  }
  return null;
}

const livenessText = readFileSync(LIVENESS, 'utf-8');
const expiredUrls = new Set(parseExpired(livenessText));

let lines = readFileSync(PIPELINE, 'utf-8').split('\n');
const processed = [];
let expiredCount = 0;
let skipCount = 0;

const newLines = lines.map((line) => {
  if (!line.trim().startsWith('- [ ]')) return line;
  const entry = parseLine(line);
  if (!entry) return line;

  if (expiredUrls.has(entry.url)) {
    expiredCount++;
    const label = entry.company && entry.role ? `${entry.url} | ${entry.company} | ${entry.role}` : entry.url;
    processed.push({ type: 'expired', entry, line: `- [x] ~~${label}~~ — posting expired (liveness sweep)` });
    return processed[processed.length - 1].line;
  }

  const reason = prescreenReason(entry);
  if (reason) {
    skipCount++;
    logDiscard(entry.url, reason);
    const label = entry.company && entry.role ? `${entry.url} | ${entry.company} | ${entry.role}` : entry.url;
    processed.push({ type: 'skip', entry, reason });
    return `- [x] #-- | ${label} | skipped (${reason})`;
  }

  return line;
});

writeFileSync(PIPELINE, newLines.join('\n'), 'utf-8');

const pending = newLines.filter((l) => l.trim().startsWith('- [ ]')).length;
console.log(JSON.stringify({ expiredCount, skipCount, pending, processed: processed.length }, null, 2));
