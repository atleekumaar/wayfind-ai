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
- **Scope:** Used as the visual perception foundation for WAYFIND AI's deterministic accessibility rules engine.
- **Target Entities:** Stairs, pedestrians, vehicles, benches, chairs, and physical obstacles.

---

## 3. Factors & Input Modalities
- **Input Modality:** Single monocular RGB image (JPEG, PNG, WebP)
- **Input Resolution:** Preprocessed and scaled up to 640×640 pixels
- **Lighting / Environment:** Outdoor daylit streetscapes, urban sidewalks, and illuminated building portals.

---

## 4. Known Limitations & Technical Honesty
1. **Pretrained COCO Dataset Distribution:** The base model is trained on Microsoft COCO, which does not contain native annotations for specialized accessibility infrastructure such as curb cuts, tactile paving, or automatic door push plates.
2. **Monocular Geometry:** The model cannot measure metric dimensions (e.g. ADA-compliant 1:12 ramp slope or doorway width in inches) from a 2D RGB image without stereo cameras or LiDAR.
3. **Occlusion & Viewpoint Variance:** Small step transitions may be obscured behind parked vehicles or dense crowds.

---

## 5. Responsible AI & Ethical Considerations
- **No Authoritative Certification:** WAYFIND AI assessments provide preliminary visual intelligence for personal route planning and do not substitute for official accessibility building audits.
- **Evidence Separation Principle:** The system explicitly categorizes visual concepts into `Detected`, `Inferred`, and `Unknown`. It never penalizes an environment simply because a camera angle failed to capture a ramp.
