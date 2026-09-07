#!/usr/bin/env node
/** Extract JDs for all pending pipeline URLs */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PIPELINE = join(ROOT, 'data', 'pipeline.md');
const OUT_DIR = join(ROOT, 'jds', 'pipeline-batch');
const INDEX = join(OUT_DIR, 'index.jsonl');

mkdirSync(OUT_DIR, { recursive: true });

const lines = readFileSync(PIPELINE, 'utf-8').split('\n');
const pending = [];
for (const line of lines) {
  const m = line.match(/^- \[ \]\s+(https?:\/\/\S+)(?:\s*\|\s*([^|]+))?(?:\s*\|\s*([^|]+))?/);
  if (m) pending.push({ url: m[1], company: (m[2]||'').trim(), role: (m[3]||'').trim(), raw: line });
}

const results = [];
for (let i = 0; i < pending.length; i++) {
  const { url, company, role, raw } = pending[i];
  const slug = `${String(i+1).padStart(3,'0')}-${url.replace(/https?:\/\//,'').replace(/[^a-z0-9]+/gi,'-').slice(0,60)}`;
  const outFile = join(OUT_DIR, `${slug}.json`);
  process.stdout.write(`[${i+1}/${pending.length}] ${company || url.slice(0,50)}... `);
  if (existsSync(outFile)) {
    console.log('cached');
    results.push({ ...pending[i], slug, outFile, cached: true });
    continue;
  }
  try {
    const stdout = execFileSync('node', [join(ROOT, 'browser-extract.mjs'), url, '--max-chars', '15000'], {
      cwd: ROOT, encoding: 'utf-8', timeout: 60000, maxBuffer: 5*1024*1024
    });
    const data = JSON.parse(stdout);
    writeFileSync(outFile, JSON.stringify({ url, company, role, raw, ...data }, null, 2));
    console.log('ok');
    results.push({ url, company, role, raw, slug, outFile, title: data.title });
  } catch (e) {
    const err = { url, company, role, raw, slug, error: e.message };
    writeFileSync(outFile, JSON.stringify(err, null, 2));
    console.log('FAIL:', e.message.slice(0,80));
    results.push(err);
  }
}
writeFileSync(INDEX, results.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log(`\nDone: ${results.filter(r=>!r.error).length} ok, ${results.filter(r=>r.error).length} failed`);
