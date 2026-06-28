# HELIO AI

Offline AI Community Health and Emergency Triage Assistant

**Tagline:** From symptoms to structured care, completely offline and private.

## Idea

HELIO AI is a CPU-first, offline-first assistant for community health workers, rural clinics, health camps, families, NGOs, and disaster relief teams. It converts unstructured patient inputs such as voice notes, typed symptoms, wound photos, prescription images, and report photos into a clean structured health record.

The app does **not** diagnose disease. It documents symptoms, detects emergency red flags using a transparent rule engine, gives conservative first-aid guidance, and generates a referral note that can be carried to a clinic.

## Problem

Many rural and remote communities face delayed care because of poor connectivity, long travel distances, limited doctors, paper-based records, language barriers, and low literacy. Community health workers often spend precious time collecting and rewriting patient information instead of helping the patient.

HELIO AI reduces that documentation burden while keeping patient data on the local device.

## CPU-First Runtime Declaration

All core inference is planned to run on CPU with free and open source runtimes:

| Task | Model | Runtime | CPU Strategy |
| --- | --- | --- | --- |
| Speech to text | Whisper.cpp Tiny Q4 | `whisper.cpp` | Quantized CPU inference |
| Text structuring | TinyLlama 1.1B GGUF or Phi-3 Mini GGUF | `llama.cpp` | GGUF quantized CPU inference |
| Image category hints | MobileNetV3 INT8 | ONNX Runtime CPU | INT8 quantized inference |
| Safety triage | Deterministic medical red-flag rules | Local rule engine | No cloud dependency |

No GPU, CUDA, cloud model API, or network service is required for the core demo.

## Offline-First Scope

The MVP must work with Wi-Fi disabled:

- Input: typed notes first, with voice and image paths prepared for MVP.
- Processing: local CPU model/runtime and deterministic rule engine.
- Storage: encrypted local SQLite database.
- Output: structured JSON, urgency level, first-aid checklist, and referral card.
- Export: JSON file first, PDF/QR if time allows.

## Structured Output

```json
{
  "patient_name": "Lakshmi",
  "age": 42,
  "gender": "Female",
  "symptoms": ["Fever", "Cough"],
  "duration": "3 days",
  "triage_level": "Medium",
  "recommended_action": "Visit Primary Health Centre within 24 hours",
  "first_aid": ["Drink plenty of fluids", "Take adequate rest"],
  "red_flags": [],
  "confidence": 0.89
}
```

## Emergency Red Flags

HELIO AI marks cases as urgent when it detects combinations or direct reports such as:

- Difficulty breathing
- Chest pain
- Unconsciousness
- High fever with confusion
- Heavy bleeding
- Deep wounds
- Severe burns
- Seizure
- Severe dehydration signs

Urgent output always says: **Seek immediate medical attention.**

## Proposed User Workflow

1. Open app.
2. Choose language.
3. Enter notes, record voice, or capture image.
4. Run offline CPU processing.
5. Generate structured health record.
6. Detect red flags.
7. Show safe first-aid guidance.
8. Generate referral note.
9. Save locally in SQLite.

## Tech Stack

- Frontend: React Native or web PWA
- Backend/API: FastAPI
- Database: SQLite
- Speech: `whisper.cpp`
- LLM: `llama.cpp`
- Vision: ONNX Runtime CPU
- Packaging target for MVP: local web/PWA demo or CLI fallback

## Phase Plan

### Phase 1: Plan and Spec

- README with idea and CPU/offline declaration
- `SPEC.md` with requirements and architecture
- `docs/ISSUES.md` with assignee, estimate, and due date
- `docs/WORK_DIVISION.md` with ownership plan
- Strong copyleft `LICENSE`

### Phase 2: MVP

- Build working offline demo on sample health records.
- Produce structured JSON and referral note.
- Demonstrate no network dependency during the core workflow.

### Phase 3: Repo Audit

- Add metadata, `CONTRIBUTING.md`, `CHANGELOG.md`, pre-commit, CI, formatting, lint, type-check, tests, dependency audit, security scan, and local GitLab runner checks.

## License

This project is licensed under the GNU Affero General Public License v3.0. See [LICENSE](LICENSE).
