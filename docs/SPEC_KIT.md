# Spec Kit

This spec kit summarizes the artifacts judges should inspect for Phase 1.

## Problem

Community health workers in low-connectivity areas need a fast way to convert messy patient information into a structured referral record.

## Proposed Solution

HELIO AI runs local CPU inference and a deterministic triage rule engine to convert notes, voice, and image hints into structured data, then saves the record locally and generates a referral note.

## Core Demo Promise

With the network off, the app can:

- Accept a patient note.
- Generate structured JSON.
- Detect emergency red flags.
- Produce first-aid guidance and recommended action.
- Save/export the record locally.

## Required Models and Runtimes

- `llama.cpp` with TinyLlama 1.1B GGUF or Phi-3 Mini GGUF for structuring.
- `whisper.cpp` Tiny Q4 for speech-to-text.
- ONNX Runtime CPU with MobileNetV3 INT8 for image category hints.
- SQLite for local records.

## MVP Priority

1. Typed-note to JSON.
2. Red-flag triage rules.
3. Referral note.
4. SQLite save.
5. Voice transcript.
6. Image category hint.
7. PDF/QR export.

## Definition of Done for Phase 1

- README explains the project clearly.
- `SPEC.md` documents requirements and architecture.
- `docs/ISSUES.md` lists issues with assignee, estimate, and due date.
- `docs/WORK_DIVISION.md` assigns team work.
- Strong copyleft license is present.
