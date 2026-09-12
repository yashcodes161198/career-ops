# Career Ops setup guide for internship searches

This guide sets up Career Ops for a student or early-career candidate starting
from an empty machine. It also explains which local changes exist in this
workspace and which parts must be personalized before searching.

Career Ops runs locally. It scans supported job boards, compares postings with
the candidate's actual CV, writes evaluation reports, and keeps an application
tracker. It does not guarantee an internship. A person must review every
listing, generated document, and form before using it.

## About this sanitized copy

This copy retains reusable scanner and pipeline changes from the source
workspace. It does not contain the previous candidate's CV, profile, reports,
cached job descriptions, tracker history, or senior-role targeting.

The included `portals.yml`, `modes/_profile.md`, and `modes/_brief.md` now target
internships. They are still templates. Personalize them before the first scan.

## 1. What the new candidate needs

Required:

- A private computer account
- Git
- Node.js 22 or newer, preferably the current LTS release
- npm, which ships with Node.js
- An AI coding CLI supported by Career Ops, such as Cursor, Codex, Claude Code,
  OpenCode, Qwen, Antigravity, or Grok
- A truthful base CV or enough information to create one
- The candidate's actual location and work-authorization details

Recommended:

- A GitHub profile with pinned projects
- Project READMEs that explain the problem, implementation, and result
- A LinkedIn profile consistent with the CV
- A list of preferred roles, locations, companies, and start dates

Optional:

- Go 1.21 or newer for the terminal dashboard
- Chromium for browser extraction and PDF generation
- A private backup location for the user-layer files

Check the installed tools:

```bash
git --version
node --version
npm --version
```

Use Node 22 even though the root package declares an older minimum. The current
web tests and related tooling require Node 22.

## 2. Choose the source

There are two sensible installation paths.

### Option A: start from the public release

Use this when the candidate does not need the local scanner and batch additions
described later.

```bash
npx @santifer/career-ops init
cd career-ops
```

Manual equivalent:

```bash
git clone https://github.com/career-ops-hq/career-ops.git
cd career-ops
npm install
```

### Option B: start from this customized workspace

Use this when the candidate should inherit the Microsoft scanner, India-focused
company-board work, and pipeline helper scripts.

Create a private copy that excludes all existing candidate data:

```bash
rsync -av \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.playwright-mcp' \
  --exclude 'test-results' \
  --exclude 'playwright-report' \
  --exclude 'cv.md' \
  --exclude 'config/profile.yml' \
  --exclude 'portals.yml' \
  --exclude 'modes/_profile.md' \
  --exclude 'modes/_brief.md' \
  --exclude 'modes/_custom.md' \
  --exclude 'data' \
  --exclude 'reports' \
  --exclude 'jds' \
  --exclude 'output' \
  /path/to/customized/career-ops/ \
  /path/to/new-candidate/career-ops/
```

Then initialize a private Git repository or copy these files over a clean clone
of the candidate's fork. Never copy one candidate's private user layer to
another candidate.

If using a transfer archive, preserve the destination clone's `.git`
directory. Do not replace its remote configuration with an archive from another
computer.

## 3. Install dependencies

From the Career Ops root:

```bash
npm install
npx playwright install chromium
```

On Linux, Chromium may need system packages:

```bash
npx playwright install chromium --with-deps
```

Do not copy `node_modules` or Playwright browser binaries from another
computer. Install them on the destination machine.

If using Codex:

```bash
npm install -g @openai/codex@latest
codex login
codex --version
```

Do not copy login tokens between computers.

## 4. Create a clean user layer

Career Ops separates system files from user files.

System files include scripts, providers, templates, and most files under
`modes/`. They can receive upstream updates.

User files contain private facts and preferences:

```text
cv.md
config/profile.yml
modes/_profile.md
modes/_brief.md
modes/_custom.md
portals.yml
article-digest.md
voice-dna.md
data/
reports/
jds/
output/
interview-prep/
```

Create the starting files:

```bash
cp config/profile.example.yml config/profile.yml
cp modes/_profile.internship.template.md modes/_profile.md
cp modes/_brief.internship.template.md modes/_brief.md
cp modes/_custom.internship.template.md modes/_custom.md
cp templates/portals.internship.yml portals.yml
mkdir -p data reports jds output
```

Create `data/applications.md`:

```markdown
# Applications Tracker

| # | Date | Company | Role | Score | Status | PDF | Report | Notes |
|---|------|---------|------|-------|--------|-----|--------|-------|
```

