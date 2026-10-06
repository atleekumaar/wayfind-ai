# WAYFIND AI — Official Hackathon Demo Walkthrough Script

## Core Thesis Sentence for Judges:
> **"WAYFIND doesn't simply classify an image. It localizes pedestrian navigation corridors, respects assistive mobility profiles, and separates what the model can see from what it cannot verify."**

---

## 1. Scenario 1: Barrier-Rich Environment (Stairs Entrance)
- **Scene:** Historic Metro Station Entrance
- **Visual Features:** Flight of concrete steps leading up to entry doorway portal; no ramp in camera frame.
- **Profile:** Wheelchair Mode (`wheelchair`)
- **Expected Score:** `45–55/100` (Partially Accessible)
- **Walkthrough Actions:**
  1. Click **1. Stairs** demo button or upload stairs photo.
  2. Point out the **Curated Demo Scene — Synthetic Benchmark** disclosure badge.
  3. Click **"Why this score?" (Calculation Audit)** button to reveal the deterministic mathematical breakdown.
  4. Click **"Listen to Assessment"** to demonstrate browser-native speech synthesis narration.
  5. Inspect **Verified Knowledge vs Unknown Reality Panel**:
     - *What WAYFIND Knows:* Stairs barrier localized in corridor.
     - *What WAYFIND Cannot Verify:* Ramp availability is unknown; **0 points penalty** applied.

---

## 2. Scenario 2: Spatial Corridor Reasoning Demo (Obstacle Outside vs Inside Corridor)
- **Scene:** Urban Commercial Sidewalk with cafe furniture on the verge.
- **Key Takeaway for Judges:**
  - Obstacles on the far curb/verge receive `contextual_outside_corridor` with **0 points penalty**.
  - Only objects blocking the central $0.20w \le x \le 0.80w$ pedestrian corridor trigger deductions.
  - Demonstrates that WAYFIND is not a naive object counter.

---

## 3. Scenario 3: Mobility Profile Comparison
- **Action:** Switch profiles between **Wheelchair** and **Walker** on the same mixed scene:
  - In **Wheelchair Mode:** Stairs and high curbs trigger higher penalties ($1.25\times$).
  - In **Walker Mode:** Ground trip hazards and clutter receive higher penalties ($1.35\times$).
  - Demonstrates assistive persona customization.

---

## 4. Scenario 4: Multi-View Evidence Fusion
- **Action:** Select 2 or 3 camera perspectives (Approach, Entrance, Corridor).
- **Key Takeaway for Judges:**
  - Demonstrates conservative safety barrier propagation ($\min(\text{score}_i)$).
  - A hidden step in View 2 is not obscured by a clear approach in View 1.
  - Multi-view coverage reduces uncertainty, elevating confidence from `MEDIUM` to `HIGH`.

---

## 5. Scenario 5: Technical Audit & Judge Mode
- **Action:** Expand the **Judge & Technical Architecture Inspection Panel**.
- **Inspect:**
  - Model: Ultralytics YOLOv8n (CPU inference ~100ms)
  - Latency breakdown: Computer Vision vs Spatial Rules vs OpenCV rendering
  - Grounded deterministic guarantee: LLM is strictly read-only and cannot alter scores or hallucinate objects.
