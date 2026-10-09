# WAYFIND AI — Real-Image Evaluation & Benchmark Protocol

**Document Version:** 1.0  
**Scope:** Evaluation of Object Detection, Spatial Reasoning, Profile-Aware Rules, and Multi-View Fusion on Real Pedestrian Images.  
**Compliance Note:** Ground-truth metrics must be evaluated against labelled real-world scenes. Synthetic unit-test fixtures verify code mechanics but do not substitute for empirical real-image benchmark metrics.

---

## 1. Evaluation Dataset Design

The evaluation dataset consists of real-world photography captured from public pedestrian spaces under standard pedestrian eye-level and wheelchair-level camera heights:

1. **Indoor Corridors:** Hospital ingress, university hallways, metro station concourses.
2. **Building Entrances:** Grade-level entries, step-access portals, manual vs. automatic doors.
3. **Sidewalks & Curb Cuts:** Commercial district walkways, street-curb transitions.
4. **Pedestrian Plazas:** Outdoor pedestrian-only paths with seating and bollards.
5. **Challenging Lighting & Occlusions:** Partial shadow, night lighting, glare, distant pedestrians.

### Dataset Privacy & Integrity
- No facial recognition or biometric profiling.
- License compliance: Public domain / CC-BY / Project-captured real images.
- Minimum resolution: 640x480.

---

## 2. Ground-Truth Annotation Schema

Each evaluation image is annotated with structured ground truth:
```json
{
  "image_id": "real_scene_001",
  "scene_type": "sidewalk",
  "camera_perspective": "eye_level",
  "ground_truth_objects": [
    {
      "class_name": "bench",
      "bbox": [150.0, 280.0, 320.0, 410.0],
      "in_navigable_corridor": true,
      "expected_spatial_tier": "corridor_obstruction"
    }
  ],
  "accessibility_ground_truth": {
    "wheelchair_passable": false,
    "primary_barrier": "bench_blocking_corridor",
    "step_free": true
  }
}
```

---

## 3. Measurable Evaluation Metrics

### A. Object Detection Metrics (Supported COCO Classes Only)
Calculated only on supported native classes:
- **Precision:** $\frac{TP}{TP + FP}$
- **Recall:** $\frac{TP}{TP + FN}$
- **F1 Score:** $2 \cdot \frac{Precision \cdot Recall}{Precision + Recall}$

### B. Spatial Corridor Relevance Metrics
- **Corridor Relevance Precision:** Percentage of detected obstacles localized inside the pedestrian corridor that truly obstruct pedestrian passage.
- **Contextual False Penalty Rate:** Rate at which objects outside the pathway (e.g. distant parked cars) falsely trigger a score deduction. Must be $0\%$.

### C. Deterministic Scoring Invariants
- **Reproducibility:** $\Delta(Score_{run1}, Score_{run2}) = 0$ for identical inputs.
- **Score Bounds:** $0 \le Score \le 100$ universally across all profiles and scenarios.
- **Arithmetic Integrity:** $Score = \text{clamp}(100 - \sum \text{penalties} + \sum \text{rewards}, 0, 100)$.
- **Non-Penalty Invariant:** Zero deductions for unobserved ramps, tactile paving, or unsupported concepts.

---

## 4. Benchmark Execution Command

Run the benchmark evaluation harness:
```bash
python -m backend.scripts.evaluate_benchmark
```
This generates machine-readable output: `docs/benchmark-results.json` and a Markdown summary report.
