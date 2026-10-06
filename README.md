# WAYFIND AI
> **Visual Intelligence for Accessible Places**

An AI-powered accessibility intelligence platform that analyzes street, sidewalk, and entrance imagery to compute explainable, evidence-based physical accessibility assessments ($0–100$) before users arrive.

[![Backend Tests](https://img.shields.io/badge/pytest-18%20passed-emerald)](file:///backend/tests)
[![Next.js Build](https://img.shields.io/badge/Next.js%2014-clean%20build-cyan)](file:///frontend)
[![Model](https://img.shields.io/badge/YOLOv8n-CPU%20optimized-blue)](docs/model-card.md)
[![License](https://img.shields.io/badge/license-MIT-slate)](LICENSE)

---

## 🌍 The Problem

Over **1.3 billion people worldwide** experience significant disabilities. For wheelchair users, the elderly, parents with strollers, and people with mobility impairments, navigating global cities is filled with hidden barriers. 

Public mapping platforms tell you how to get to a street address, but they cannot tell you whether the entrance has a sudden flight of seven steps, an impassable curb, or a pathway blocked by outdoor construction. Too often, people only discover barriers after they arrive.

---

## 💡 The Solution

**WAYFIND AI** converts standard smartphone and camera photos into **actionable accessibility intelligence**.

Instead of delegating critical safety assessments to a hallucinating black-box LLM, WAYFIND utilizes a **transparent, evidence-aware computer vision and deterministic rules pipeline**:

```
      IMAGE CAPTURE
            │
            ▼
   YOLOv8 Computer Vision
            │
   Visual Entity Detections
            │
            ▼
┌──────────────────────────────────────┐
│       Visual Evidence Layer          │
│   • Detected  • Inferred  • Unknown  │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│      Accessibility Rules Engine      │
│   Deterministic Bounded Score [0-100]│
└──────────────────┬───────────────────┘
                   │
                   ▼
     EXPLAINABLE WAYFIND REPORT
```

---

## 🎯 Why It Matters

- **Wheelchair Users & Mobility Device Operators**: Instant advance warning of structural step barriers and narrow corridor restrictions.
- **Elderly Pedestrians**: Reliable identification of stair-free, grade-level access paths.
- **Smart Cities & Municipalities**: Rapid visual auditing of curb ramp infrastructure and pedestrian corridor compliance.
- **Hospitals & Campuses**: Auditing patient drop-off accessibility and universal access ingress portals.

---

## 🔬 How It Works

1. **Computer Vision Perception**: Ultralytics YOLOv8n localizes objects (stairs, benches, vehicles, pedestrians) with precise bounding box coordinates in under 180ms on CPU.
2. **Evidence Separation**: The system partitions reality into three explicit tiers:
   - **Detected Evidence**: Physical entities localized directly in the camera frame.
   - **Inferred Context**: Spatial conclusions drawn from surrounding conditions.
   - **Explicit Unknowns**: Infrastructure elements (e.g., tactile paving, ADA ramp slope) that cannot be verified from a 2D monocular frame.
3. **Deterministic Scoring Engine**: Calculates an objective score clamped to $[0, 100]$:
   - Stairs barrier: $-25\text{ pts}$
   - Pathway obstacle: $-10\text{ pts}$
   - Vehicle proximity: $-15\text{ pts}$
   - Pedestrian crowd congestion: $-5\text{ pts}$
   - Positively identified ramp: $+15\text{ pts}$
   - Confirmed clear pathway: $+10\text{ pts}$
4. **Responsible AI Restraint**: Absence of visual evidence is never treated as proof of absence. An unseen ramp receives $0$ penalty points.
5. **Grounded Explanations**: A pluggable explanation provider converts structured evidence into concise, safety-first navigational guidance without hallucination.

---

## ⚖️ Responsible AI Principles

- **No Overclaiming**: WAYFIND provides *visual accessibility assistance*, not legally certified building inspections.
- **Explicit Uncertainty Reporting**: The system reports `assessment_confidence` (High, Medium, Low) and bounds evaluation to `assessment_scope: "visible_area_only"`.
- **Zero Hallucination Scoring**: The score is mathematically derived and cannot be altered or overridden by an LLM.

---

## 🎮 Explore Demo Scenarios

WAYFIND includes three built-in test environments for instant demonstration:

| Scenario | Environment Description | Expected Accessibility Score |
|---|---|---|
| **Scene 1: Historic Metro Station** | 7 concrete steps to entrance portal; no ramp visible | **Partially Accessible** (~48/100) |
| **Scene 2: Commercial Sidewalk** | Flat pavement with roadside delivery van and cafe bench | **Mostly Accessible** (~75/100) |
| **Scene 3: Accessible Hospital Plaza** | Wide grade-level approach with automatic doors | **Fully Accessible** (100/100) |

---

## 🚀 Running Locally

### Prerequisites
- Python 3.12+ (64-bit)
- Node.js 18+ and npm

### 1. Start the Backend API
```bash
cd backend

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Healthcheck: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Start the Frontend Dashboard
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)

### 3. Run Test Suite
```bash
python -m pytest backend/tests/ -v
```
*(All 18 tests cover scoring bounds, penalty weights, confidence calculation, evidence serialization, and image validation).*

---

## 🐳 Docker Deployment

Run both backend and frontend in isolated containers:
```bash
docker-compose up --build
```
Access the application at `http://localhost:3000`.

---

## 🔍 Limitations & Future Work

### Current Limitations
- **General Pretrained Weights**: YOLOv8n is pretrained on COCO. Dedicated classes like ADA-compliant curb cuts and tactile paving require specialized accessibility datasets.
- **Monocular Geometry**: Metric slope angles (1:12 ADA standard) cannot be computed with millimeter accuracy from a single 2D camera perspective.

### Future Work
- **Dedicated Accessibility Dataset**: Fine-tuning YOLOv8 on 50,000+ annotated public infrastructure images.
- **Depth & Slope Estimation**: Integrating lightweight monocular depth estimation to measure approximate ramp incline angles.
- **LiDAR Integration**: Combining RGB imagery with foveated LiDAR and 2.5D point-cloud spatial maps.
- **Multimodal Audio Navigation**: Spoken spatial directions for visually impaired pedestrians via Google Antigravity SDK.
- **OpenStreetMap Integration**: Crowdsourced geo-tagged accessibility intelligence for global smart city mapping.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
