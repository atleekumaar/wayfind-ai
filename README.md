# WAYFIND AI
> **Visual Intelligence for Accessible Places**

WAYFIND AI is an AI-powered accessibility intelligence system that analyzes photos of physical environments (streets, sidewalks, building entrances, and public facilities) to estimate physical accessibility, detect barriers, and guide people before they arrive.

---

## 🌍 The Problem

Physical accessibility infrastructure is poorly mapped and inconsistently maintained across cities worldwide. Over 1.3 billion people globally live with significant disabilities, including wheelchair users, mobility-impaired individuals, and the elderly. 

Currently, users often arrive at an entrance only to encounter sudden flights of stairs, blocked curb ramps, or impassable obstacles without advance warning. Existing mapping applications rarely provide fine-grained visual ground truth on accessibility barriers.

## 💡 The Solution

WAYFIND AI transforms standard smartphone and camera imagery into **actionable accessibility intelligence**.

Instead of treating accessibility assessment as an unverified LLM prediction, WAYFIND combines **real-time computer vision** with a **transparent, deterministic rules engine**:

```
      IMAGE
        │
        ▼
   Computer Vision (YOLOv8)
        │
   Detected Objects & Bounding Boxes
        │
        ▼
┌───────────────────────────────┐
│   Accessibility Rules Engine  │
│   (Deterministic 0–100 Score) │
└───────────────┬───────────────┘
                │
                ▼
     RISKS & RECOMMENDATIONS
                │
                ▼
       WAYFIND REPORT & UI
```

---

## ⚡ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend API**: Python 3.12, FastAPI, Pydantic, Uvicorn
- **Computer Vision & ML**: PyTorch, Ultralytics YOLOv8, OpenCV, Pillow, NumPy
- **Testing**: PyTest, FastAPI TestClient

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+ (64-bit)
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The FastAPI Swagger documentation will be available at:  
👉 [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open the dashboard in your browser at:  
👉 [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing

Run backend unit and integration tests:
```bash
cd backend
.venv\Scripts\pytest -v
```

Tests verify:
- Bounded scoring ($0 \le \text{Score} \le 100$)
- Rule penalties (stairs, obstacles, vehicles)
- Classification thresholds (Fully / Mostly / Partially / Limited Accessible)
- Input image verification (MIME types, size limits, corruption checks)

---

## 🔍 Current Limitations (Day 1 MVP)

In the spirit of technical honesty:
- **Pretrained Weights**: The Day 1 implementation leverages a lightweight COCO-pretrained YOLO model. Standard COCO classes excel at detecting obstacles (benches, chairs, fire hydrants), vehicles blocking accessways, and crowd density. Dedicated classes like ramps, tactile paving, and minor surface defects require custom fine-tuning.
- **Single Monocular Frame**: Depth estimation and slope grade calculations currently rely on visual heuristics rather than metric LiDAR or stereo depth.

---

## 🔮 Future Work (Day 2 and Beyond)

- **Dedicated Accessibility Dataset**: Fine-tuning YOLOv8 on specialized accessibility datasets (ramps, curb cuts, automatic doors, tactile paving).
- **Metric Depth & Slope Estimation**: Monocular depth estimation (Depth Anything / MiDaS) to measure exact ramp slopes.
- **LiDAR Integration**: Incorporating 2.5D point-cloud data and foveated LiDAR sensors.
- **Natural Language Explanations**: Multimodal LLM synthesis layer to generate conversational audio navigation cues for visually impaired users.
- **Crowdsourced GIS Integration**: Geo-tagging analyses for smart city infrastructure audits and OpenStreetMap accessibility overlays.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
