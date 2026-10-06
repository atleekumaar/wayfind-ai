# WAYFIND AI
> **Visual Intelligence for Accessible Places**

An AI-powered accessibility intelligence platform that analyzes street, sidewalk, and entrance imagery to compute explainable, evidence-based physical accessibility assessments ($0–100$) before users arrive.

[![Backend Tests](https://img.shields.io/badge/pytest-34%20passed-emerald)](file:///backend/tests)
[![Next.js Build](https://img.shields.io/badge/Next.js%2014-clean%20build-cyan)](file:///frontend)
[![Model](https://img.shields.io/badge/YOLOv8n-CPU%20optimized-blue)](docs/model-card.md)
[![License](https://img.shields.io/badge/license-MIT-slate)](LICENSE)

---

## 🌍 The Problem

Over **1.3 billion people worldwide** live with significant physical disabilities. For wheelchair users, the elderly, parents with strollers, and people with mobility impairments, navigating global cities is filled with hidden barriers. 

Public navigation apps tell you how to navigate to a building address, but they cannot tell you whether the entrance portal has a sudden flight of seven concrete steps, an impassable curb cut, or a sidewalk blocked by outdoor furniture and construction. Too often, people only discover barriers after they arrive.

---

## 💡 The Solution

**WAYFIND AI** converts standard smartphone and camera photos into **actionable accessibility intelligence**.

Instead of delegating critical safety assessments to a hallucinating black-box LLM, WAYFIND utilizes a **transparent, evidence-aware computer vision, spatial corridor reasoning, and deterministic rules pipeline**:

```
      IMAGE CAPTURE (1 to 3 Viewpoints)
                     │
                     ▼
           YOLOv8 Computer Vision
                     │
       Native 80 COCO Object Detections
                     │
                     ▼
    ┌──────────────────────────────────┐
    │    Spatial Corridor Reasoner     │
    │  • Walkway corridor (20%-80% w)  │
    │  • Base ground plane (y >= 45% h)│
    │  • Obstruction vs Contextual     │
    └────────────────┬─────────────────┘
                     │
                     ▼
    ┌──────────────────────────────────┐
    │     Evidence Separation Layer    │
    │   • Detected  • Inferred • ?     │
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
    (Visual Overlay + Speech Audio + Audit)
```

---

## 🎯 Key Innovation Pillars

1. **Spatial Pedestrian Corridor Reasoning**:
   WAYFIND avoids naive global object counting. Objects on the outer roadway or verge are categorized as `contextual_outside_corridor` with **0 points penalty**. Only items directly occupying the central walkway ($y \ge 0.45h, 0.20w \le x \le 0.80w$) trigger barrier penalties.

2. **Personalized Mobility Profiles**:
   Supports 5 distinct assistive personas:
   - **Wheelchair**: Strict sensitivity to step barriers and narrow doorway pinch points.
   - **Walker / Cane**: Heightened penalties on ground clutter and tripping hazards.
   - **Stroller / Cart**: Rolling clearance and curb transition focus.
   - **Low Vision**: Ground obstacle alerts and high-contrast voice narration.
   - **General Mobility**: Baseline urban pedestrian traversal.

3. **Multi-View Evidence Fusion**:
   Aggregates 1 to 3 complementary perspectives (Approach, Entrance, Corridor). Enforces conservative safety guarantees ($\min(\text{score}_i)$) to prevent a clear angle from concealing a blocked portal.

4. **Transparent "Why This Score?" Audit**:
   Every score deduction is fully auditable in an interactive modal showing baseline starting points (100), applied factor multipliers, and non-penalized unobserved features.

5. **Browser-Native Spoken Accessibility Summary**:
   Uses the browser's native `window.speechSynthesis` API to narrate real-time accessibility findings without external cloud API dependencies.

---

## ⚖️ Responsible AI Principles

- **Absence of Evidence ≠ Evidence of Absence**:
  WAYFIND explicitly refuses to penalize places for unobserved accessibility infrastructure. Unseen ramps or tactile paving receive status `unknown` with **0 points deducted**.
- **Model Class Boundary Honesty**:
  Native YOLOv8n weights map 80 COCO classes. Specialized architectural features (`ramp`, `tactile_paving`, `stairs`, `curb_cut`, `door_width`) are never falsely claimed as native detections without dedicated verification.
- **Read-Only LLM Explanations**:
  Natural language explanations are grounded in deterministic evidence. The LLM cannot alter score values or hallucinate unseen obstacles.
- **Scope Delimitation**:
  Every assessment is explicitly bounded to `assessment_scope: "visible_area_only"`.

---

## 🎮 Curated Benchmark Demo Scenes

WAYFIND includes three built-in test environments for instant demonstration:

| Scenario | Environment Description | Profile Tested | Expected Score |
|---|---|---|---|
| **Scene 1: Historic Metro Station** | 7 concrete steps to entrance portal; no ramp in frame | Wheelchair | **Partially Accessible** (~48/100) |
| **Scene 2: Commercial Sidewalk** | Flat pavement with roadside delivery van and cafe bench | General | **Mostly Accessible** (~75/100) |
| **Scene 3: Accessible Hospital Plaza** | Wide grade-level approach with automatic doors | Walker | **Fully Accessible** (100/100) |

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Python 3.10+ (with PyTorch and Ultralytics)
- Node.js 18+ and npm

### 1. Backend Service
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run backend test suite (34 passing tests)
pytest tests/ -v

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation: `http://localhost:8000/docs`

### 2. Frontend Dashboard
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
- [Spatial Corridor Reasoning](docs/spatial-reasoning.md)
- [Accessibility Profiles](docs/accessibility-profiles.md)
- [Multi-View Fusion](docs/multiview.md)
- [Responsible AI Framework](docs/responsible-ai.md)
- [Model Card (YOLOv8n)](docs/model-card.md)
- [Hackathon Demo Walkthrough Script](docs/demo-script.md)
- [Judge Pitch Script](docs/pitch.md)

---

## 📜 License
MIT License. Built for the Global Hackathon 2026.
