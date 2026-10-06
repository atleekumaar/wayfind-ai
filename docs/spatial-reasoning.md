# Spatial Corridor Reasoning Architecture

WAYFIND AI avoids simplistic global object counting by implementing image-space pedestrian corridor localization. This document explains the spatial heuristics, corridor definitions, and risk-weighting matrices.

---

## 1. The Pedestrian Corridor Formulation

In real-world street scenes, an obstacle (such as a parked bicycle or trash can) on the far periphery or background does not obstruct a wheelchair user traveling straight along the primary sidewalk. 

WAYFIND defines the primary pedestrian navigation corridor based on camera-space perspective projection:

```
+-----------------------------------------------------------+ (y = 0.0)
|                     Background / Sky                      |
|                                                           |
+-----------------------------------------------------------+ (y = 0.45h)
|      Periphery      |      PRIMARY WALKWAY      | Periphery
|      (Contextual)   |      NAVIGATION CORRIDOR  | (Contextual)
|                     |                           |
|  (x < 0.20w)        |   (0.20w <= x <= 0.80w)   | (x > 0.80w)
|                     |                           |
+-----------------------------------------------------------+ (y = 1.0h)
```

- **Ground Plane Threshold:** $y \ge 0.45 \times \text{height}$ (lower 55% of the visual frame where ground contact occurs).
- **Lateral Corridor Span:** $0.20 \times \text{width} \le x \le 0.80 \times \text{width}$ (central 60% lateral span).
- **Foreground Proximity Horizon:** $y_{\text{max}} \ge 0.70 \times \text{height}$ (immediate path ahead within 1–3 meters).

---

## 2. Spatial Classification Categories

Every detected object bounding box $B = (x_1, y_1, x_2, y_2)$ is evaluated against the corridor polygon $C$:

$$\text{Overlap}(B, C) = \frac{\text{Area}(B \cap C)}{\text{Area}(B)}$$

Based on this overlap and ground contact base coordinate $y_2$:

1. **`corridor_obstruction`** ($\text{Overlap} \ge 0.30$ and $y_2 \ge 0.45h$):
   - The object directly occupies the central travel path.
   - Incurs full penalty (scaled by mobility profile weight).
   - Flagged as a high-priority physical barrier.

2. **`pathway_restriction`** ($0 < \text{Overlap} < 0.30$ or near boundary edges $x_1 \le 0.25w$ or $x_2 \ge 0.75w$):
   - The object narrows the clearance width of the sidewalk.
   - Incurs a reduced fractional penalty ($0.50 \times \text{penalty}$).
   - Flagged as a pathway narrowing warning.

3. **`contextual_outside_corridor`** ($\text{Overlap} = 0.0$ or $y_2 < 0.45h$):
   - The object is situated on the road, grass verge, or distant background.
   - **Incurs exactly 0 points deduction.**
   - Retained as contextual visual information without unfairly reducing the accessibility score.

---

## 3. Ground Clearance & Proximity Factor

- **Immediate Foreground Obstacle ($y_2 \ge 0.70h$):** Proximity weight = $1.0\times$ (critical imminent hazard).
- **Mid-ground Obstacle ($0.45h \le y_2 < 0.70h$):** Proximity weight = $0.75\times$ (approaching hazard).
- **Background ($y_2 < 0.45h$):** Proximity weight = $0.0\times$ (outside traversal zone).

---

## 4. Architectural Integration

The spatial evaluation module is implemented in [`backend/app/services/spatial_reasoning.py`](file:///c:/Users/atuls/OneDrive/Desktop/wayfind/backend/app/services/spatial_reasoning.py). It operates synchronously in sub-millisecond time ($< 1\,\text{ms}$) immediately following YOLOv8 bounding box generation, preserving low latency while preventing false-positive barrier penalties.
