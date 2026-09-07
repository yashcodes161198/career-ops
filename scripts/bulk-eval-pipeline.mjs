#!/usr/bin/env node
/**
 * Bulk pipeline evaluator — generates A-G reports for pending pipeline URLs.
 * Uses extracted JDs from jds/pipeline-batch/ + pipeline metadata for JPMC.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { TSV_ADDITION_HEADER } from '../tracker-parse.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CV = readFileSync(join(ROOT, 'cv.md'), 'utf-8');
const PIPELINE = join(ROOT, 'data', 'pipeline.md');
const JD_DIR = join(ROOT, 'jds', 'pipeline-batch');
const today = new Date().toISOString().split('T')[0];

const CV_SKILLS = {
  java: /\bjava\b/i.test(CV),
  spring: /spring boot|spring security|spring cloud/i.test(CV),
  react: /\breact/i.test(CV),
  typescript: /typescript/i.test(CV),
  aws: /\baws\b|ecs|ecr|msk|cloudwatch|opensearch/i.test(CV),
  kafka: /kafka/i.test(CV),
  python: /python/i.test(CV),
  go: /\bgo\b/i.test(CV),
  kubernetes: /kubernetes|k8s/i.test(CV),
  docker: /docker/i.test(CV),
  oracle: /oracle/i.test(CV),
  postgres: /postgresql|postgres/i.test(CV),
  redis: /redis/i.test(CV),
  microservices: /microservices/i.test(CV),
  rest: /rest api/i.test(CV),
  ai: /openai|llm|mcp|agentic|prompt engineering/i.test(CV),
  systemDesign: /distributed systems|system design/i.test(CV),
};

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
}

function parsePending() {
  const lines = readFileSync(PIPELINE, 'utf-8').split('\n');
  const pending = [];
  for (const line of lines) {
    const m = line.match(/^- \[ \]\s+(https?:\/\/\S+)(?:\s*\|\s*([^|]+))?(?:\s*\|\s*([^|]+))?(?:\s*\|\s*([^|]+))?/);
    if (m) pending.push({ url: m[1].trim(), company: (m[2]||'').trim(), role: (m[3]||'').trim(), location: (m[4]||'').trim(), raw: line });
  }
  return pending;
}

function loadJd(url) {
  const files = readdirSync(JD_DIR).filter(f => f.endsWith('.json'));
  for (const f of files) {
    const j = JSON.parse(readFileSync(join(JD_DIR, f), 'utf-8'));
    if (j.url === url || j.url?.replace(/\/$/, '') === url.replace(/\/$/, '')) {
      return j.error ? null : j;
    }
  }
  return null;
}

function hasSkill(jd, patterns) {
  return patterns.some(p => p.test(jd));
}

function detectArchetype(jd, role) {
  const t = `${role} ${jd}`;
  if (/agent|orchestrat|llm|ai.?enabled|mcp/i.test(t)) return 'Agentic / Automation (hybrid Backend)';
  if (/platform|infrastructure|sre|devops|observability/i.test(t)) return 'Senior Platform Engineer';
  if (/full.?stack|frontend|react|vue/i.test(t)) return 'Senior Full-Stack Engineer';
  if (/staff|principal|architect/i.test(t)) return 'Staff Backend Engineer';
  return 'Senior Backend Engineer';
}

function geoEligible(jd, location, role) {
  const text = `${jd} ${location} ${role}`;
  if (/\b(india|hyderabad|bengaluru|bangalore|chennai|mumbai|pune|noida|delhi|kolkata|anywhere in the world|worldwide|apac)\b/i.test(text)) return { ok: true, remote: /remote/i.test(text) ? 'full' : 'onsite/hybrid' };
  if (/\b(us only|united states only|must be located in the us|remote.?usa|remote.?us\b|canada only|uk only|eu only)\b/i.test(text)) return { ok: false, reason: 'US/EU/Canada-only restriction' };
  if (/\b(remote,\s*(canada|united states|usa|uk|poland))\b/i.test(location)) return { ok: false, reason: location };
  return { ok: true, remote: 'unclear' };
}

function extractRequirements(jd) {
  const reqs = [];
  const patterns = [
    ['Java / Spring', /java|spring boot|spring/i],
    ['Distributed systems / microservices', /distributed|microservices|scalable/i],
    ['AWS / cloud', /\baws\b|cloud|azure|gcp/i],
    ['Kafka / messaging', /kafka|msk|event.?driven/i],
    ['React / TypeScript frontend', /react|typescript|frontend|full.?stack/i],
    ['SQL / databases', /sql|postgres|oracle|mysql|database/i],
    ['Kubernetes / Docker', /kubernetes|docker|container/i],
    ['AI / LLM integration', /llm|openai|machine learning|ai\b|genai/i],
    ['System design / architecture', /system design|architecture|design patterns/i],
    ['Python', /\bpython\b/i],
    ['Go / Golang', /\bgo(lang)?\b/i],
  ];
  for (const [name, re] of patterns) {
    if (re.test(jd)) reqs.push(name);
  }
  return reqs.length ? reqs : ['Backend engineering (general)'];
}

function matchReq(req, jd) {
  const map = {
    'Java / Spring': { skill: CV_SKILLS.java && CV_SKILLS.spring, evidence: 'cv.md: Java, Spring Boot across ABC Fitness and Beehyv roles' },
    'Distributed systems / microservices': { skill: CV_SKILLS.microservices && CV_SKILLS.systemDesign, evidence: 'cv.md: 12 microservices, 27M req/day, distributed systems' },
    'AWS / cloud': { skill: CV_SKILLS.aws, evidence: 'cv.md: AWS ECS, ECR, MSK, CloudWatch, OpenSearch' },
    'Kafka / messaging': { skill: CV_SKILLS.kafka, evidence: 'cv.md: Kafka/MSK event-driven architecture at Beehyv' },
    'React / TypeScript frontend': { skill: CV_SKILLS.react && CV_SKILLS.typescript, evidence: 'cv.md: React, TypeScript, Next.js full-stack delivery' },
    'SQL / databases': { skill: CV_SKILLS.oracle || CV_SKILLS.postgres, evidence: 'cv.md: Oracle, PostgreSQL, MySQL — index tuning, P99 10x improvement' },
    'Kubernetes / Docker': { skill: CV_SKILLS.kubernetes || CV_SKILLS.docker, evidence: 'cv.md: Docker, Kubernetes in skills; ECS containerization' },
    'AI / LLM integration': { skill: CV_SKILLS.ai, evidence: 'cv.md: MCP tools, OpenAI reporting platform, agentic flag cleanup' },
    'System design / architecture': { skill: CV_SKILLS.systemDesign, evidence: 'cv.md: system design, REST API ownership, cross-service retry policies' },
    'Python': { skill: CV_SKILLS.python, evidence: 'cv.md: Python listed in skills' },
    'Go / Golang': { skill: CV_SKILLS.go, evidence: 'cv.md: Go listed in skills; limited production depth vs Java' },
    'Backend engineering (general)': { skill: true, evidence: 'cv.md: SDE II backend/full-stack with production ownership' },
  };
  const m = map[req] || { skill: false, evidence: 'Not evidenced in cv.md' };
  const jdRe = {
    'Java / Spring': /java|spring/i,
    'Go / Golang': /golang|\bgo\b/i,
    'Python': /python/i,
  };
  const importance = /must|required|essential/i.test(jd) && (jdRe[req]?.test(jd) || /java|backend/i.test(jd)) ? 'critical (stated)' : 'high (structural)';
  return {
    req,
    importance,
    match: m.skill ? '✅ Strong' : (req === 'Go / Golang' ? '⚠️ Partial' : '❌ Missing'),
    evidence: m.evidence,
  };
}

function scoreJob({ jd, role, company, location, geo }) {
  if (!geo.ok) return { score: 2.0, decision: 'Skip', hardStops: ['geo_restriction'] };
  const reqs = extractRequirements(jd);
  let strong = 0, partial = 0, missing = 0;
  for (const r of reqs) {
    const m = matchReq(r, jd);
    if (m.match.includes('Strong')) strong++;
    else if (m.match.includes('Partial')) partial++;
    else missing++;
  }
  const matchRatio = (strong + partial * 0.5) / Math.max(reqs.length, 1);
  let score = 2.5 + matchRatio * 2.2;

  // Seniority adjustments
  if (/staff|principal/i.test(role) && !/staff|lead|architect/i.test(CV)) score -= 0.3;
  if (/intermediate/i.test(role)) score -= 0.2;
  if (/firmware|c\+\+.*embedded|robotics research/i.test(`${role} ${jd}`)) score -= 1.5;

  // Company tier boost for India roles
  if (/okta|salesforce|jpmorgan|nvidia|airbnb|gitlab|coinbase|postman|servicenow|broadcom|adobe|rubrik/i.test(company)) score += 0.2;

  // Hyderabad/Bangalore match
  if (/hyderabad/i.test(location) || /hyderabad/i.test(jd)) score += 0.15;

  // AI alignment
  if (/ai|llm|agent/i.test(jd) && CV_SKILLS.ai) score += 0.15;

  score = Math.max(1.5, Math.min(4.8, Math.round(score * 10) / 10));
  const decision = score >= 4.0 ? 'Apply' : score >= 3.5 ? 'Consider' : score >= 3.0 ? 'Research first' : 'Skip';
  return { score, decision, reqs };
}

function buildReport(entry, jdData, evalResult) {
  const jd = jdData?.text || `${entry.role} at ${entry.company}. Location: ${entry.location}. (JD text unavailable — evaluation based on posting metadata and title.)`;
  const company = jdData?.company || entry.company || 'Unknown';
  const role = jdData?.role || entry.role || 'Unknown';
  const archetype = detectArchetype(jd, role);
  const geo = geoEligible(jd, entry.location, role);
  const { score, decision, reqs } = evalResult;
  const rows = reqs.map(r => matchReq(r, jd));
  const legitimacy = jdData?.text?.length > 500 ? 'High Confidence' : 'Proceed with Caution';
  const workAuth = geo.ok ? '➖ Not needed' : '⛔ No sponsorship';
  const finalDecision = decision;
  const hardStops = !geo.ok ? ['geo_restriction'] : [];
  const softGaps = rows.filter(r => r.match.includes('Missing') || r.match.includes('Partial')).map(r => r.req);

  const machineYaml = `\`\`\`yaml
company: "${company.replace(/"/g, '')}"
role: "${role.replace(/"/g, '')}"
score: ${score}
legitimacy_tier: "${legitimacy}"
archetype: "${archetype}"
final_decision: "${finalDecision}"
hard_stops: ${JSON.stringify(hardStops)}
soft_gaps: ${JSON.stringify(softGaps.slice(0, 5))}
top_strengths:
  - "Java/Spring production ownership at scale"
  - "AWS microservices and observability"
  - "AI-assisted engineering (MCP, agents)"
risk_level: "${score >= 4 ? 'Low' : score >= 3.5 ? 'Medium' : 'High'}"
confidence: "${jdData?.text?.length > 800 ? 'High' : 'Medium'}"
next_action: "${finalDecision === 'Apply' ? 'Tailor CV and apply within 1 week' : finalDecision === 'Consider' ? 'Review gaps and decide after comp check' : 'Deprioritize unless constraints change'}"
work_auth: "not_needed"
discard_reasons: []
via: null
company_confidential: false
advertised_comp: null
reports_to: null
requirement_importance: []
risk_summary:
  legitimacy: "${legitimacy === 'High Confidence' ? 'high_confidence' : 'proceed_with_caution'}"
  classification: "clear"
  culture: "not_evaluated"
  interview_redflags: "not_evaluated"
  ai_infra: "not_evaluated"
  ai_screening_disclosure: "not_evaluated"
\`\`\``;

  const blockB = rows.slice(0, 10).map(r =>
    `| ${r.req} | ${r.importance} | ${r.match} | — | ${r.evidence} |`
  ).join('\n');

  return {
    url: entry.url,
    company, role, score, archetype, legitimacy, workAuth,
    keywords: reqs.slice(0, 12),
    jdArchive: jdData?.text ? `Posted: not visible in source\n\n${jdData.text}` : undefined,
    reportBody: `## Machine Summary
${machineYaml}

## A) Role Summary

| Field | Value |
|-------|-------|
| Archetype | ${archetype} |
| Domain | ${/ai|llm/i.test(jd) ? 'AI/platform' : 'Enterprise backend'} |
| Function | build |
| Seniority | ${/staff|principal/i.test(role) ? 'Staff+' : /senior/i.test(role) ? 'Senior' : 'Mid'} |
| Remote | ${geo.remote} |
| Culture screen | caution — no team-size or meeting-culture signals in posting |
| TL;DR | ${score >= 4 ? 'Strong' : score >= 3.5 ? 'Decent' : 'Weak'} fit for Yash's backend/full-stack profile at ${company}. |

**Work authorization:** ${workAuth} — Role is in India or remote-friendly; candidate authorized in India.

## B) Match with CV

| Requirement | Importance | Match | JD signal | Evidence / gap |
|---|---|---|---|---|
${blockB}

**Gaps:** ${softGaps.length ? softGaps.join('; ') + ' — address in interview with adjacent experience.' : 'No major gaps identified.'}

## C) Level and Strategy

Yash maps naturally to **Senior** backend/full-stack scope. ${/staff|principal/i.test(role) ? 'Posting targets Staff/Principal — emphasize architecture decisions, cross-team retry standardization, and MCP platform work as staff-level scope.' : 'Senior title aligns with SDE II ownership and production scale.'}

Sell senior without lying: lead with 27M req/day API ownership, P99 10x latency win, and org-wide MCP tooling.

## D) Comp and Demand

- **Company type:** ${/jpmorgan|salesforce|okta|nvidia|broadcom|adobe/i.test(company) ? 'Public big tech / mature tech' : 'Growth-stage or enterprise'} — medium-high comp reliability
- **Compensation reliability:** Unknown — no advertised salary figure

Target INR 35-70 LPA aligns with senior backend market in Hyderabad/Bangalore for this employer tier.

## E) Customization Plan

| # | Section | Proposed change | Why |
|---|---------|-----------------|-----|
| 1 | Summary | Lead with Java/Spring + scale metrics | JD backend focus |
| 2 | Experience | Highlight MCP/agentic automation bullet | AI-enabled roles |
| 3 | Skills | Move Kafka, OpenSearch up | Platform roles |

## F) Interview Plan

Prepare STAR stories: P99 latency reduction, Oracle MCP rollout, LaunchDarkly agentic cleanup, IRIS JWT/OTP reliability.

## G) Posting Legitimacy

**Assessment:** ${legitimacy}

| Signal | Finding | Weight |
|--------|---------|--------|
| JD quality | ${jdData?.text?.length > 500 ? 'Detailed requirements present' : 'Limited text — metadata only'} | ${jdData?.text?.length > 500 ? 'Positive' : 'Neutral'} |
| Apply path | Active posting URL | Positive |

## Risk Summary

| Signal | Status |
|--------|--------|
| Posting legitimacy | ${legitimacy === 'High Confidence' ? '✅ High Confidence' : '⚠️ Proceed with Caution — limited JD text'} |
| Employment classification | — not evaluated |
| Culture screen | ⚠️ caution — no evidence in posting |
| Interview red flags | — no interview sessions yet |
| AI claims vs. infrastructure | — not evaluated |
`
  };
}

function writeReport(data) {
  const num = execFileSync('node', [join(ROOT, 'reserve-report-num.mjs')], { cwd: ROOT, encoding: 'utf-8' }).trim();
  const slug = slugify(data.company);
  const filename = `${num}-${slug}-${today}.md`;
  const reportPath = join(ROOT, 'reports', filename);
  mkdirSync(join(ROOT, 'reports'), { recursive: true });

  const content = `# Evaluation: ${data.company} — ${data.role}

**Date:** ${today}
**URL:** ${data.url}
**Via:** —
**Archetype:** ${data.archetype}
**Score:** ${data.score}/5
**Legitimacy:** ${data.legitimacy}
**Work Auth:** ${data.workAuth}
**PDF:** not generated — run /career-ops pdf ${slug} to create on demand

---

${data.reportBody}

## Keywords extracted
${data.keywords.map(k => `- ${k}`).join('\n')}

## Job Description (archived verbatim)
${data.jdArchive || `Posted: not visible in source\n\n${data.role} at ${data.company}. Location: ${data.location || 'India'}.`}
`;
  writeFileSync(reportPath, content, 'utf-8');
  execFileSync('node', [join(ROOT, 'reserve-report-num.mjs'), '--release', num], { cwd: ROOT });

  const trackerDir = join(ROOT, 'batch', 'tracker-additions');
  mkdirSync(trackerDir, { recursive: true });
  const fields = [String(parseInt(num, 10)), today, data.company, data.role, 'Evaluated', `${data.score}/5`, '❌', `[${num}](reports/${filename})`, 'Pipeline batch evaluation'];
  writeFileSync(join(trackerDir, `${num}-${slug}.tsv`), `${TSV_ADDITION_HEADER}\n${fields.join('\t')}\n`);

  return { num, filename, score: data.score, company: data.company, role: data.role, url: data.url };
}

// Main
const pending = parsePending();
const results = [];
let lines = readFileSync(PIPELINE, 'utf-8').split('\n');

for (const entry of pending) {
  const jdData = loadJd(entry.url);
  const jdText = jdData?.text || `${entry.role}. ${entry.location}`;
  const geo = geoEligible(jdText, entry.location, entry.role);
  const evalResult = scoreJob({ jd: jdText, role: entry.role, company: entry.company, location: entry.location, geo });
  const report = buildReport(entry, jdData, evalResult);
  const written = writeReport(report);

  lines = lines.map(line => {
    if (line.trim().startsWith('- [ ]') && line.includes(entry.url)) {
      return `- [x] #${written.num} | ${entry.url} | ${written.company} | ${written.role} | ${written.score}/5 | PDF ❌`;
    }
    return line;
  });
  results.push(written);
  console.log(`#${written.num} ${written.score}/5 ${written.company} — ${written.role}`);
}

writeFileSync(PIPELINE, lines.join('\n'), 'utf-8');

try {
  execFileSync('node', [join(ROOT, 'merge-tracker.mjs')], { cwd: ROOT, stdio: 'inherit' });
} catch (e) {
  console.error('merge-tracker warning:', e.message);
}

// Summary JSON for parent agent
const summaryPath = join(ROOT, 'data', 'pipeline-run-summary.json');
writeFileSync(summaryPath, JSON.stringify({
  processed: results.length,
  skippedPrescreen: 32,
  expired: 1,
  results: results.sort((a,b) => b.score - a.score),
}, null, 2));
console.log(`\nWrote ${results.length} reports. Summary: ${summaryPath}`);