Create `data/pipeline.md`:

```markdown
# Job Pipeline

## Pending

## Processed
```

Do not copy sample facts into the candidate's files. Replace every name,
location, role, salary, project, and metric with candidate-confirmed data.

## 5. Build an internship-ready CV

Create `cv.md` in plain Markdown. For a student, use this order:

```markdown
# Candidate Name

City, Country | email@example.com | LinkedIn URL | GitHub URL

## Summary

Two or three factual lines covering degree, graduation date, strongest
technical area, and the internship being sought.

## Education

### Degree, University
Expected graduation: Month Year
- Relevant coursework: Data Structures, Algorithms, Databases, Operating
  Systems, Computer Networks
- GPA: include only if accurate and useful

## Projects

### Project name
- Built [specific system] using [verified technologies].
- Implemented [technical detail].
- Measured [verified result], or describe the test or deployment if no metric
  exists.
- Repository: https://github.com/...

## Experience

Include internships, research, freelance work, teaching, clubs, and substantial
volunteer engineering. Do not relabel coursework as professional employment.

## Skills

- Languages:
- Frameworks:
- Databases:
- Developer tools:

## Achievements

Include verified hackathon placements, scholarships, publications, competitive
programming ratings, or open-source contributions.
```

Strong internship CV evidence includes:

- Deployed projects with working links
- Tests, benchmarks, or user counts that the candidate can prove
- Meaningful open-source contributions with pull-request links
- Course or research work that demonstrates the target skill
- Clear ownership, even when the project was small

Never invent impact numbers. "Built and deployed a REST API with 18 tested
endpoints" is better than an unsupported claim that it "improved efficiency by
40%."

## 6. Configure the candidate profile

Edit `config/profile.yml`. Keep only real details. A minimal internship example:

```yaml
candidate:
  full_name: "Candidate Name"
  email: "candidate@example.com"
  phone: "+91-00000-00000"
  location: "Bengaluru, India"
  linkedin: "https://linkedin.com/in/candidate"
  github: "https://github.com/candidate"
  portfolio_url: ""
  photo: ""

target_roles:
  primary:
    - "Software Engineering Intern"
    - "Backend Engineering Intern"
  archetypes:
    - name: "Backend Engineering Intern"
      level: "Intern"
      fit: "primary"
    - name: "Software Engineering Intern"
      level: "Intern"
      fit: "primary"
    - name: "Platform or Cloud Engineering Intern"
      level: "Intern"
      fit: "secondary"

narrative:
  headline: "Computer science student seeking a backend engineering internship"
  exit_story: "Seeking a first industry internship to apply verified project and coursework experience."
  superpowers:
    - "Replace with a candidate-specific strength"
  proof_points:
    - name: "Verified project name"
      url: "https://github.com/candidate/project"
      hero_metric: "Use a verified result or omit this field"

compensation:
  target_range: "Open to market internship stipend"
  currency: "INR"
  minimum: ""
  location_flexibility: "State actual remote, hybrid, relocation, and travel limits"

location:
  country: "India"
  city: "Bengaluru"
  timezone: "Asia/Kolkata"
  visa_status: "Authorized to work in India"
  authorized_in: ["India"]
  needs_sponsorship: true

language:
  output: en

spend_tier: standard

pipeline:
  triage_threshold: 3.2
  triage_min_urls: 5

auto_pdf_score_threshold: 4.0
```

Set `needs_sponsorship` according to the candidate's actual situation. Do not
copy the example blindly. A false work-authorization answer can invalidate an
application.

For internships, compensation data is often missing. Do not set a hard stipend
floor unless the candidate has one. Location, semester dates, graduation year,
and work authorization usually matter more during initial filtering.

## 7. Personalize the internship scoring profile

Edit `modes/_profile.md`. This copy includes an internship-level starting
profile. Adapt it to the candidate's actual discipline and evidence:

