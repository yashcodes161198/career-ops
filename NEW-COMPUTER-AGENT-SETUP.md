# New computer agent setup instructions

## Mission

Set up this transferred Career Ops workspace inside the user's existing clone of
their GitHub fork. Preserve the destination clone's `.git` directory and remote
configuration. Restore the transferred configuration and private state, install
machine-specific dependencies, verify the scanners, and stop before running a
new job scan unless the user asks for one.

Do not generate a resume, cover letter, email, referral message, or application.
Do not submit or send anything.

## What the user will provide

The user will copy these files to the new computer:

```text
career-ops-transfer.zip
career-ops-transfer.zip.sha256
```

The ZIP is created from the working Career Ops directory. It excludes:

```text
node_modules/
.git/
.playwright-mcp/
test-results/
playwright-report/
```

It includes:

- Career Ops source files
- Local company-board scanner changes
- Microsoft PCSX provider
- User CV and profile
- Portal configuration
- Search history
- Application tracker
- Cached job descriptions
- 111 evaluation reports
- Pipeline helper scripts

The ZIP contains personal information. Do not upload it, its extracted private
files, or its contents to a public repository.

## Destination assumptions

The destination computer already has a clone of the user's Career Ops fork.
Call its absolute path `DESTINATION_REPO`.

Examples:

```text
/Users/yash/Documents/career-ops
/home/yash/projects/career-ops
C:\Users\yash\Documents\career-ops
```

Do not assume the old path `/Users/yash/Documents/DDIA2/career-ops` exists.
Career Ops uses project-relative paths.

## Phase 1: inspect the destination clone

Change into the destination clone:

```bash
cd DESTINATION_REPO
```

Record its current state:

```bash
git status --short
git branch --show-current
git remote -v
```

If the destination has uncommitted work that did not come from this transfer,
stop and ask the user whether to commit or back it up. Do not overwrite
unrelated changes.

The destination `.git` directory belongs to the user's fork and must survive.
Never delete it and never replace it with Git metadata from the source computer.

## Phase 2: verify the ZIP

On macOS:

```bash
cd /path/containing/the/zip
shasum -a 256 -c career-ops-transfer.zip.sha256
```

On Linux:

```bash
cd /path/containing/the/zip
sha256sum -c career-ops-transfer.zip.sha256
```

On Windows PowerShell:

```powershell
Get-FileHash .\career-ops-transfer.zip -Algorithm SHA256
Get-Content .\career-ops-transfer.zip.sha256
```

The hashes must match. Stop if they do not.

## Phase 3: overlay the ZIP onto the fork clone

First create a destination backup:

```bash
cd "$(dirname "DESTINATION_REPO")"
cp -R "DESTINATION_REPO" "career-ops-before-transfer-backup"
```

If the repository is too large for a full copy, at minimum save its Git state:

```bash
cd DESTINATION_REPO
git status --short > ../destination-status-before-transfer.txt
git diff > ../destination-changes-before-transfer.patch
```

Extract the ZIP directly into the root of the existing fork clone:

```bash
unzip -o /path/to/career-ops-transfer.zip -d DESTINATION_REPO
```

The archive contains root-relative entries such as `cv.md`, `providers/`, and
`data/`. It must not create `DESTINATION_REPO/career-ops/career-ops`.

After extraction:

```bash
cd DESTINATION_REPO
git remote -v
```

Confirm the remote still points to the user's fork. If it changed, stop. The ZIP
was built incorrectly and may have included `.git`.

## Phase 4: verify transferred files

Check the essential private files:

```bash
test -f cv.md
test -f config/profile.yml
test -f portals.yml
test -f modes/_profile.md
test -f modes/_custom.md
test -f data/applications.md
test -f data/pipeline.md
```

Check the custom scanner and helper files:

```bash
test -f providers/microsoft-pcsx.mjs
test -f tests/providers/microsoft-pcsx.test.mjs
test -f scripts/bulk-eval-pipeline.mjs
test -f scripts/extract-pending-jds.mjs
test -f scripts/pipeline-sweep.mjs
test -f scripts/write-pipeline-report.mjs
test -f config/companies-discover.yml
```

Check current workflow state without printing personal file contents:

```bash
find reports -maxdepth 1 -name '*.md' | wc -l
grep -c '^- \[ \]' data/pipeline.md || true
grep -c '^- \[x\]' data/pipeline.md || true
```

Expected:

- 111 report files
- 0 pending pipeline entries
- 144 processed pipeline entries

The processed count includes evaluated, pre-screened, and expired entries.

## Phase 5: protect private files from Git

Verify that Git ignores private state:

```bash
git check-ignore \
  cv.md \
  config/profile.yml \
  portals.yml \
  modes/_profile.md \
  modes/_custom.md \
  data/applications.md \
  data/pipeline.md \
  reports/001-everbridge-2026-09-07.md
```

Every path should be printed. If any path is missing from the output, inspect
`.gitignore` before continuing.

Never run:

```bash
git add -f cv.md
git add -f config/profile.yml
git add -f portals.yml
git add -f data
git add -f reports
```

Do not commit private state even if the fork is private. Removing personal data
from Git history later is difficult and error-prone.

## Phase 6: inspect source changes

Run:

```bash
git status --short
```

The transferred workspace is expected to contain these source-level changes:

