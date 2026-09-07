# Career Ops handoff to another computer

This guide moves the current Career Ops workspace to another computer without
losing private profile data, scanner configuration, reports, or application
history.

## Current workspace

- Current path: `/Users/yash/Documents/DDIA2/career-ops`
- Career Ops version: `1.32.0`
- Runtime used here: Node.js 24
- Recommended minimum runtime: Node.js 22.5
- Current pipeline: 0 pending jobs
- Processed in the latest run: 144 jobs
- Evaluation reports: 111 files in `reports/`
- Tracker: `data/applications.md`
- AI CLI on the new computer: Codex CLI

No API key is currently stored in this workspace.

## Why a normal Git clone is not enough

Career Ops intentionally excludes personal and generated files from Git. A
fresh clone from `career-ops-hq/career-ops` will not contain:

- `cv.md`
- `config/profile.yml`
- `portals.yml`
- `modes/_profile.md`
- `modes/_custom.md`
- `data/`
- `reports/`
- `jds/`

This workspace also has local source changes for direct company-board scanning,
including the Microsoft PCSX provider and batch pipeline helpers. They have not
been committed to a separate fork.

Transfer the existing workspace. Do not replace it with a fresh upstream clone.

## Step 1: create a transfer archive on the current computer

Close any Career Ops scan or pipeline process first.

Open Terminal and run:

```bash
cd /Users/yash/Documents/DDIA2

tar \
  --exclude='career-ops/node_modules' \
  --exclude='career-ops/.playwright-mcp' \
  --exclude='career-ops/test-results' \
  --exclude='career-ops/playwright-report' \
  --exclude='career-ops/.DS_Store' \
  -czf career-ops-handoff-2026-09-07.tar.gz \
  career-ops

shasum -a 256 career-ops-handoff-2026-09-07.tar.gz \
  > career-ops-handoff-2026-09-07.tar.gz.sha256
```

The archive includes your phone number, email address, CV, salary target,
application history, job reports, and the existing Git metadata. Treat it as a
private document.

Use AirDrop, an encrypted USB drive, or an SSH transfer. Do not upload it to a
public Git repository or a public file-sharing link.

To transfer directly over SSH instead of creating an archive:

```bash
rsync -av \
  --exclude node_modules \
  --exclude .playwright-mcp \
  --exclude test-results \
  --exclude playwright-report \
  /Users/yash/Documents/DDIA2/career-ops/ \
  YOUR_USER@NEW_COMPUTER:~/Documents/career-ops/
```

Replace `YOUR_USER` and `NEW_COMPUTER` with the destination SSH account and
hostname.

## Step 2: verify the transferred archive

Copy both files to the new computer:

- `career-ops-handoff-2026-09-07.tar.gz`
- `career-ops-handoff-2026-09-07.tar.gz.sha256`

On macOS or Linux:

```bash
shasum -a 256 -c career-ops-handoff-2026-09-07.tar.gz.sha256
```

Linux distributions that do not have `shasum` can use:

```bash
sha256sum -c career-ops-handoff-2026-09-07.tar.gz.sha256
```

The result must say `OK`. If it does not, transfer the archive again.

On Windows PowerShell, print the hash and compare it with the value in the
`.sha256` file:

```powershell
Get-FileHash .\career-ops-handoff-2026-09-07.tar.gz -Algorithm SHA256
Get-Content .\career-ops-handoff-2026-09-07.tar.gz.sha256
```

The two hexadecimal hashes must match.

## Step 3: extract the workspace

Choose a private working directory. The project does not depend on the old
absolute path.

macOS or Linux:

```bash
mkdir -p ~/Documents
tar -xzf career-ops-handoff-2026-09-07.tar.gz -C ~/Documents
cd ~/Documents/career-ops
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\Documents" | Out-Null
tar -xzf .\career-ops-handoff-2026-09-07.tar.gz -C "$HOME\Documents"
Set-Location "$HOME\Documents\career-ops"
```

## Step 4: install prerequisites

Install these on the new computer:

1. Git
2. Node.js 22.5 or newer
3. Codex CLI

Check Node and npm:

```bash
node --version
npm --version
```

Install the current Codex CLI package:

```bash
npm install -g @openai/codex@latest
codex --version
```

If the npm installation reports success but `codex --version` fails because a
platform package is missing, reinstall:

```bash
npm uninstall -g @openai/codex
npm install -g @openai/codex@latest
```

Sign in:

```bash
codex login
```

You can also run `codex` and choose the ChatGPT sign-in option.

## Step 5: install Career Ops dependencies

Run these commands inside the transferred `career-ops` directory:

```bash
npm install
npx playwright install chromium
```

On Linux, Chromium may need operating-system packages:

```bash
npx playwright install chromium --with-deps
```

Do not copy `node_modules` from the old computer. Native dependencies and
Playwright browsers must be installed for the destination operating system.

## Step 6: confirm the private state arrived

Run:

```bash
test -f cv.md
test -f config/profile.yml
test -f portals.yml
test -f modes/_profile.md
test -f modes/_custom.md
test -f data/applications.md
test -f data/pipeline.md
test -f providers/microsoft-pcsx.mjs
```

No output means every file exists.

On Windows PowerShell:

