# WAYFIND AI — Final Hackathon Hardening Audit

**Product:** WAYFIND AI (*Visual Intelligence for Accessible Places*)  
**Phase:** Final Hardening & Enhancement Audit  
**Date:** 2026-10-06  
**Repository:** https://github.com/atleekumaar/wayfind-ai  

---

## 1. Current Architecture
- **Client Layer**: Next.js 14 + React 18 + Tailwind CSS + Lucide Icons.
- **API Gateway**: FastAPI asynchronous server with CORS, upload size capping, and structured error guards.
- **Perception Engine**: Ultralytics YOLOv8n (`yolov8n.pt`, 6.24MB) executing CPU inference.
- **Evidence Extraction**: Initial separation into Detected, Inferred, and Unknown features.
- **Accessibility Scoring**: Deterministic base-100 scoring with penalty and reward constraints clamped to $[0, 100]$.
- **Explanation**: Pluggable `ExplanationProvider` with deterministic fallback.
- **Visuals**: OpenCV server-side bounding box annotation.

---

## 2. Existing Capabilities
- Fully functional end-to-end analysis on single images.
- 18 passing backend pytest tests covering score bounds, penalty weights, and image validation.
- Responsive dark-mode dashboard with interactive visual toggle and radial score meter.
- 3 built-in demo scenarios (`Historic Metro Station`, `Commercial Sidewalk`, `Accessible Hospital Plaza`).
- Complete documentation suite (Pitch, Model Card, Demo Script, Architecture).
- Docker and Docker Compose containerization configurations.

---

## 3. Existing Limitations to Address
1. **Model / Semantic Mismatch**:
   - YOLOv8n is pretrained on MS-COCO (80 classes). It does NOT natively identify `stairs`, `stairway`, `steps`, `ramp`, `wheelchair`, `curb cut`, or `tactile paving`.
   - The system must explicitly separate `model_supported_classes` from `specialized_accessibility_features` and mark unsupported features as `unknown` (with zero penalty).
2. **Missing Spatial Barrier Localization**:
   - An object currently receives penalties regardless of whether it actually interferes with the likely pedestrian path. A vehicle parked far away on a road or a bench placed against a wall outside the walkway should not be treated as an obstacle.
   - We must implement an image-space spatial reasoning layer (`spatial_reasoning.py`) that calculates overlap with the inferred navigation corridor.
3. **Absence of User-Centric Mobility Profiles**:
   - Different users have different barrier sensitivities. Wheelchair users, strollers, walkers, and general pedestrians require tailored (yet strictly deterministic) weighting.
4. **Single-View Ingestion Constraint**:
   - Real-world streetscapes often require multiple angles (e.g., entrance view, sidewalk corridor, ramp approach). Multi-view evidence aggregation is needed.
5. **Score Audit & Uncertainty Transparency**:
   - Need an interactive "Why this score?" calculation breakdown and explicit Knowledge vs. Unknown verification cards.
6. **Web Accessibility & Voice Summary**:
   - Ironclad website accessibility and browser-native SpeechSynthesis audio summary.

---

## 4. Planned Hardening Milestones
| Milestone | Scope | Key Changes |
|---|---|---|
| **Phase 1** | Model / Semantic Alignment | Strictly gate positive detection to COCO classes; designate specialized features as unknown; clarify synthetic demo labels. |
| **Phase 2** | Spatial Barrier Localization | Implement `spatial_reasoning.py` for image-space navigation corridor overlap & proximity analysis. |
| **Phase 3** | Spatial-Aware Scoring Engine | Integrate corridor intersection into rules engine (contextual objects receive 0 penalty). |
| **Phase 4** | Accessibility Profiles | Add Wheelchair, Walker, Stroller, General Mobility, and Low Vision profiles. |
| **Phase 5** | Multi-View Evidence Fusion | Implement `multiview.py` supporting up to 3 images per scene analysis. |
| **Phase 6** | Visual Score Breakdown ("Why this score?") | Step-by-step mathematical traceability panel. |
| **Phase 7** | Verified vs. Unknown Knowledge Panel | Dedicated "What WAYFIND Knows" vs "What WAYFIND Cannot Verify" UI. |
| **Phase 8** | Dual Confidence Architecture | Distinguish Vision Confidence (%) from Assessment Confidence (High/Med/Low). |
| **Phase 9** | Voice Accessibility Summary | Browser-native `SpeechSynthesis` read-aloud support. |
| **Phase 10-14** | Demo Polish, Judge Mode, Error Recovery | Clear synthetic labeling, judge telemetry view, error hardening. |
| **Phase 15-18** | Test Suite Expansion & Docs | Expand to 30+ comprehensive pytest tests, update all documentation. |

---

## 5. Risks & Compatibility Considerations
- **Non-Breaking API**: The existing `/api/v1/analyze` endpoint must retain backward-compatible fields so existing callers remain functional while adding new spatial, profile, and multi-view enhancements.
- **Deterministic Invariance**: Scores must remain 100% deterministic and bounded in $[0, 100]$; LLMs must never modify the score or hallucinate visual facts.
- **Zero Heavy Dependencies**: Spatial reasoning must use lightweight NumPy/geometry math without adding heavy 3D/LiDAR frameworks that could degrade CPU inference speeds.
