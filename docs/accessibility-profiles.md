# Accessibility Profiles & Mobility Personas

WAYFIND AI avoids one-size-fits-all evaluations. A 2-inch curb or loose chair has vastly different implications for an electric wheelchair user compared to a person with a walker or a parent pushing a stroller.

---

## 1. Supported Profiles

WAYFIND AI natively supports 5 mobility profiles configured via the `profile` query parameter (`POST /api/v1/analyze?profile=...`) or via multi-view analysis (`POST /api/v1/analyze-multiview`):

| Profile Key | Persona Name | Key Assistive Needs | Critical Barriers |
|---|---|---|---|
| `general` | General Mobility (Default) | Standard urban pedestrian traversal | Stairs, blocking vehicles, heavy obstructions |
| `wheelchair` | Manual & Power Wheelchair | Flat grade, minimum 90cm width, zero vertical steps | Any step/stairs, steep slope, narrow pinch points |
| `walker` | Walker / Cane / Crutches | Stable footing, resting benches, trip-free path | Ground clutter, uneven surfaces, street furniture |
| `stroller` | Stroller / Cart | Rolling clearance, curb-free transitions | Steps, high curbs, crowded walkways |
| `low_vision` | Low Vision / Sensory | Clear ground contrast, absence of head-height & shin-height hazards | Unmarked benches, low bollards, sudden obstacles |

---

## 2. Profile Weighting Matrix

Penalties for detected visual features are modulated dynamically based on the active profile:

```python
PROFILE_WEIGHTS = {
    "wheelchair": {
        "stairs": 1.25,        # Vertical step is an absolute blockage
        "curb": 1.15,
        "narrow_path": 1.30,
        "obstacle": 1.00,
        "vehicle": 1.10,
    },
    "walker": {
        "stairs": 1.00,
        "curb": 1.00,
        "obstacle": 1.35,      # Ground clutter creates tripping risk
        "narrow_path": 1.05,
        "vehicle": 1.00,
    },
    "stroller": {
        "stairs": 1.20,
        "curb": 1.05,
        "narrow_path": 1.10,
        "obstacle": 1.00,
        "vehicle": 1.00,
    },
    "low_vision": {
        "stairs": 1.15,
        "obstacle": 1.40,      # High sensitivity to unexpected path obstacles
        "narrow_path": 1.20,
        "vehicle": 1.20,
    },
    "general": {
        "stairs": 1.00,
        "obstacle": 1.00,
        "vehicle": 1.00,
        "narrow_path": 1.00,
    },
}
```

---

## 3. Profile-Specific Recommendations

In addition to adjusting score deductions, the recommendation engine adapts guidance:

- **Wheelchair:** Recommends step-free alternatives, zero-curb routes, and wide passage clearances.
- **Walker:** Recommends continuous level surfaces and alerts to trip-prone obstacles.
- **Stroller:** Flags curb ramps and smooth rolling corridors.
- **Low Vision:** Generates high-contrast spatial warnings and audio-narration friendly summaries.
