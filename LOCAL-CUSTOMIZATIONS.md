# Local customizations

This copy keeps reusable changes from the internship setup while targeting
full-time fresher and entry-level roles instead of internships.

## Retained

- `providers/microsoft-pcsx.mjs`
- `tests/providers/microsoft-pcsx.test.mjs`
- `docs/SUPPORTED_JOB_BOARDS.md`
- `config/companies-discover.yml`
- `scripts/extract-pending-jds.mjs`
- `scripts/pipeline-sweep.mjs` — fresher-level pre-screening (skips senior and internship titles)
- `scripts/write-pipeline-report.mjs`
- `templates/portals.fresher.yml`
- `modes/_profile.fresher.template.md`
- `modes/_brief.fresher.template.md`
- `modes/_custom.fresher.template.md`

## Removed from this copy

- Previous candidate CV and profile
- Internship-specific pipeline and scan history
- Evaluation reports and cached job descriptions

## Initialize a candidate

```bash
cp config/profile.example.yml config/profile.yml
cp modes/_profile.fresher.template.md modes/_profile.md
cp modes/_brief.fresher.template.md modes/_brief.md
cp modes/_custom.fresher.template.md modes/_custom.md
cp templates/portals.fresher.yml portals.yml
```

Then create `cv.md` with only that candidate's verified facts. The user-layer
files above are ignored by Git.