```powershell
@(
  "cv.md",
  "config/profile.yml",
  "portals.yml",
  "modes/_profile.md",
  "modes/_custom.md",
  "data/applications.md",
  "data/pipeline.md",
  "providers/microsoft-pcsx.mjs"
) | ForEach-Object {
  if (-not (Test-Path $_)) { Write-Error "Missing: $_" }
}
```

## Step 7: run setup checks

Run the offline checks first:

```bash
npm run doctor -- --cli codex
npm run validate:portals
npm run verify
node tests/providers/microsoft-pcsx.test.mjs
```

Then run the network health check:

```bash
npm run verify:portals
```

Expected results:

- `cv.md`, `config/profile.yml`, `modes/_profile.md`, and `portals.yml` found
- Chromium installed
- Codex detected
- Portal YAML has no validation errors
- Microsoft PCSX provider tests pass
- Most configured company boards report live

A Playwright MCP warning is not fatal if `browser-extract.mjs` and the
Chromium installation work. Test the local extractor:

```bash
npm run extract -- "https://jobs.lever.co/everbridge/ff6eacff-741a-4f60-aff4-a45e89b003a9"
```

The command should return JSON with `url`, `title`, and `text`.

## Step 8: start Career Ops with Codex

From the project directory:

```bash
cd ~/Documents/career-ops
codex
```

Give Codex this first prompt:

```text
Read AGENTS.md and .agents/skills/career-ops/SKILL.md. Then run the
Career Ops tracker mode and summarize data/applications.md. Do not generate a
CV, cover letter, email, message, or application.
```

Codex may not register `/career-ops` as a slash command. Plain-language prompts
are supported and are the safer option.

## Step 9: run a new search and pipeline

The transferred pipeline currently has no pending jobs because the previous 144
entries were processed.

First scan for new jobs:

```text
Run the Career Ops scan mode. Use portals.yml, keep the configured 50-listing
cap, deduplicate against history, and do not generate documents or submit
applications.
```

Review the pending section:

```bash
rg '^- \[ \]' data/pipeline.md
```

Then run the pipeline:

```text
Run the Career Ops pipeline mode for all pending entries in data/pipeline.md.
Follow modes/_custom.md. Evaluate and rank jobs, but do not generate a CV,
cover letter, email, message, or application. Process browser-backed pages
sequentially.
```

For a one-shot Codex command:

```bash
codex exec "Run Career Ops pipeline mode for all pending entries in data/pipeline.md. Follow modes/_custom.md. Do not generate CVs, cover letters, emails, messages, or applications."
```

## Step 10: review results before generating documents

Use:

```text
Run Career Ops tracker mode. Show the strongest India-relevant senior backend
roles and identify which reports used incomplete job descriptions.
```

The previous batch used keyword heuristics for many reports. Many scores cluster
at `4.8/5`, and 29 JPMorgan reports used title and location metadata because the
Oracle site did not expose the full job description. Treat those scores as
shortlisting signals, not final decisions.

Read the relevant file in `reports/` and open the live posting before applying.

Only after choosing a job, ask:

```text
Prepare the application for report 001. Show me the proposed resume changes
before creating any file. Do not submit the application.
```

Your current house rules in `modes/_custom.md` require explicit approval before
Career Ops creates a tailored CV or cover letter.

## Files to back up after every run

At minimum, back up:

```text
cv.md
config/profile.yml
portals.yml
modes/_profile.md
modes/_custom.md
data/
reports/
jds/
providers/microsoft-pcsx.mjs
scripts/bulk-eval-pipeline.mjs
scripts/extract-pending-jds.mjs
scripts/pipeline-sweep.mjs
scripts/write-pipeline-report.mjs
```

The simplest safe backup is another complete archive using the Step 1 command.

## Updating Career Ops later

Do not run `git reset --hard`, `git clean`, or replace this directory with a
fresh clone. Those actions can remove the local Microsoft provider, helper
scripts, or private state.

Before any update:

1. Create a new archive using Step 1.
2. Run `git status --short`.
3. Preserve the local files listed above.
4. Apply the upstream update only after reviewing its diff.
5. Re-run Step 7.

The current `origin` remote points to the public upstream repository:

```text
https://github.com/career-ops-hq/career-ops.git
```

Do not force-add `cv.md`, `config/profile.yml`, `portals.yml`, `data/`, or
`reports/` to a public fork.

## Troubleshooting

### `codex: command not found`

Open a new terminal after installation, then run:

```bash
npm config get prefix
npm install -g @openai/codex@latest
codex --version
```

The npm global binary directory must be on `PATH`.

### Chromium is missing

```bash
npx playwright install chromium
npm run doctor -- --cli codex
```

### The scanner finds zero jobs

```bash
npm run validate:portals
npm run verify:portals
```

Check whether the individual board is empty, unavailable, or has changed ATS
providers. Do not interpret a temporary HTTP error as proof that the company has
no jobs.

### Pipeline has nothing to process

```bash
rg '^- \[ \]' data/pipeline.md
```

If this prints nothing, run the scan mode first.

### Codex tries to generate documents automatically

Stop the run and tell it:

```text
Read modes/_custom.md again. Evaluation only. Do not generate a CV or cover
letter until I explicitly approve a specific report.
```

### Path changed on the new computer

The transferred project uses relative paths. Start Codex from the project root:

```bash
cd /path/to/career-ops
codex
```

Do not set `CAREER_OPS_ROOT` unless you intentionally keep the private data in a
different directory.

