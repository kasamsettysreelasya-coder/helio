# Work Division Plan

## Team Roles

| Role | Owner | Responsibilities |
| --- | --- | --- |
| Product and demo lead | Lasya | Final README, demo story, offline proof, submission checklist |
| Backend and data lead | Teammate 1 | FastAPI/CLI flow, SQLite schema, JSON validation, record export |
| AI pipeline lead | Teammate 2 | llama.cpp prompt, Whisper.cpp path, ONNX Runtime CPU image category path |
| Safety and QA lead | Teammate 3 | Red-flag rule engine, test cases, sample records, audit checklist |

Rename owners to actual team names in GitLab if needed.

## Phase 1 Before 10:00 AM

| Timebox | Owner | Output |
| --- | --- | --- |
| 09:00-09:20 | Product lead | README and project positioning |
| 09:20-09:45 | Backend/data lead | Spec requirements and architecture |
| 09:20-09:45 | AI pipeline lead | Model/runtime declaration |
| 09:45-10:00 | Safety/QA lead | Issues, risks, acceptance criteria |

## Phase 2 MVP Before Lunch

| Workstream | Owner | MVP Output |
| --- | --- | --- |
| Typed-note intake | Backend/data lead | Form or CLI accepts unstructured notes |
| Structured extraction | AI pipeline lead | JSON created by local model or fallback parser |
| Safety rules | Safety/QA lead | Red flags override triage |
| Referral note | Product lead | Human-readable referral note |
| Offline demo | Product lead + all | Wi-Fi off demo on sample records |

## Phase 3 Repo Audit Before 3:00 PM

| Workstream | Owner | Checks |
| --- | --- | --- |
| CI and pre-commit | Backend/data lead | format, lint, type-check, tests |
| Security and dependencies | Safety/QA lead | dependency audit, secret scan, SAST |
| Docs and metadata | Product lead | README, CONTRIBUTING, CHANGELOG, license |
| Local GitLab runner | AI pipeline lead | all checks run locally without fake jobs |

## Handoff Rules

- Keep commits semantic: `docs:`, `feat:`, `test:`, `ci:`, `fix:`.
- Do not add cloud inference to the core path.
- Keep medical wording conservative and non-diagnostic.
- Use synthetic records only for the demo.
- If model runtime setup is delayed, preserve the typed-note plus rule-engine path as the MVP fallback.
