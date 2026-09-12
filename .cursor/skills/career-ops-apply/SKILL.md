---
name: career-ops-apply
description: >-
  Fill and submit job applications in the Cursor browser panel (Greenhouse, Lever,
  etc.). Use when the user asks to apply, fill an ATS form, upload a resume, or
  continue an in-progress application in the visible Cursor browser.
---

# career-ops — Cursor Browser Apply

Read `modes/_custom.md` (Browser Apply Workflow) and `config/profile.yml` before acting.

## Hard rules

1. **Visible browser only** — navigate/fill the **Glass** browser tab (`glass-browser-*`). Never fill `stable-browser-session` or a Playwright window the user cannot see.
2. **Show the page first** — `open_resource` with the posting URL; scroll to **“Apply for this job”**; wait for user confirmation before filling.
3. **Resume handoff** — click **Attach**, then **wait for the user**. Do not try to upload the file yourself. Path to tell the user: `{PROJECT_ROOT}/Resume/Yash_Resume.pdf`. Proceed to submit only after they say **“done”**.
4. **Submit** — only when the user has authorized submit for the session and every required field (including resume) is complete.
5. **Tracker** — after `/confirmation` (or equivalent): `node set-status.mjs <report#> Applied --note "…"`.

## Greenhouse checklist

- [ ] First / Last / Email / Phone from `config/profile.yml`
- [ ] Country → India (+91)
- [ ] Location → `Bengaluru, Karnataka, India` (autocomplete)
- [ ] Dropdowns via Toggle flyout + option click
- [ ] Attach clicked → **wait for user**
- [ ] Submit application → verify confirmation URL

## Accounts

- **Instahyre:** `yashcodes161198@gmail.com` — skip unless user overrides.
- **Greenhouse / ATS:** `yashk.code@gmail.com`

## Anti-patterns (learned 2026-09-08)

| Don't | Do instead |
|-------|------------|
| Fill hidden automation tab | Fill Glass tab user is watching |
| `browser_select_option` on react-select | Toggle flyout → click option |
| Playwright `setInputFiles` in headed Chrome | Click Attach → wait for user |
| Submit before resume attached | Attach → wait for **“done”** → Submit |
| Assume form visible at page top | Scroll to **Apply for this job** |
