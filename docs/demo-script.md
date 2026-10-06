# WAYFIND AI — Official Hackathon Demo Walkthrough Script

## Core Thesis Sentence for Judges:
> **"WAYFIND doesn't simply classify an image. It separates what the model can see from what it cannot verify."**

---

## Scenario 1: Barrier-Rich Environment (Stairs Entrance)
- **Scene Name:** Historic Metro Station Entrance
- **Visual Features:** 7 concrete steps leading up to entry doorway portal; no ramp in frame.
- **Expected Score:** `45–55/100` (Partially Accessible)
- **Key Takeaway for Judges:**
  - High-severity risk generated: *"Stairs were detected near the visible pathway and may present a mobility barrier."*
  - Evidence layer shows **Detected: Stairs (91%)** while placing **Ramp availability** in the **Unknown** category.
  - Zero penalty applied for the unobserved ramp, demonstrating responsible AI restraint.
  - Recommendation: *"Look for a step-free entrance or verify ramp access before arrival."*

---

## Scenario 2: Mixed Access Environment (Urban Commercial Sidewalk)
- **Scene Name:** Urban Commercial Sidewalk
- **Visual Features:** Flat step-free pavement with roadside parked delivery van and sidewalk cafe bench.
- **Expected Score:** `70–80/100` (Mostly Accessible)
- **Key Takeaway for Judges:**
  - Moderate-severity risks generated for pathway obstacle (`-10 pts`) and vehicle proximity (`-15 pts`).
  - Score reflects navigable reality: wheelchair access is possible, but users must exercise caution navigating around obstructions.
  - Recommendation: *"Inspect pathway around detected items for sufficient navigation clearance."*

---

## Scenario 3: Clear Approach Environment (Accessible Hospital Plaza)
- **Scene Name:** Accessible Hospital Plaza
- **Visual Features:** Wide level grade paving, automatic sliding doors, 48-inch corridor clearance.
- **Expected Score:** `95–100/100` (Fully Accessible)
- **Key Takeaway for Judges:**
  - Confirmed absence of step barriers triggers positive reward: `+10 pts: Clear pathway verified`.
  - Executive insight confirms: *"No major visual barriers were detected in the analyzed area."*
  - Shows how the rules engine operates across the full 0–100 spectrum.

---

## Technical Audit Demo Step (For Technical Judges):
1. Expand the **Technical Audit & Judge Inspection Panel** below the results.
2. Highlight:
   - Model: Ultralytics YOLOv8n (CPU inference under 180ms)
   - Rule formulation: $S = \text{clamp}(100 - \sum P + \sum R, 0, 100)$
   - Pluggable `ExplanationProvider` architecture ensuring zero reliance on proprietary cloud services during core scoring.
