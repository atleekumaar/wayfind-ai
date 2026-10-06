# Responsible AI & Transparency Framework

In assistive technology, automated scoring errors have real-world physical consequences. A false sense of security can strand an electric wheelchair user in front of unexpected stairs, while overly pessimistic scores penalize accessible venues. 

WAYFIND AI adheres to strict Responsible AI guidelines built into its code and architecture.

---

## 1. The Core Principle: Absence of Evidence ≠ Evidence of Absence

> **"Absence of evidence is not evidence of absence. WAYFIND explicitly refuses to penalize places for unobserved accessibility features."**

A standard 2D photograph taken from street level might not capture a ramp located around a building corner, or tactile paving obscured by lighting angle. 

Traditional naive scoring models penalize images when a ramp is not detected. **WAYFIND strictly rejects this practice.** Unobserved specialized features receive:
- Status: `unknown`
- Source: `not_supported_by_current_model` / `unobserved`
- Point Penalty: **Exactly 0 points**
- Transparent Disclosure: Highlighted in the "What WAYFIND Cannot Verify" inspection panel.

---

## 2. Strict Model Class Boundaries

WAYFIND AI openly acknowledges the native capabilities and limitations of its computer vision model:
- **Base Detector:** Ultralytics YOLOv8n pretrained on MS-COCO (80 object classes).
- **Native Detected Classes:** General barriers (`chair`, `bench`, `potted plant`, `suitcase`), blocking vehicles (`car`, `truck`, `bus`, `motorcycle`, `bicycle`), and pedestrian presence (`person`).
- **Unsupported Specialized Features:** Wheelchair ramps, tactile paving, automatic door openers, slope percentages, and curb cuts are **not** claimed as native YOLO detections. They require dedicated models or multi-modal sensing.

---

## 3. Grounded, Read-Only LLM Explanations

In WAYFIND AI, natural language summaries are strictly grounded in deterministic evidence:
- **Scoring Engine:** 100% deterministic arithmetic in Python.
- **LLM Role:** Strictly semantic translation and clear articulation for assistive usability.
- **Hard Constraint:** The LLM has zero capability to alter the numerical score, add unobserved objects, or hallucinate physical features.

---

## 4. Assessment Scope & Safety Guardrails

- **Scope Delimitation:** Every response is explicitly tagged with `assessment_scope: "visible_area_only"`.
- **Not a Navigation Replacement:** WAYFIND provides pre-arrival situational awareness, not turn-by-turn navigation or safety-critical life-support routing.
- **High-Contrast & Multi-Modal Output:** Includes visual annotations, tabular factor audits, and browser-native text-to-speech audio narration (`window.speechSynthesis`) for screen reader users and low vision travelers.
