# WAYFIND AI — System Architecture (Day 1 MVP)

## Overview
WAYFIND AI converts ordinary camera imagery of streets, pathways, and building entrances into structured accessibility intelligence.
Rather than delegating scoring to a non-deterministic black-box LLM, WAYFIND utilizes a deterministic computer vision + rules engine pipeline.

```
┌────────────────────────────────────────────────────────┐
│                      Client Layer                      │
│   Next.js 14 + React + TypeScript + Tailwind CSS       │
└───────────────────────────┬────────────────────────────┘
                            │
               multipart/form-data upload
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   API Gateway Layer                    │
│            FastAPI (Asynchronous REST API)             │
│  - POST /api/v1/analyze                                │
│  - GET /health                                         │
│  - GET /api/v1/classes                                 │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                Image Validation Service                │
│  - Format verification (JPEG, PNG, WebP)               │
│  - Payload limits (<= 10MB)                            │
│  - Corruption / integrity checks (Pillow)              │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Computer Vision Detection Service          │
│  - Ultralytics YOLOv8 (Lightweight CPU-optimized)      │
│  - Object detection & bounding box extraction          │
│  - Category normalization (barriers, vehicles, crowd)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Accessibility Rules Engine                 │
│  - Deterministic Scoring (100 base, bounded [0, 100])  │
│  - Penalties: Stairs (-25), Obstacles (-10), etc.      │
│  - Rewards: Clear pathways (+10), Ramps (+15)          │
│  - Classification: Fully / Mostly / Partially / Limited│
│  - Severity-graded Risk Generation                     │
│  - Actionable Wayfinding Recommendations               │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            Visual Annotation Service (OpenCV)          │
│  - High-contrast color-coded bounding boxes            │
│  - Class name & confidence badge rendering             │
│  - Base64 JPEG encoding for instant web rendering      │
└────────────────────────────────────────────────────────┘
```

## Deterministic Scoring Mathematical Formulation

The accessibility score $S \in [0, 100]$ is computed as:

$$S = \text{clamp}\left(100 - \sum P_i + \sum R_j, 0, 100\right)$$

Where:
- $P_{\text{stairs}} = \min(25 \times N_{\text{stairs}}, 50)$
- $P_{\text{obstacle}} = \min(10 \times N_{\text{obstacle}}, 30)$
- $P_{\text{vehicle}} = \min(15 \times N_{\text{vehicle}}, 30)$
- $P_{\text{crowd}} = 5 \quad \text{if } N_{\text{person}} > 4 \text{ else } 0$
- $R_{\text{ramp}} = 15 \times N_{\text{ramp}}$
- $R_{\text{clear}} = 10 \quad \text{if no physical barriers detected}$

## Classification Tiers
- **Fully Accessible**: Score $\ge 90$
- **Mostly Accessible**: $70 \le \text{Score} < 90$
- **Partially Accessible**: $40 \le \text{Score} < 70$
- **Limited Accessibility**: $\text{Score} < 40$