```markdown
# User Profile Context

## Target roles

| Archetype | Evidence to look for |
|---|---|
| Software Engineering Intern | Programming, data structures, tested projects |
| Backend Engineering Intern | APIs, databases, server-side code, debugging |
| Platform or Cloud Intern | Linux, containers, CI/CD, cloud coursework or projects |

## Evaluation policy

- Score against internship expectations, not senior-engineer expectations.
- Treat a matching degree and graduation window as eligibility signals.
- Treat required prior full-time experience as a likely blocker.
- Do not penalize the candidate for lacking staff-level leadership.
- Prefer roles whose required skills have evidence in `cv.md`.
- Separate required qualifications from preferred qualifications.
- Never infer skills from a project title alone.

## Location policy

- Use the actual locations and work authorization in `config/profile.yml`.
- Flag any country restriction or sponsorship restriction.
- Do not interpret "remote" as "remote worldwide."

## Proof policy

- Use only `cv.md`, `config/profile.yml`, and candidate-confirmed statements.
- Do not invent project users, performance gains, team size, or business impact.
```

Also fill `modes/_brief.md`. Keep it short because pipeline triage reads it for
every job. Include:

- Degree and expected graduation date
- Target internship types
- Work authorization and valid locations
- Available start and end dates
- Three strongest verified proof points
- Hard disqualifiers
- Priority companies

## 8. Set safe house rules

The customized workspace already has useful safety rules in
`modes/_custom.md`. For a new candidate, use:

```markdown
# Custom instructions

## House rules

- During scanning and evaluation, do not generate a CV or cover letter.
- Show the fit score and blockers before proposing application documents.
- Create a tailored CV only after explicit candidate approval.
- Never invent skills, grades, dates, projects, metrics, work authorization,
  availability, or personal details.
- Prefer direct employer postings over reposts.
- Cap unattended scans at 50 new listings.

## Application rules

- Never submit an application.
- Never send email, messages, referral requests, or follow-ups.
- Never automate LinkedIn activity.
- Never bypass bot protection or a site's stated access restrictions.
- The candidate must inspect the live posting and press the final submit button.
```

## 9. Configure internship discovery

Start from `templates/portals.example.yml`, not this workspace's senior-focused
`portals.yml`.

Use a title filter like this:

```yaml
scan_history:
  recheck_after_days: 14
  dedup_include_location: true

max_posting_age_days: 30

title_filter:
  skip_tiers: []
  positive:
    - "Software Engineer Intern"
    - "Software Engineering Intern"
    - "SDE Intern"
    - "Backend Intern"
    - "Developer Intern"
    - "Platform Engineering Intern"
    - "Cloud Engineering Intern"
    - "DevOps Intern"
    - "Data Engineering Intern"
    - "Machine Learning Intern"
    - "Summer Intern"
    - "Winter Intern"
    - "Co-op"
    - "Apprentice"
    - "Graduate Engineer Trainee"
  negative:
    - "Senior"
    - "Staff"
    - "Principal"
    - "Lead Engineer"
    - "Engineering Manager"
    - "Director"
  seniority_boost:
    - "Intern"
    - "Internship"
    - "Co-op"
    - "Graduate"
    - "Apprentice"
```

Tune the positive list to the candidate. A frontend candidate should add
frontend terms. A data candidate should add analytics, data science, and data
engineering terms. Avoid a single config that mixes every technical field.

Example India location filter:

```yaml
location_filter:
  always_allow:
    - "India"
    - "Bengaluru"
    - "Bangalore"
    - "Hyderabad"
    - "Pune"
    - "Gurugram"
    - "Gurgaon"
    - "Noida"
    - "Delhi"
    - "Chennai"
    - "Mumbai"
  allow:
    - "India"
    - "Remote"
    - "Worldwide"
    - "APAC"
    - "Bengaluru"
    - "Bangalore"
    - "Hyderabad"
    - "Pune"
    - "Gurugram"
    - "Gurgaon"
    - "Noida"
    - "Delhi"
    - "Chennai"
    - "Mumbai"
```

"Remote" alone does not prove that an India-based student is eligible. Keep the
country-eligibility filter and verify the full job description.

Useful direct-company targets for internships often include:

- Microsoft
- Google
- Amazon and AWS
- Adobe
- Salesforce
- Atlassian
- NVIDIA
- ServiceNow
- Intuit
- Cisco
- Qualcomm
- Intel
- Mastercard
- Visa
- Indian product companies and funded startups relevant to the candidate's
  location and skills

Company names do not guarantee an active internship program. Add a company only
after finding its official careers board and a supported provider or parser.

Useful broad search queries:

