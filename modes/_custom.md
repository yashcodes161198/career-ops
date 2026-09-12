# Custom Instructions -- career-ops

## House Rules

- During scanning and initial evaluation, do not generate a CV or cover letter.
- Generate a tailored CV only after showing the fit score and receiving explicit approval.
- Generate a cover letter only when the job requests one and the candidate explicitly approves it.
- Prefer reusing an existing role-specific CV when it already matches the posting closely.
- Never invent skills, experience, dates, qualifications, compensation, work authorization, or personal details.
- Cap unattended scans at 50 new listings per run.

## Custom Workflows

- "daily search": scan configured sources (senior **and mid-level** engineering titles per `portals.yml`), deduplicate results, evaluate only the strongest matches, and present a shortlist without generating documents.
- "prepare application": verify the posting is live, evaluate fit, ask for approval, then create only the approved documents.

## Output Preferences

- Write candidate-facing output in English.
- Lead each evaluation with the fit score, hard blockers, and a one-sentence recommendation.
- Explain which source found each job and preserve the original posting URL.

## Off-Limits

- Do not submit an application unless the user has explicitly authorized submit for that session (default: fill and preview only).
- Never send a message, email, referral request, or follow-up without explicit approval.
- Never automate activity on LinkedIn.
- Never store passwords or copy authenticated browser sessions.

## Portal Accounts (Yash)

| Portal | Email | Notes |
|--------|-------|-------|
| Instahyre | `yashcodes161198@gmail.com` | Skip Instahyre postings unless the user overrides for a specific role. |
| Greenhouse / most ATS forms | `yashk.code@gmail.com` | From `config/profile.yml`; use for OTP during active Greenhouse applies. |

## Browser Apply Workflow (Cursor)

Use this when filling ATS forms in the **Cursor browser panel** (not a headless or off-screen Playwright window the user cannot see).

### Make the page visible first

1. Open the posting URL with `cursor-app-control` → `open_resource` (or navigate the **Glass** browser tab — `glass-browser-*`, not `stable-browser-session`).
2. Scroll to **“Apply for this job”** — on Greenhouse the form sits **below** a long JD; the top of the page looks empty of fields.
3. Confirm the user sees the form (**“I see it”**) before filling. A reload or wrong tab wipes fields silently.

### Fill order

1. Text fields from `config/profile.yml` and the evaluation report (never invent facts).
2. Greenhouse **react-select** dropdowns: click **Toggle flyout**, then click the option — do **not** use `browser_select_option`.
3. **Location (City)**: type `Bengaluru, Karnataka, India` and pick the autocomplete option (Clear selections appears when set).
4. **Resume/CV — mandatory handoff:** click **Attach**, then **wait for the user**. The agent cannot operate the Windows file picker. Do not attempt Playwright `setInputFiles` in a separate window. User uploads `Resume/Yash_Resume.pdf`, replies **“done”**, then the agent may click **Submit application**.
5. After Greenhouse confirmation URL (`/confirmation`), update the tracker: `node set-status.mjs <#> Applied --note "Applied via Greenhouse …"`.

### Sezzle / similar Greenhouse (India) defaults (when report silent)

| Field | Value |
|-------|-------|
| Work auth India | Yes |
| City | Bengaluru |
| 8+ years | No |
| Full-stack years | 4 |
| Bachelor's CS | Yes · IIT Ropar |
| GPA | NA |
| Salary (USD/mo gross) | 6000 |
| Heard via | LinkedIn |
| English | C1 |

### Lessons (2026-09-08)

- Filling a hidden automation tab while the user watches an empty Glass tab causes “I don’t see it” — always fill the tab the user sees.
- Dropdown overlays block clicks; use `scrollIntoView` and offset clicks for long lists (e.g. GPA → NA).
- Instahyre one-click apply works with the Instahyre account; Greenhouse needs the profile email + optional OTP from Gmail during apply.
