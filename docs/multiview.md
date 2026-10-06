# Multi-View Evidence Fusion Architecture

Real-world accessibility navigation cannot rely solely on a single photographic angle. A building entrance may appear level from a head-on perspective while concealing a 3-step elevation change or blocked curb cut from a side angle.

---

## 1. Multi-View Ingestion

WAYFIND AI supports multi-view analysis for up to 3 complementary viewpoints:
- **Approach View:** Street-level perspective observing approach sidewalk and curb ramps.
- **Entrance Close-up:** Direct view of doorway threshold and floor transitions.
- **Corridor/Side View:** Lateral perspective assessing cross-slope and lateral obstructions.

Endpoint:
```http
POST /api/v1/analyze-multiview?profile=wheelchair&confidence_threshold=0.30
Content-Type: multipart/form-data

files: [view_1.jpg, view_2.jpg, view_3.jpg]
```

---

## 2. Evidence Fusion Algorithm

The multi-view fusion engine is implemented in [`backend/app/services/multiview.py`](file:///c:/Users/atuls/OneDrive/Desktop/wayfind/backend/app/services/multiview.py). It enforces the following principles:

### A. Conservative Barrier Propagation
Accessibility operates under a safety-critical conservative guarantee:
$$\text{Score}_{\text{multiview}} = \min(\text{Score}_1, \dots, \text{Score}_k)$$
If a critical physical barrier (e.g. flight of stairs or impassable construction barrier) exists along the route, a clear view of an adjacent sidewalk does **not** cancel or average out that hazard.

### B. Deduplication Across Views
Objects observed across multiple views are deduplicated using feature category, spatial relations, and bounding overlap heuristics to prevent artificial double-counting of the same obstacle.

### C. Uncertainty Reduction
When multiple views provide broader spatial coverage of an entrance area, assessment uncertainty decreases:
- If a ramp was classified as `unknown` in View 1, but is confirmed in View 2, the evidence item transitions from `unknown` to `detected`.
- Multi-view coverage elevates the overall `assessment_confidence` from `MEDIUM` to `HIGH`.

---

## 3. Telemetry & Multi-View Response Schema

The multi-view response conforms to the standard `AnalysisResponse` schema while augmenting multi-view metadata:
- `views_analyzed`: Number of perspective angles evaluated ($1 \le N \le 3$).
- `annotated_image`: Primary angle visualization with option to inspect all angle renders.
- `fused_evidence`: Aggregated evidence items with per-view provenance.