```yaml
search_queries:
  - name: Greenhouse software internships in India
    query: 'site:job-boards.greenhouse.io ("software engineer intern" OR "backend intern" OR "SDE intern") ("India" OR "Bengaluru" OR "Hyderabad" OR "Remote")'
    enabled: true

  - name: Lever software internships in India
    query: 'site:jobs.lever.co ("software engineer intern" OR "backend intern" OR "developer intern") ("India" OR "Bengaluru" OR "Remote")'
    enabled: true

  - name: Ashby software internships in India
    query: 'site:jobs.ashbyhq.com ("software engineer intern" OR "SDE intern" OR "platform intern") ("India" OR "Remote")'
    enabled: true

  - name: General official internship postings
    query: '("software engineering intern" OR "SDE intern" OR "backend intern") ("India" OR "Bengaluru" OR "Hyderabad") -course -training'
    enabled: true
```

The zero-token `npm run scan` command scans configured providers. It does not
run these WebSearch queries. Ask the AI agent to run Career Ops scan mode when
you want the broader agent-driven search.

## 10. Add direct boards carefully

Each `tracked_companies` entry needs a real careers URL:

```yaml
tracked_companies:
  - name: Microsoft
    careers_url: https://apply.careers.microsoft.com/careers
    provider: microsoft-pcsx
    domain: microsoft.com
    microsoft_pcsx:
      query: "intern"
      location: "India"
    enabled: true
```

Run the portal checks after adding or editing boards:

```bash
npm run validate:portals
npm run verify:portals
```

A reachable board can still belong to the wrong company or return irrelevant
jobs. Audit content as well:

```bash
node audit-portals.mjs --summary
```

Do not remove a company after one timeout, HTTP 403, or HTTP 429. Retry later
and inspect the provider.

## 11. Verify the installation

Run offline checks first:

```bash
npm run doctor -- --cli codex
npm run validate:portals
npm run verify
node tests/providers/microsoft-pcsx.test.mjs
```

If using another AI CLI, replace `codex` in the doctor command.

Test browser extraction with a currently active public posting:

```bash
npm run extract -- "https://official-company-careers.example/job/123"
```

Expected shape:

```json
{
  "url": "https://...",
  "title": "...",
  "text": "..."
}
```

Use a real active URL. Example postings in documentation may expire.

Then run the network checks:

```bash
npm run verify:portals
node audit-portals.mjs --summary
```

Acceptance checklist:

- `cv.md` describes the new candidate, not the previous user
- `config/profile.yml` has correct identity, location, and work authorization
- `modes/_profile.md` scores internships at the candidate's level
- `modes/_brief.md` contains no placeholders
- `portals.yml` includes internship terms
- `portals.yml` does not skip `intern` or `entry`
- private files are ignored by Git
- portal YAML has no validation errors
- pipeline integrity passes
- Chromium extraction works

Check ignored files:

```bash
git check-ignore \
  cv.md \
  config/profile.yml \
  portals.yml \
  modes/_profile.md \
  modes/_brief.md \
  modes/_custom.md \
  data/applications.md \
  data/pipeline.md
```

Each path should print. Do not force-add private files.

## 12. Start the first search

Open the candidate's AI CLI from the Career Ops root.

Cursor can discover `.cursor/skills/career-ops/SKILL.md`. Ask in plain language:

```text
Read AGENTS.md, .cursor/skills/career-ops/SKILL.md, cv.md,
config/profile.yml, modes/_profile.md, modes/_brief.md, modes/_custom.md,
and portals.yml. Verify that the setup targets internships rather than senior
roles. Do not generate documents or submit anything.
```

Codex:

```bash
codex
```

First Codex prompt:

```text
Read AGENTS.md, .agents/skills/career-ops/SKILL.md, cv.md,
config/profile.yml, modes/_profile.md, modes/_brief.md, modes/_custom.md,
and portals.yml. Run Career Ops tracker mode and summarize the empty or existing
tracker. Verify that internship titles are allowed. Do not generate a CV, cover
letter, email, message, referral request, or application. Do not submit or send
anything.
```

Run a bounded scan:

```text
Run Career Ops scan mode using portals.yml. Search only for internships matching
the candidate's target roles, graduation window, locations, and work
authorization. Cap the run at 50 new listings. Deduplicate against
data/scan-history.tsv, data/pipeline.md, and data/applications.md. Verify stale
search results before adding them. Do not generate documents or submit
applications.
```

For only the configured zero-token providers:

```bash
npm run scan
```

For extra stale-posting protection:

```bash
node scan.mjs --verify
```

Inspect pending jobs:

```bash
rg '^- \[ \]' data/pipeline.md
```

## 13. Evaluate and shortlist internships

Do not run a large pipeline immediately. First inspect whether the scan found
the right level, discipline, location, and graduation window.

