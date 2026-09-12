# Local customizations

This copy keeps reusable changes from the source workspace while removing its
candidate-specific senior-role setup.

## Retained

- `providers/microsoft-pcsx.mjs`
  - Scans Microsoft's public PCSX careers API without authentication.
  - Paginates ten-row API pages.
  - Restricts requests to the trusted Microsoft careers host.
  - Returns normalized title, URL, location, and posting date fields.
- `tests/providers/microsoft-pcsx.test.mjs`
  - Covers provider detection, host validation, URL construction, response
    parsing, and malformed records.
- `docs/SUPPORTED_JOB_BOARDS.md`
  - Documents Microsoft PCSX configuration.
- `config/companies-discover.yml`
  - Keeps the reusable company list for ATS discovery.
- `scripts/extract-pending-jds.mjs`
  - Caches full descriptions for pending jobs.
- `scripts/pipeline-sweep.mjs`
  - Applies liveness results and internship-level pre-screening.
- `scripts/write-pipeline-report.mjs`
  - Writes reports and tracker additions through the normal report-number
    reservation flow.
- `templates/portals.internship.yml`
  - Keeps the expanded source list with internship title filters.
- `modes/_profile.internship.template.md`
- `modes/_brief.internship.template.md`
- `modes/_custom.internship.template.md`
  - Keep internship evaluation and safety defaults outside ignored user files.

## Removed

- Previous candidate CV and profile
- Senior backend, staff, platform, and technical-lead targeting
- Previous compensation and proof-point assumptions
- Application tracker history
- Pipeline history and scan history
- Evaluation reports
- Cached job descriptions
- Generated output
- Batch tracker additions and logs
- Computer-transfer documents
- `scripts/bulk-eval-pipeline.mjs`

The bulk evaluator was removed because it hard-coded one candidate's skills,
evidence, salary, geography, preferred employers, and scoring boosts. The
normal Career Ops modes should evaluate internships from full job descriptions.

## Initialize a candidate

```bash
cp config/profile.example.yml config/profile.yml
cp modes/_profile.internship.template.md modes/_profile.md
cp modes/_brief.internship.template.md modes/_brief.md
cp modes/_custom.internship.template.md modes/_custom.md
cp templates/portals.internship.yml portals.yml
```

Then create `cv.md` with only that candidate's verified facts. The user-layer
files above are ignored by Git.
