# HELIO AI Specification

## 1. Product Summary

HELIO AI is an offline, CPU-first community health and emergency triage assistant. It converts unstructured patient information into structured records for safer referral and follow-up.

## 2. Goals

- Convert typed symptoms, voice transcripts, and image category hints into structured JSON.
- Run core processing on CPU without network access.
- Detect emergency red flags without pretending to diagnose disease.
- Generate a referral note suitable for a health worker or clinic.
- Store records locally with privacy-first defaults.
- Keep the MVP realistic enough to demo before lunch.

## 3. Non-Goals

- No disease diagnosis.
- No cloud inference.
- No online storage.
- No replacement for a doctor or emergency service.
- No broad medical claims beyond first-aid and referral guidance.

## 4. Users

- ASHA/community health workers
- Rural clinics
- Families
- NGOs
- Disaster relief teams
- Mobile health camps

## 5. Inputs

| Input | Phase 1 Design | MVP Priority |
| --- | --- | --- |
| Manual notes | Free-text symptoms and patient context | Must have |
| Voice | Local speech-to-text using Whisper.cpp Tiny Q4 | Should have |
| Image | Local wound/rash/burn/document category hint using ONNX CPU | Could have |
| Existing records | JSON import of demo records | Must have |

## 6. Outputs

- Structured patient JSON
- Triage level: `Low`, `Medium`, `High`, `Urgent`
- Red flags array
- Conservative first-aid instructions
- Recommended action
- Referral note
- Local record ID and timestamp

## 7. Functional Requirements

### FR1: Structured Record Extraction

Given unstructured notes, HELIO AI must produce JSON with:

- `patient_name`
- `age`
- `gender`
- `symptoms`
- `duration`
- `triage_level`
- `recommended_action`
- `first_aid`
- `red_flags`
- `confidence`

### FR2: Offline Triage Rule Engine

The app must apply deterministic red-flag rules locally. Rules must override LLM output when safety requires escalation.

### FR3: Referral Note Generation

The app must generate a referral note containing patient details, symptoms, duration, urgency, red flags, first aid given, and generated timestamp.

### FR4: Local Persistence

The app must save records to SQLite. MVP can use plain SQLite with a documented path; post-MVP should add encryption.

### FR5: Offline Demo Mode

The demo must include sample records and a clear way to run with network disabled.

## 8. Non-Functional Requirements

- CPU-only inference.
- Works without internet for core workflow.
- Uses free and open source software.
- Strong copyleft license.
- Data remains local.
- Clear medical safety disclaimer in UI/CLI output.
- Structured output must be deterministic enough for testing.

## 9. Architecture

```text
Manual Notes / Voice / Image
        |
        v
Input Normalizer
        |
        +--> Whisper.cpp Tiny Q4 for voice transcript
        |
        +--> ONNX MobileNetV3 INT8 for image category hint
        |
        v
Local Text Structurer
TinyLlama/Phi GGUF via llama.cpp
        |
        v
JSON Validator
        |
        v
Medical Red-Flag Rule Engine
        |
        v
SQLite + Referral Note Export
```

## 10. Safety Rules Draft

| Trigger | Triage | Required Message |
| --- | --- | --- |
| difficulty breathing | Urgent | Seek immediate medical attention |
| chest pain | Urgent | Seek immediate medical attention |
| unconscious or fainting | Urgent | Seek immediate medical attention |
| heavy bleeding | Urgent | Apply pressure and seek immediate medical attention |
| severe burn or burn on face/genitals/large area | Urgent | Cool burn and seek immediate medical attention |
| fever plus confusion | Urgent | Seek immediate medical attention |
| fever for more than 3 days | Medium/High | Visit Primary Health Centre |
| minor cut without red flags | Low | Clean, cover, monitor |

## 11. MVP Acceptance Criteria

- Runs on a laptop CPU.
- Can process at least 5 realistic sample records.
- Produces valid JSON for every sample.
- Flags urgent examples correctly.
- Saves at least one record locally.
- Generates a readable referral note.
- Demo can be run with network off.

## 12. Demo Dataset Plan

Use synthetic, non-real patient records:

- Child fever and cough for 2 days
- Adult chest pain and sweating
- Minor cut on hand
- Burn from hot water
- Elderly patient with fever and confusion
- Pregnancy-related severe bleeding

## 13. Risks

- Medical safety risk: mitigate with deterministic red-flag rules and non-diagnostic wording.
- Runtime setup risk: keep typed-note flow as the required MVP path.
- Model size risk: choose quantized small models and provide fallback rule-based extraction for demo.
- Time risk: prioritize structured JSON and referral note before voice/image.

## 14. Open Decisions

- Final app surface: PWA, CLI, or both.
- Final model choice: TinyLlama 1.1B GGUF vs Phi-3 Mini GGUF based on local CPU performance.
- Whether SQLite encryption is included in MVP or documented for Phase 3.
