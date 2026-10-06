# WAYFIND AI — Hackathon Pitch Scripts

## 1. One-Line Pitch
> **"WAYFIND AI transforms ordinary camera imagery into evidence-based accessibility intelligence for cities worldwide."**

---

## 2. 30-Second Elevator Pitch
"Over 1.3 billion people globally live with physical disabilities, yet urban accessibility data is virtually non-existent before you arrive at a door. Wheelchair users, the elderly, and families with strollers encounter sudden flights of stairs and blocked curb ramps every day.

**WAYFIND AI** solves this by converting standard photos of entrances and streets into an explainable, 0–100 accessibility assessment. Instead of relying on hallucinating black-box LLMs, we combine real-time YOLOv8 computer vision with a transparent, evidence-aware rules engine that clearly separates what is positively detected from what remains unknown. It gives people mobility confidence before they step out the door."

---

## 3. 90-Second Judge Demo Script

### [0:00 – 0:15] The Hook & Problem
"Judges, imagine arriving at an unfamiliar subway station or conference venue in a wheelchair, only to discover a massive flight of stairs blocking the entrance—with no ramp in sight. Today, physical accessibility infrastructure is completely fragmented across global cities. This is **WAYFIND AI**."

### [0:15 – 0:35] Live Upload & Evidence Extraction
*(Action: Click 'Explore Demo Scenes' -> Select 'Scene 1: Historic Metro Station')*  
"Let’s inspect this metro entrance. In less than 150 milliseconds on a standard CPU, our vision pipeline extracts visual reality. Look here on the left: our YOLO detector localizes 7 steps of stairs with bounding boxes. But notice our **Evidence Engine**: instead of claiming we know everything, we categorize:
- **Detected:** Stairs barrier (91% confidence).
- **Inferred:** Navigable path narrowed.
- **Unknown:** Ramp availability and tactile paving cannot be certified from this single viewpoint."

### [0:35 – 0:55] Transparent Rules & The Score
*(Action: Point to Score Card & Factors)*  
"Notice the accessibility score: **48/100 — Partially Accessible**.  
Because we use a deterministic rules engine rather than an ungrounded LLM, this score is 100% explainable:
- Base score: 100
- Stairs barrier: -25 points
- Obstacle proximity: -10 points
Crucially, under our **Responsible AI principles**, we do NOT penalize merely because a ramp wasn't captured in the photo. Absence of visual evidence is never proof of absence."

### [0:55 – 1:15] Mixed & Clear Comparisons
*(Action: Switch to 'Scene 3: Accessible Hospital Plaza')*  
"Now look at this accessible hospital plaza. The score recalculates in real-time to **100/100 — Fully Accessible**. Zero step barriers, verified wide pathway (+10 reward), and safe navigation guidance. Judges can even open our **Judge Inspection Panel** to inspect raw telemetry, model weights, and mathematical clamping."

### [1:15 – 1:30] Conclusion & Global Vision
"WAYFIND AI doesn't just label images—it separates visual evidence from uncertainty to deliver trustworthy, life-changing mobility intelligence. Thank you."