```text
docs/SUPPORTED_JOB_BOARDS.md
HANDOFF-TO-ANOTHER-COMPUTER.md
NEW-COMPUTER-AGENT-SETUP.md
config/companies-discover.yml
providers/microsoft-pcsx.mjs
scripts/bulk-eval-pipeline.mjs
scripts/extract-pending-jds.mjs
scripts/pipeline-sweep.mjs
scripts/write-pipeline-report.mjs
tests/providers/microsoft-pcsx.test.mjs
```

Some may already be committed in the user's fork. That is fine. Do not discard
or reset them.

## Phase 7: install the runtime

Required:

- Git
- Node.js 22.5 or newer
- npm
- One supported AI coding CLI, preferably Codex

Check versions:

```bash
git --version
node --version
npm --version
```

If Node.js is older than 22.5, install a current Node.js LTS release before
continuing.

Install Codex if it is not available:

```bash
npm install -g @openai/codex@latest
codex --version
```

Authenticate:

```bash
codex login
```

Do not copy Codex login tokens from the old computer.

## Phase 8: install project dependencies

From `DESTINATION_REPO`:

```bash
npm install
npx playwright install chromium
```

On Linux, install Chromium system dependencies if required:

```bash
npx playwright install chromium --with-deps
```

Do not copy `node_modules` or Playwright browser binaries from another
operating system.

## Phase 9: run offline verification

Run:

```bash
npm run doctor -- --cli codex
npm run validate:portals
npm run verify
node tests/providers/microsoft-pcsx.test.mjs
```

Required outcomes:

- Career Ops detects `cv.md`
- Career Ops detects `config/profile.yml`
- Career Ops detects `modes/_profile.md`
- Career Ops detects `portals.yml`
- Dependencies are installed
- Chromium is installed
- Portal validation reports zero errors
- Pipeline integrity passes
- Microsoft PCSX provider tests pass

A warning that Playwright MCP is not configured is acceptable if the local
browser extractor passes in the next phase.

## Phase 10: test the local browser extractor

Use a public job posting:

```bash
npm run extract -- \
  "https://jobs.lever.co/everbridge/ff6eacff-741a-4f60-aff4-a45e89b003a9"
```

Expected output is JSON containing:

```json
{
  "url": "https://...",
  "title": "...",
  "text": "..."
}
```

If Chromium is missing:

```bash
npx playwright install chromium
```

Then retry.

## Phase 11: run network verification

Run:

```bash
npm run verify:portals
```

The previous machine reported 48 live sources and one live-but-empty source.
Counts may change as companies open, close, or migrate job boards.

Treat HTTP 403, 429, maintenance, or timeout responses as temporary failures.
Do not delete a configured company from `portals.yml` based on one failed
health check.

## Phase 12: start the AI workflow

Start Codex in the repository root:

```bash
cd DESTINATION_REPO
codex
```

Use this first prompt:

```text
Read AGENTS.md, .agents/skills/career-ops/SKILL.md,
modes/_profile.md, modes/_custom.md, cv.md, and config/profile.yml.
Run Career Ops tracker mode and summarize the existing tracker.
Do not generate a CV, cover letter, email, referral message, or application.
Do not submit or send anything.
```

Codex may not register `/career-ops` as a slash command. Use plain-language
mode requests.

## Phase 13: understand the existing state

The transferred pipeline has already processed its previous 144 entries. A
pipeline command will have no work until a new scan adds jobs.

The latest run produced:

- 111 evaluated jobs
- 32 pre-screen skips
- 1 expired posting
- 0 pending jobs

Many batch scores cluster at `4.8/5` because that batch used keyword heuristics.
Twenty-nine JPMorgan reports used title and location metadata because the Oracle
site did not expose the full job description. Do not treat those reports as
final application recommendations.

For future jobs, require full job-description evaluation.

## Phase 14: run a new scan only when requested

When the user asks for a scan, use:

```text
Run Career Ops scan mode using portals.yml. Keep the configured 50-new-listing
cap. Deduplicate against data/scan-history.tsv and data/applications.md. Do not
generate documents and do not submit applications.
```

After the scan:

```bash
grep '^- \[ \]' data/pipeline.md
```

Present the pending jobs to the user before starting a large pipeline run.

## Phase 15: run a new pipeline only when requested

Use:

```text
Run Career Ops pipeline mode for all pending entries in data/pipeline.md.
Follow modes/_custom.md. Use the full job description for each evaluation.
Do not use keyword-only scores. Process browser-backed pages sequentially.
Do not generate a CV, cover letter, email, referral message, or application.
Do not submit or send anything.
```

For a one-shot Codex run:

```bash
codex exec "Run Career Ops pipeline mode for all pending entries in data/pipeline.md. Follow modes/_custom.md. Use full job descriptions, not keyword-only scoring. Do not generate or submit anything."
```

## Phase 16: final acceptance report

Report these results to the user:

1. Destination repository path
2. Git branch and fork remote
3. Node.js, npm, and Codex versions
4. Whether `npm install` and Chromium installation succeeded
5. Doctor result
6. Portal YAML validation result
7. Pipeline integrity result
8. Microsoft PCSX test result
9. Browser extractor result
10. Portal health summary
11. Report, pending, and processed counts
12. Any failures that still require action

Do not run a job scan, pipeline, PDF generation, or application workflow as
part of setup unless the user explicitly asks.

