# WAYFIND AI — Day 1 Final Report

**Product Name:** WAYFIND AI  
**Tagline:** Visual Intelligence for Accessible Places  
**Phase:** Day 1 MVP Completed  
**Date:** 2026-10-06  

---

## 1. Executive Summary
On Day 1 of the 48-hour hackathon, we built and verified the complete end-to-end MVP of **WAYFIND AI**.
The system ingests standard photos of built environments (entrances, sidewalks, streetscapes) and computes transparent, deterministic accessibility assessments ($0–100$ score) paired with high-contrast computer vision bounding-box overlays, risk warnings, and actionable wayfinding recommendations.

---

## 2. Completed Components

### Backend API (`FastAPI` + `Pydantic`)
- Fully typed REST endpoints for analysis, healthchecks, and model inspection.
- Defensive image verification pipeline validating MIME types (JPEG, PNG, WebP), payload caps (10MB), and file corruption checks via Pillow.
- Standardized error handling preventing internal stack-trace leaks.

### Computer Vision & Detection Service
- Integrated Ultralytics YOLOv8 (`yolov8n.pt`, 6.2MB lightweight model) running with sub-second CPU inference.
- Object localization extracting normalized and pixel bounding boxes and detection confidence scores.
- Semantic category grouping (`stair_hazard`, `obstacle`, `vehicle`, `accessible_feature`, `pedestrian`).

### Deterministic Accessibility Scoring Engine
- Transparent scoring formula with 100-point baseline and strict mathematical bounds $[0, 100]$.
- Categorized penalty rules for stairs (-25 pts), pathway obstacles (-10 pts), vehicles near pathways (-15 pts), and pedestrian congestion (-5 pts).
- Positive scoring rewards for accessible ramps (+15 pts) and confirmed clear pathways (+10 pts).
- Four-tier accessibility classification:
  - **Fully Accessible** ($90–100$)
  - **Mostly Accessible** ($70–89$)
  - **Partially Accessible** ($40–69$)
  - **Limited Accessibility** ($0–39$)
- Deterministic, safety-first risk generation and step-free wayfinding recommendations without relying on unpredictable LLM hallucinations.

### Visual Annotation Service (`OpenCV`)
- Real-time rendering of bounding boxes, category-coded color outlines (Red for hazards, Amber for obstacles, Green for accessibility features), and confidence badges.
- Base64 JPEG serialization allowing instant browser display alongside raw RGB images.

### Frontend Dashboard (`Next.js 14`, `TypeScript`, `Tailwind CSS`)
- Dark premium interface with subtle cyan/blue accents and high-contrast accessibility styling.
- Responsive radial progress gauge visualizing the 0–100 accessibility score.
- Side-by-side and interactive toggle view comparing original capture vs. computer vision overlay.
- Categorized barrier cards with severity badges (Critical, High, Medium, Low).
- Priority-ranked recommendation cards and entity tag breakdown.
- Built-in one-click demo presets (Staircase Entrance, Pathway Obstacle, Clear Ramp) for fast judge presentations.

### Testing & Verification
- Comprehensive pytest suite (`backend/tests/test_accessibility.py` and `backend/tests/test_api.py`) with 12/12 passing unit & integration tests covering scoring bounds, penalty calculations, threshold transitions, and image upload validation.
- Next.js production build verified (`next build`) with 0 type errors and 0 build warnings.

---

## 3. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/analyze` | Accepts `multipart/form-data` image file and optional `confidence_threshold` query parameter. Returns complete accessibility evaluation with bounding boxes, score, risks, recommendations, and annotated image data. |
| `GET` | `/health` | Service liveness probe returning `{"status": "ok", "service": "wayfind-ai"}`. |
| `GET` | `/api/v1/classes` | Returns total class count, active model path, and all classes recognized by the active detector. |
| `GET` | `/docs` | Interactive OpenAPI Swagger UI documentation. |

---

## 4. Active ML Model Specifications
- **Model Architecture:** Ultralytics YOLOv8 Nano (`yolov8n.pt`)
- **Model Size:** 6.24 MB (6,549,796 bytes)
- **Parameters:** ~3.2 Million
- **Inference Hardware:** CPU-optimized (runs locally in under 150ms per frame)
- **Primary Source:** Ultralytics release v8.3.0

---

## 5. Current Detection Classes
The active COCO-pretrained detector recognizes 80 visual classes, categorized for physical accessibility into:
- **Mobility Barriers & Obstacles:** `chair`, `bench`, `potted plant`, `suitcase`, `backpack`, `fire hydrant`, `trash can`
- **Vehicles Blocking Access:** `car`, `truck`, `bus`, `motorcycle`, `bicycle`
- **Pedestrian Density:** `person`
- **Infrastructure Fixtures:** `traffic light`, `stop sign`
- **Domain Extensibility:** The `Detector` and `AccessibilityEngine` abstractions support seamless plug-and-play addition of specialized fine-tuned weights for `stairs`, `ramps`, and `curb cuts`.

---

## 6. Known Limitations (Technical Honesty)
1. **Pretrained COCO Bias:** General object detection models do not natively identify micro-level surface defects (cracks, potholes) or slope gradients without specialized training datasets.
2. **Single 2D Perspective:** Without stereo cameras or LiDAR point-clouds, ramp slope percentage (e.g. ADA 1:12 slope threshold) is inferred qualitatively rather than metrically measured.
3. **Lighting & Occlusion:** Extreme low-light conditions or heavy crowd occlusion can hide small step transitions.

---

## 7. Day 2 Priorities
1. **Curated Demo Image Suite:** Add 6–8 real-world test scenes covering diverse global urban environments (Tokyo curb cuts, NYC subway stairs, European cobblestones).
2. **LLM Spatial Reasoning Layer:** Integrate Google Gemini via Antigravity SDK to translate structured scoring metrics into conversational audio/text navigational guidance for visually impaired users.
3. **Monocular Depth / Slope Heuristic:** Incorporate depth estimation to estimate ramp incline angles.
4. **Interactive Dashboard Enhancements:** Add filterable barrier categories and exportable accessibility audit reports (PDF/JSON).
5. **Pitch Video & Assets:** Record 90-second judge demo video and author compelling Devpost narrative.
