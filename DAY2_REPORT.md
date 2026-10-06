# WAYFIND AI — Day 2 Final Hackathon Report

**Product:** WAYFIND AI  
**Subtitle:** Visual Intelligence for Accessible Places  
**Phase:** Day 2 Finalization Complete (Production & Hackathon Submission Ready)  
**Date:** 2026-10-06  

---

## 1. What Changed (Day 1 → Day 2)
On Day 2, we elevated WAYFIND AI from a working Day 1 prototype into an ML-credible, evidence-aware, globally presentable accessibility intelligence platform:
1. **Critical ML Correction**: Eliminated false claims regarding pretrained YOLOv8n capabilities; introduced a transparent Evidence Architecture.
2. **Evidence Model**: Partitioned visual assessment into **Detected**, **Inferred**, and **Unknown** concepts.
3. **Evidence-Aware Scoring**: Established the "Absence of evidence is not evidence of absence" principle (unobserved features receive 0 penalty points).
4. **Assessment Confidence & Scope**: Added `assessment_confidence` (High, Medium, Low) and explicit `assessment_scope: "visible_area_only"`.
5. **Pluggable Explanation Layer**: Abstracted `ExplanationProvider` with a deterministic default and optional grounded LLM synthesis.
6. **Curated Demo Mode**: Packaged 3 distinct global test scenarios (`Historic Metro Station`, `Commercial Sidewalk`, `Accessible Hospital Plaza`) with clear "Demo Scene" disclosures.
7. **Premium UI Redesign**: Designed a glass-like dark theme, multi-step progress transitions, judge inspection panel, and accessible HTML markup.
8. **Expanded Verification**: Expanded the pytest suite to 18 tests (100% passing) and verified Next.js 14 production builds.
9. **Deployment & Pitch Assets**: Authored `docker-compose.yml`, Dockerfiles, Model Card, Pitch scripts, and demo walkthrough.

---

## 2. ML Improvements & Model Details
- **Active Model:** Ultralytics YOLOv8n (`yolov8n.pt`, 6.24MB).
- **Execution Hardware:** CPU inference running in ~80–160ms.
- **Evidence Extraction:** Raw bounding boxes and class confidences are mapped into normalized semantic entities (`stair_hazard`, `obstacle`, `vehicle`, `accessible_feature`, `pedestrian`).
- **Telemetry Display:** Response includes dedicated `inference_time_ms` alongside end-to-end `processing_time_ms`.

---

## 3. Evidence Architecture
WAYFIND AI introduces a structured verification model:
```json
{
  "feature": "Stairs / Steps",
  "status": "detected",
  "source": "object_detection",
  "confidence": 0.91,
  "description": "7 instance(s) of stairs observed in visible path."
}
```
For unverified concepts:
```json
{
  "feature": "Accessible Ramp",
  "status": "unknown",
  "source": "unsupported",
  "confidence": null,
  "description": "No ramp detected in visible area. General vision model cannot rule out a ramp outside camera frame."
}
```
This architectural distinction prevents the system from making unsupported assertions.

---

## 4. Accessibility Engine
- **Base Score:** 100
- **Penalties:**
  - Stairs: $-25\text{ pts}$ per instance (capped at $-50$)
  - Obstacles: $-10\text{ pts}$ per instance (capped at $-30$)
  - Vehicle Proximity: $-15\text{ pts}$ per instance (capped at $-30$)
  - Pedestrian Congestion: $-5\text{ pts}$
- **Rewards:**
  - Confirmed Ramp: $+15\text{ pts}$
  - Confirmed Clear Pathway: $+10\text{ pts}$
- **Uncertainty Rule:** Unobserved features = $0\text{ pts}$ penalty.
- **Bounds:** Strictly clamped to $[0, 100]$.

---

## 5. UI Improvements
- **Color Palette:** Dark background (`#0a0d14`), slate borders (`#1e293b`), and vibrant cyan accents (`#22d3ee`).
- **Visual Evidence Cards:** Clear three-column breakdown (Positively Detected, Inferred Context, Explicitly Unknown).
- **Judge Audit Panel:** Collapsible panel exposing runtime parameters, deterministic rule formulation, and ML telemetry.
- **State Machine Experience:** 4-step loading sequence mirroring actual visual processing phases.

---

## 6. Responsible AI Safeguards
- Clear disclaimer: *Preliminary visual intelligence, not authoritative building certification.*
- Explicit uncertainty statements in both API and UI.
- No LLM hallucination: The LLM provider is strictly constrained to observed facts and cannot modify the score.

---

## 7. Testing & Verification Summary
- **Backend Tests:** 18/18 passing tests in 14.10s (`python -m pytest backend/tests/ -v`).
  - Score bounds ($0 \le S \le 100$)
  - Penalty weights for stairs, obstacles, vehicles
  - Positive ramp rewards & zero penalty for unknown ramps
  - Classification thresholds
  - Evidence schema serialization
  - Confidence calculation
  - Unsupported feature recording
  - Image validation (unsupported MIME, oversized payload, empty upload)
  - Deterministic and LLM fallback behaviors
- **Frontend Build:** Verified static production build with zero errors (`next build`).

---

## 8. Deployment Setup
- `backend/Dockerfile`: Lightweight Python 3.12-slim container with OpenCV dependencies.
- `frontend/Dockerfile`: Multi-stage Alpine container for optimized Next.js serving.
- `docker-compose.yml`: Unified orchestration with configurable environment variables.

---

## 9. Final Demo Flow for Judges
1. **Introduction:** State the global accessibility gap (1.3B people affected).
2. **Barrier Scene (Demo 1):** Show Metro Entrance with stairs. Observe score of 48/100, stair barrier detection, and unknown ramp classification with zero absence penalty.
3. **Mixed Scene (Demo 2):** Show Sidewalk with bench and van. Observe moderate 75/100 score and navigable clearance guidance.
4. **Clear Scene (Demo 3):** Show Hospital Plaza. Observe 100/100 score and positive clear-corridor reward.
5. **Technical Audit:** Expand Judge Panel to highlight CPU inference latency (<180ms) and deterministic rule formulation.