Then ask:

```text
Run Career Ops pipeline mode for pending entries in data/pipeline.md. Use full
job descriptions. Evaluate against internship expectations and the candidate's
verified CV. Treat graduation dates, enrollment requirements, location, and
work authorization as eligibility gates. Do not generate a CV, cover letter,
email, message, referral request, or application. Do not submit or send
anything. Present the ranked shortlist first.
```

The pipeline should:

1. Check whether each posting is still live.
2. Extract the full job description.
3. Reject hard eligibility mismatches with a recorded reason.
4. Evaluate skill evidence from the candidate's CV and projects.
5. Write a report for viable roles.
6. Update the tracker through the project's merge scripts.
7. Present the strongest matches for human review.

For internship evaluations, inspect:

- Enrollment and graduation-year requirements
- Internship dates and duration
- Work authorization and sponsorship
- Location and in-office requirements
- Required coursework or languages
- Required versus preferred technical skills
- Evidence in projects, coursework, research, or prior internships
- Posting legitimacy and official application URL

A missing preferred framework is often bridgeable. A mismatched graduation
window or explicit work-authorization restriction usually is not.

## 14. Prepare one application at a time

After the candidate selects a role:

```text
Prepare the application for report NNN. Re-open the live posting and compare it
with cv.md. Show every proposed CV change in chat first. Preserve facts exactly.
Do not create a file until I approve the changes. Do not submit the application.
```

Review:

- Every claim and metric
- Degree, GPA, and graduation date
- Project technologies
- Availability dates
- Work authorization
- Contact details and links
- Keywords added from the posting

Keywords may be reformulated, but skills cannot be fabricated. If the posting
asks for Kubernetes and the candidate only used Docker, the CV must not claim
Kubernetes.

The candidate should submit through the employer's official careers site. Avoid
duplicate applications through both an agency and the direct employer unless
the employer instructs otherwise.

## 15. Track the search

Useful commands:

```text
Run Career Ops tracker mode and show applications requiring action.
Run Career Ops followup mode and show overdue follow-ups.
Run Career Ops patterns mode after enough outcomes exist.
Run Career Ops upskill mode and summarize recurring skill gaps.
```

Use canonical tracker states:

```text
Evaluated
Applied
Responded
Interview
Offer
Hired
Rejected
Discarded
SKIP
```

Use the provided status script instead of hand-editing tracker rows:

```bash
node set-status.mjs <report-number-or-company> Applied --note "Applied through official careers site"
```

Run the integrity check after batch changes:

```bash
npm run verify
```

## 16. A practical weekly routine

Twice each week:

1. Run the configured provider scan.
2. Run the broader agent scan if needed.
3. Review pending titles before spending model tokens.
4. Evaluate viable postings using full job descriptions.
5. Select a small number of strong matches.
6. Tailor and review one application at a time.
7. Record the application immediately.

Once each week:

1. Review follow-ups.
2. Check for replies and interview requests.
3. Review rejection patterns.
4. Inspect recurring skill gaps.
5. Improve one project, proof point, or interview story based on real evidence.
6. Back up private user-layer files.

Apply early when a posting is a strong match. Do not trade accuracy for volume.

## 17. Preserved changes in this copy

The source directory had no `.git` metadata, so an exact commit-level diff
against upstream was unavailable during sanitization. This list comes from its
handoff documents and the files that were retained.

### Internship targeting and safety

- `modes/_profile.md` contains internship-level evaluation rules without
  candidate facts.
- `modes/_brief.md` is an empty internship triage template.
- `modes/_custom.md` prevents document generation during initial scanning,
  requires approval before tailored documents, caps unattended scans at 50,
  and forbids sending or submitting.
- `portals.yml` retains the expanded direct-company and multi-employer board
  list while replacing senior-role filters with internship terms.
- `config/companies-discover.yml` retains the reusable company list used for ATS
  discovery.

### Microsoft careers provider

- `providers/microsoft-pcsx.mjs` adds zero-auth scanning for Microsoft's public
  PCSX search API.
- It paginates the server-capped 10-row responses.
- It normalizes title, URL, location, and posting date.
- It restricts requests to `https://apply.careers.microsoft.com`.
- It supports optional query and location filters.
- `tests/providers/microsoft-pcsx.test.mjs` tests detection, host rejection,
  URL construction, parsing, and malformed records.
- `docs/SUPPORTED_JOB_BOARDS.md` documents the provider.

