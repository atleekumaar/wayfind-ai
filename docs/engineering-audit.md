# WAYFIND AI — Engineering Audit Report

**Date:** October 9, 2026  
**Repository:** https://github.com/atleekumaar/wayfind-ai  
**Project:** WAYFIND AI — Visual Intelligence for Accessible Places  
**Audit Author:** Lead Computer Vision, Backend, and Full-Stack Engineering Team  

---

## 1. Existing Architecture Overview

WAYFIND AI is an evidence-aware visual accessibility intelligence system designed to inspect physical pedestrian pathways, doorways, and streetscapes from monocular photos or multiple camera viewpoints.

### Core Architecture Flow
```text
USER CAMERA / UPLOAD / BENCHMARK FIXTURE
                 ↓
FastAPI Backend (app.main:app, Port 8000)
                 ↓
Ultralytics YOLOv8n (80 COCO Classes, CPU Inference)
                 ↓
Spatial Navigation Corridor Reasoner (Center Trapezoid, Depth Tiers)
                 ↓
Profile-Aware Accessibility Rules Engine (Deterministic Matrix: 0–100)
                 ↓
Grounded Explanation Layer (Structured Deterministic Fallback)
                 ↓
OpenCV Visual Annotator (Bounding Boxes + Corridor Masks)
                 ↓
Next.js 14 Web Dashboard (Tailwind CSS, Turbopack, Port 3000)
```

---

## 2. Baseline Test Results & Verification

- **Backend Pytest Suite:**  
  `34 passed in 15.40s` (100% pass rate across `test_accessibility.py`, `test_api.py`, `test_multiview.py`, `test_spatial_reasoning.py`).
- **Frontend TypeScript (`npx tsc --noEmit`):**  
  `0 errors` (Clean TypeScript check across all components, hooks, and types).
- **Backend API Endpoints:**  
  - `GET /health` → `{"status": "ok", "service": "wayfind-ai"}`
  - `GET /api/v1/classes` → Reports active detector capability classes.
  - `POST /api/v1/analyze` → Executes single-image inference and spatial evaluation.
  - `POST /api/v1/analyze-multiview` → Aggregates 1–3 viewpoints.

---

## 3. Verified Capabilities vs. Known Limitations

| Component | Verified Current Capability | Identified Engineering Limitation |
|---|---|---|
| **Object Detection (`detector.py`)** | Loads YOLOv8n checkpoint. Detects 80 COCO classes (`bench`, `chair`, `person`, `car`, `truck`, `bicycle`, etc.). | COCO cannot reliably detect architectural features (`stairs`, `steps`, `ramp`, `tactile_paving`, `curb_cut`, `door_width`). |
| **Scoring Engine (`accessibility.py`)** | Deterministic mathematical scoring bounded [0, 100]. Segregates corridor vs. boundary vs. contextual objects. | Previously awarded `+10 pts` clear-path reward purely if no obstacles were detected ("absence of evidence"). |
| **Confidence Assessment** | Dual confidence reporting: Vision confidence vs Assessment confidence. | Needs structured evidence sufficiency states (`sufficient_evidence`, `limited_evidence`, `insufficient_evidence`, `analysis_failed`). |
| **Audit Certificate (`AuditReportModal.tsx`)** | High quality printable document with factor ledger. | Contained misleading labels ("Verified Seal", "Official Site Accessibility Audit", pseudo-hash described as verification digest). Needs renaming to "Visual Assessment Report" with honest SHA-256 canonical hash or reference ID. |
| **Demo Scenes (`demoScenes.ts`)** | Canvas-rendered synthetic test fixtures. | Needs strict labeling as `CURATED DEMO SCENE — SYNTHETIC TEST FIXTURE` with explicit disclaimer that 2D drawn lines are not photographs. |
| **Spatial Reasoning (`spatial_reasoning.py`)** | Fixed trapezoidal corridor heuristic. | Lacks walkable area segmentation interface and evaluation. |
| **Route Planning** | N/A | Does not exist yet; requires modular `AccessibleRoutePlanner` with graph search and OpenStreetMap/local graph support. |

---

## 4. Planned Engineering Changes (P0 to P3)

1. **Phase 1 (COCO & Synthetic Demos):** Centralize capability registry, ensure unsupported classes are never fabricated, label synthetic fixtures explicitly.
2. **Phase 2 (Evidence-Driven Scoring):** Eliminate automatic clear-path rewards, introduce evidence sufficiency tiers (`sufficient_evidence`, `limited_evidence`, `insufficient_evidence`, `analysis_failed`).
3. **Phase 3 (Honest Assessment Report):** Rebrand certificate to "Visual Assessment & Evidence Audit Report", replace pseudo-hash with genuine SHA-256 canonical digest, add non-certification disclaimers.
4. **Phase 4 (Real-Image Benchmark & Regression):** Create evaluation protocol (`docs/evaluation-protocol.md`), repeatable evaluation script, ground truth schema, and comprehensive test suite.
5. **Phase 5 (Visual Traceability):** Link score adjustments directly to detection IDs, spatial assessments, and visual highlights.
6. **Phase 6 (Walkable-Area Segmentation Interface):** Create `WalkableAreaEstimator` modular service with overlap calculation and graceful fallback to the geometric corridor.
7. **Phase 7 (Accessible Route Planning):** Implement modular `AccessibleRoutePlanner` using graph search (Dijkstra/A*) with profile constraints, wheelchair accessibility tags, and privacy safeguards.

---

## 5. Compatibility & Risk Considerations

- All changes maintain backwards compatibility with existing API response consumers.
- No external paid APIs or mandatory cloud services are introduced.
- Deterministic scoring math remains strictly reproducible and audit-backed.
