# Model Card — WAYFIND AI Vision Engine

## 1. Model Details
- **Model Name:** Ultralytics YOLOv8 Nano (`yolov8n.pt`)
- **Version:** v8.3.0
- **Model Type:** Single-stage Anchor-Free Convolutional Object Detector
- **Parameters:** ~3.2 Million
- **Model Size:** 6.24 MB
- **Framework:** PyTorch / Ultralytics
- **Inference Runtime:** CPU-optimized (typical latency: 80–180ms)

---

## 2. Intended Use
- **Primary Use Case:** Real-time localization and categorization of visual entities within streetscape, sidewalk, and building entrance photography.
- **Scope:** Used as the visual perception foundation for WAYFIND AI's deterministic accessibility rules engine and spatial corridor analyzer.
- **Target Entities:** Pedestrians, vehicles, benches, chairs, potted plants, suitcases, and general path obstructions.

---

## 3. Explicit Model Class Boundary & Semantic Separation
The base model is trained on Microsoft MS-COCO (80 object classes). To maintain strict ML credibility:
- **Native Supported Barrier Classes:** `chair`, `bench`, `potted plant`, `suitcase`
- **Native Supported Vehicle Classes:** `car`, `truck`, `bus`, `motorcycle`, `bicycle`
- **Native Pedestrian Classes:** `person`
- **Specialized Architectural Features (UNSUPPORTED in native COCO):** `ramp`, `tactile_paving`, `stairs`, `curb_cut`, `door_width`, `slope`
- **Zero-Penalty Guarantee:** Unsupported specialized features are classified as `unknown` with **0 point deduction** unless positive evidence is provided.

---

## 4. Spatial Corridor Integration
Detections are passed into `SpatialReasoner` to distinguish:
- `corridor_obstruction`: Occupies the central 60% ground walkway ($y \ge 0.45h, 0.20w \le x \le 0.80w$, overlap $\ge 30\%$).
- `pathway_restriction`: Impinges on corridor boundaries.
- `contextual_outside_corridor`: Situated on road or background verges (**0 points penalty**).

---

## 5. Mobility Profiles Evaluated
Penalties are scaled across 5 assistive profiles:
1. `general`: Standard pedestrian baseline.
2. `wheelchair`: Strict step and narrow width penalties.
3. `walker`: Sensitive to ground clutter, trip hazards, and long distances.
4. `stroller`: Rolling clearance and curb transition focus.
5. `low_vision`: High penalties on unexpected obstacles and ground objects.

---

## 6. Multi-View Evidence Fusion
Supports 1 to 3 complementary camera perspectives. Adopts conservative safety barrier propagation ($\min(\text{score}_i)$) and object deduplication to prevent single-view blindspots.

---

## 7. Responsible AI & Ethical Boundaries
- **No Authoritative Certification:** WAYFIND AI assessments provide preliminary visual intelligence for personal route planning and do not substitute for official ADA/building accessibility audits.
- **Evidence Separation Principle:** The system strictly separates visual concepts into `Detected`, `Inferred`, and `Unknown`. It never penalizes an environment simply because a camera angle failed to capture a ramp.