This addition is directly useful for internship searches. Configure its query
as `intern` and set the candidate's location.

### Pipeline helper scripts

- `scripts/extract-pending-jds.mjs` extracts and caches full job descriptions
  for pending pipeline URLs.
- `scripts/pipeline-sweep.mjs` applies liveness results and local pre-screen
  rules to the pipeline.
- `scripts/write-pipeline-report.mjs` reserves a report number, writes a report,
  creates a tracker TSV addition, and marks the pipeline row processed.

The source workspace also had `scripts/bulk-eval-pipeline.mjs`. This copy omits
it because it hard-coded one candidate's skills, evidence, salary range,
seniority, geography, preferred companies, and scoring boosts. Use the normal
Career Ops evaluation modes with full job descriptions.

### Removed private and generated state

This copy excludes the previous candidate's CV, profile, reports, cached job
descriptions, scan history, application tracker rows, pipeline results, batch
tracker additions, and handoff documents. The tracker and pipeline start empty.

## 18. Privacy and Git rules

Never commit:

```text
cv.md
config/profile.yml
portals.yml
modes/_profile.md
modes/_brief.md
modes/_custom.md
data/
reports/
jds/
output/
documents/
interview-prep/
```

Some repositories may intentionally track templates or `.gitkeep` files under
those directories. Check `.gitignore` and `git status` before every commit.

Never run:

```bash
git add -f cv.md
git add -f config/profile.yml
git add -f portals.yml
git add -f data
git add -f reports
```

Personal data sent to an AI CLI may be processed by that CLI's model provider.
Review the provider's privacy and retention settings. Do not place passwords,
session cookies, government IDs, or portal credentials in Career Ops files.

## 19. Updating safely

Before an update:

1. Back up the user layer.
2. Run `git status --short`.
3. Confirm private files remain ignored.
4. Review local source changes.
5. Run the update check.

```bash
npm run update:check
```

Apply an approved update:

```bash
npm run update
```

After updating:

```bash
npm install
npm run validate:portals
npm run verify
node tests/providers/microsoft-pcsx.test.mjs
```

If using a fork, commit reusable source changes separately from private user
data. The Microsoft provider and generic helper scripts belong on source
branches. Candidate data does not.

## 20. Troubleshooting

### The scan finds no internships

Inspect `portals.yml`:

```bash
rg -n 'skip_tiers|Intern|Internship|Junior|Graduate|positive:|negative:' portals.yml
```

Confirm `skip_tiers` does not contain `intern` or `entry`. Confirm internship
terms are positive rather than negative.

Then run:

```bash
npm run validate:portals
npm run verify:portals
```

### The scan returns senior jobs

Add senior titles to `title_filter.negative`. Keep the positive list narrow.
Do not rely on the evaluation phase to clean up a bad discovery filter.

### A remote internship is not actually available in the candidate's country

Read the full description. "Remote" often means remote within one country.
Keep the country-eligibility filter enabled and mark the role ineligible if the
posting explicitly excludes the candidate's location or work authorization.

### Chromium is missing

```bash
npx playwright install chromium
npm run doctor -- --cli codex
```

### The AI scores against the wrong seniority

Check `modes/_profile.md` and `modes/_brief.md`. Remove the shipped senior
archetypes and template placeholders. Tell the agent to score against internship
requirements.

### The pipeline has nothing to process

```bash
rg '^- \[ \]' data/pipeline.md
```

If no rows appear, run a scan or paste official posting URLs under `## Pending`.

### A posting is expired

```bash
node check-liveness.mjs "https://official-posting-url"
```

Do not evaluate an expired role from a search-engine cache.

### The tracker fails integrity checks

```bash
npm run normalize
npm run dedup
npm run reconcile
npm run verify
```

Review each command's output before accepting changes.

## 21. Final setup report

Record these facts after setup:

```text
Repository path:
Source: public release or customized workspace
Git branch and remote:
Node version:
npm version:
AI CLI and version:
Chromium installed:
Doctor result:
Portal validation result:
Pipeline verification result:
Microsoft provider test result:
Browser extraction result:
Candidate CV created:
Profile personalized:
Internship scoring profile personalized:
Internship portal filters verified:
Private files ignored:
Initial scan count:
Pending shortlist count:
Remaining problems:
```

Setup is complete only when the candidate's own facts are present, template
content is gone, internship terms are allowed, private files are ignored, and
the verification commands pass.
