# WAYFIND AI
> **Visual Intelligence for Accessible Places**

An AI-powered accessibility intelligence platform that analyzes street, sidewalk, and entrance imagery to compute explainable, evidence-based physical accessibility assessments ($0–100$) before users arrive.

[![Backend Tests](https://img.shields.io/badge/pytest-38%20passed-emerald)](backend/tests)
[![Next.js Build](https://img.shields.io/badge/Next.js%2014-clean%20build-cyan)](frontend)
[![Model](https://img.shields.io/badge/YOLOv8n-CPU%20optimized-blue)](docs/model-card.md)
[![License](https://img.shields.io/badge/license-MIT-slate)](LICENSE)

---

## 🌍 The Problem

Over **1.3 billion people worldwide** live with significant physical disabilities. For wheelchair users, the elderly, parents with strollers, and people with mobility impairments, navigating global cities is filled with hidden barriers. 

Standard map applications route users to building addresses, but they cannot tell whether an entrance portal contains sudden steps, an obstructed sidewalk, or an impassable curb cut. People frequently discover barriers only after they arrive.

---

## 💡 The Solution

**WAYFIND AI** converts standard smartphone and camera photos into **actionable accessibility intelligence**.

Instead of delegating critical safety assessments to a hallucinating black-box LLM, WAYFIND utilizes a **transparent, evidence-aware computer vision, spatial corridor reasoning, and deterministic rules pipeline**:

```text
      IMAGE CAPTURE (Live Camera / Upload / 1 to 3 Viewpoints)
                             │
                             ▼
                   YOLOv8n Computer Vision
                             │
               Native 80 COCO Object Detections
                             │
                             ▼
            ┌──────────────────────────────────┐
            │    Spatial Corridor Reasoner     │
            │  • Walkway corridor (20%-80% w)  │
            │  • Base ground plane (y >= 45% h)│
            │  • Obstruction vs Contextual     │
            │  • Walkable Area Segmentation    │
            └────────────────┬─────────────────┘
                             │
                             ▼
            ┌──────────────────────────────────┐
            │     Evidence Separation Layer    │
            │  • Detected  • Inferred • ?      │
            │  • Evidence Sufficiency Grading  │
            └────────────────┬─────────────────┘
                             │
                             ▼
            ┌──────────────────────────────────┐
            │    Mobility Profile Rules Engine │
            │   Wheelchair / Walker / Stroller │
            │   Deterministic Bounded [0-100]  │
            └────────────────┬─────────────────┘
                             │
                             ▼
            ┌──────────────────────────────────┐
            │    Multi-View Fusion Engine      │
            │    Conservative Barrier Safety   │
            └────────────────┬─────────────────┘
                             │
                             ▼
                 EXPLAINABLE WAYFIND REPORT
     (AR Safe Path + Audio Chimes + PDF Audit Report + Route Planner)
```

---

## 🎯 Key Capabilities & Production Features

1. **📹 Live Camera Snap & Multi-Perspective Capture**:
   Direct in-browser camera stream capture (`getUserMedia`) with front/rear lens switching for live on-street audits, plus 1 to 3 viewpoint aggregation.

2. **🛣️ AR Safe Navigation Path Corridor Overlay**:
   Real-time traversable pedestrian carpet ($1.2\text{m}$ width clearance guideline) rendered directly atop captured imagery.

3. **📄 Official Visual Assessment Audit Report (Print / PDF)**:
   Deterministic assessment ledger with itemized factor arithmetic, non-certification legal disclosure, and audit reference ID.

4. **🔊 Assistive Audio Feedback Engine**:
   Web Audio API pure oscillator synthesis providing audible ascending harmonic cues for accessible corridors and distinct double-chimes for detected barriers.

5. **🚶 Walkable Area Segmentation Interface & Route Planner**:
   - `WalkableAreaEstimator`: Modular segmentation region evaluation and box overlap calculation.
   - `AccessibleRoutePlanner`: Graph-based Dijkstra route search with wheelchair-specific step penalties and curb-cut rewards.

6. **🔍 Complete Detection-to-Score Traceability**:
   Every score deduction is linked to an explicit detection ID (`det_1_bench`, `det_1_stairs`) and rule name in the calculation audit.

---

## ⚖️ Responsible AI & Evaluation Principles

- **Absence of Evidence ≠ Evidence of Absence**:
  Unseen ramps or tactile paving receive status `unknown` with **0 points deducted**. An empty camera perspective is reported as `limited_evidence` rather than fabricating a "guaranteed clear" physical space.
- **Model Class Boundary Honesty**:
  Native YOLOv8n weights map 80 COCO classes. Specialized architectural concepts (`ramp`, `tactile_paving`, `stairs`, `curb_cut`, `door_width`) are not falsely claimed as native detections without dedicated verification.
- **Read-Only LLM Explanations**:
  Natural language summaries are strictly grounded in deterministic evidence. The LLM cannot alter score values or hallucinate unseen obstacles.
- **Scope Delimitation**:
  Every assessment is explicitly bounded to `assessment_scope: "visible_area_only"`.

---

## 🎮 Curated Benchmark Test Fixtures

WAYFIND includes three built-in synthetic test environments:

| Scenario | Environment Description | Profile Tested | Score |
|---|---|---|---|
| **1. Historic Metro Station** | Multi-step concrete stairs to entrance portal | Wheelchair | **Partially Accessible** (~48/100) |
| **2. Commercial Sidewalk** | Flat pavement with roadside delivery van and bench | General | **Mostly Accessible** (~75/100) |
| **3. Accessible Hospital Plaza** | Wide grade-level approach with automatic doors | Walker | **Fully Accessible** (100/100) |

---

## 🚀 Quickstart & Local Setup

### 1. Backend Service (FastAPI + YOLOv8)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run backend test suite (38 passing tests)
pytest tests/ -v

# Run benchmark evaluation harness
python -m app.services.benchmark_eval

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation: `http://localhost:8000/docs`

### 2. Frontend Dashboard (Next.js 14 + Turbopack)
```bash
cd frontend
npm install

# Run TypeScript verification
npx tsc --noEmit

# Start Next.js development server
npm run dev
```
Dashboard: `http://localhost:3000`

---

## 📚 Technical Documentation

- [System Architecture](docs/architecture.md)
- [Engineering Audit Report](docs/engineering-audit.md)
- [Real-Image Evaluation Protocol](docs/evaluation-protocol.md)
- [Spatial Corridor Reasoning](docs/spatial-reasoning.md)
- [Accessibility Profiles](docs/accessibility-profiles.md)
- [Multi-View Fusion](docs/multiview.md)
- [Responsible AI Framework](docs/responsible-ai.md)
- [Model Card (YOLOv8n)](docs/model-card.md)
- [Judge Pitch Script](docs/pitch.md)
- [Milestone Archive](docs/archive/)

---

## 📜 License
MIT License. Built for the Global Hackathon 2026.
