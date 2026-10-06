# WAYFIND AI — Hackathon Pitch Scripts

## 1. One-Line Pitch
> **"WAYFIND AI transforms ordinary street photography into evidence-based accessibility intelligence for cities worldwide."**

---

## 2. 30-Second Elevator Pitch
"Over 1.3 billion people globally live with physical disabilities, yet urban accessibility data is virtually non-existent before arriving at a door. Wheelchair users, the elderly, and families with strollers encounter sudden flights of stairs and blocked walkways every day.

**WAYFIND AI** solves this by converting ordinary photos of entrances and streets into an explainable, 0–100 accessibility assessment tailored to specific mobility personas. Instead of relying on hallucinating black-box LLMs, we combine real-time computer vision with spatial corridor reasoning and a deterministic rules engine that separates verified evidence from uncertainty. It gives people mobility confidence before they step out the door."

---

## 3. 90-Second Judge Demo Script

### [0:00 – 0:15] The Hook & Problem
"Judges, imagine arriving at an unfamiliar subway station or conference venue in a wheelchair, only to discover a massive flight of stairs blocking the entrance—with no ramp in sight. Today, physical accessibility infrastructure is completely fragmented across global cities. This is **WAYFIND AI**."

### [0:15 – 0:35] Live Upload, Spatial Corridors & Evidence Extraction
*(Action: Click 'Explore Demo Scenes' -> Select 'Scene 1: Historic Metro Station')*  
"Let’s inspect this metro entrance. In less than 150 milliseconds on a standard CPU, our vision pipeline extracts visual reality. But we don't just count objects—our **Spatial Reasoner** maps the pedestrian navigation corridor.
Notice our **Evidence Engine**: instead of claiming we know everything, we categorize:
- **What WAYFIND Knows:** Positively localized stairs barrier blocking the travel corridor.
- **Inferred Context:** Narrowed pedestrian clearance.
- **What WAYFIND Cannot Verify:** Ramp availability is unknown from this single 2D angle."

### [0:35 – 0:55] Mobility Profiles & The Transparent Audit
*(Action: Click 'Why this score? (Calculation Audit)')*  
"Notice the accessibility score: **48/100 — Partially Accessible**.  
Because we use a deterministic rules engine rather than an ungrounded LLM, this score is 100% auditable:
- Base score: 100
- Stairs barrier in wheelchair mode: -25 points
- Obstacle proximity: -10 points
Crucially, under our **Responsible AI principles**, we explicitly refuse to penalize places for unobserved ramps. Absence of visual evidence is never evidence of absence!
Watch what happens when we switch profiles: in **Wheelchair Mode**, stairs receive maximum penalty; in **Walker Mode**, ground clutter and tripping hazards are prioritized."

### [0:55 – 1:15] Multi-View Fusion & Speech Narration
*(Action: Demonstrate Multi-View Mode and Click 'Listen to Assessment')*  
"Real-world accessibility isn't one-dimensional. Users can submit 1 to 3 complementary camera angles. Our multi-view fusion applies conservative safety guarantees: a hidden hazard in one angle cannot be masked by an unobstructed angle. And for low-vision users or screen readers, our browser-native text-to-speech narrates the assessment with zero cloud API keys."

### [1:15 – 1:30] Conclusion & Technical Credibility
"Judges can expand our **Judge & Technical Architecture Panel** to inspect sub-millisecond spatial rules, YOLOv8n CPU latencies, and our 34 passing test suites. WAYFIND AI doesn't just label images—it delivers trustworthy, life-changing mobility intelligence. Thank you."
