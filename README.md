# 🔍 PromptLens

## Designing Explainable Interfaces for Generative AI

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

> **A research prototype exploring explainability in generative AI systems through interactive visual interfaces**

---

## 📚 Table of Contents

- [Overview](#-overview)
- [Research Motivation](#-research-motivation)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [User Interface Guide](#-user-interface-guide)
- [Research Methodology](#-research-methodology)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🎯 Overview

**PromptLens** is an academic research prototype developed as part of a Final Year Project (FYP) at SLIIT. The system provides an interactive interface for understanding how generative AI models (text and image) interpret and respond to user prompts through visual explanations.

### Key Objectives

1. **Transparency** - Make AI decision-making processes visible to end users
2. **Trust Building** - Help users understand and calibrate trust in AI outputs
3. **Educational Value** - Demonstrate the relationship between prompts and outputs
4. **Research Foundation** - Provide a platform for studying XAI in generative contexts

---

## 🔬 Research Motivation

Modern generative AI systems often operate as "black boxes," making it difficult for users to understand:

- Why a particular output was generated
- Which parts of their prompt influenced specific aspects of the output
- How modifying their prompt might change the results
- Whether the AI's interpretation matches their intent

PromptLens addresses these challenges by providing:

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE EXPLAINABILITY GAP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User Intent  →  [  BLACK BOX  ]  →  AI Output                 │
│       ?              ?     ?     ?         ?                     │
│                                                                  │
│                    PromptLens Solution:                          │
│                                                                  │
│   User Intent  →  Segmented   →  Mapped    →  Explained         │
│       ↓           Analysis        Links        Output            │
│   [Subject]    →  ─────────────────────→  [Related text]        │
│   [Style]      →  ─────────────────────→  [Style elements]      │
│   [Context]    →  ─────────────────────→  [Context elements]    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🧩 Prompt Segmentation

Automatically breaks down user prompts into semantic segments using NLP:

| Segment Type  | Description            | Example                 |
| ------------- | ---------------------- | ----------------------- |
| **Subject**   | Main focus or entity   | "a majestic lion"       |
| **Action**    | Verbs and activities   | "running through"       |
| **Setting**   | Environment/location   | "the African savanna"   |
| **Style**     | Artistic modifiers     | "in oil painting style" |
| **Attribute** | Descriptive adjectives | "golden, powerful"      |
| **Mood**      | Emotional tone         | "dramatic, intense"     |

### 📊 Interactive Explanations

#### For Text Generation:

- **Sentence Mapping** - See which input segments influenced each output sentence
- **Contribution Scores** - Visual indicators showing segment importance (0-100%)
- **Highlight Linking** - Hover over segments to highlight related output

#### For Image Generation:

- **Attention Heatmaps** - Visual overlay showing focus areas
- **Region Mapping** - See which prompt parts influenced image regions
- **Compositional Analysis** - Understand spatial relationships

### 🔄 What-If Analysis

Compare original and modified prompts side-by-side:

```
┌────────────────────────┐    ┌────────────────────────┐
│   ORIGINAL PROMPT      │    │   MODIFIED PROMPT      │
│   "A red sports car"   │    │   "A blue vintage car" │
├────────────────────────┤    ├────────────────────────┤
│                        │    │                        │
│   [Generated Output]   │ vs │   [Generated Output]   │
│                        │    │                        │
├────────────────────────┤    ├────────────────────────┤
│   CHANGE ANALYSIS      │    │                        │
│   • Color: red → blue  │    │   Impact: HIGH         │
│   • Type: sports →     │    │   Confidence: 87%      │
│          vintage       │    │                        │
└────────────────────────┘    └────────────────────────┘
```

### 📈 Trust Metrics Dashboard

Interactive dashboard displaying:

- **Understandability** - How clear are the explanations?
- **Accuracy** - Do explanations match user expectations?
- **Consistency** - Are similar prompts treated similarly?
- **Usefulness** - Do explanations help improve prompts?

### 💬 User Feedback System

Collect structured feedback for research:

- Clarity ratings
- Helpfulness assessments
- Free-form suggestions
- Session-based tracking

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PROMPTLENS ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   USER      │
                              │  BROWSER    │
                              └──────┬──────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript)                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │   Prompt     │ │  Explainable │ │   What-If    │ │    Trust     │   │
│  │   Editor     │ │   Output     │ │   Analysis   │ │  Dashboard   │   │
│  │              │ │   Panel      │ │   Panel      │ │              │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      API Service Layer                           │   │
│  │   api.service.ts - Handles all backend communication            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ HTTP/REST
                                     │ Port 8000
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (FastAPI + Python)                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         API Endpoints                             │  │
│  │  POST /prompt/submit    POST /generate/text   POST /generate/image│  │
│  │  POST /explain/text     POST /explain/image   POST /whatif        │  │
│  │  POST /metrics/submit   GET  /metrics/summary GET  /health        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │     NLP      │ │    Text      │ │    Image     │ │   What-If    │   │
│  │   Service    │ │   Service    │ │   Service    │ │   Service    │   │
│  │  (spaCy/     │ │  (OpenAI)    │ │ (Replicate)  │ │  (Analysis)  │   │
│  │   NLTK)      │ │              │ │              │ │              │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Metrics Service                              │  │
│  │           In-memory storage for user feedback & analytics         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
           │   OpenAI     │ │  Replicate   │ │   Future     │
           │   GPT-4      │ │  Stable      │ │   AI APIs    │
           │   API        │ │  Diffusion   │ │              │
           └──────────────┘ └──────────────┘ └──────────────┘
```

### Data Flow

```
1. User enters prompt → Frontend segments preview
2. Submit → Backend /prompt/submit → NLP segmentation
3. Generate → Backend /generate/text or /generate/image
4. Explain → Backend /explain/text or /explain/image
5. Display → Frontend renders with interactive explanations
6. Feedback → Backend /metrics/submit → Analytics storage
```

---

## 🛠 Technology Stack

### Frontend

| Technology       | Purpose                 | Version |
| ---------------- | ----------------------- | ------- |
| **React**        | UI Framework            | 18.3.1  |
| **TypeScript**   | Type Safety             | 5.0+    |
| **Vite**         | Build Tool & Dev Server | 6.3.5   |
| **Tailwind CSS** | Styling                 | 4.1.3   |
| **Radix UI**     | Accessible Components   | Latest  |
| **Recharts**     | Data Visualization      | 2.15.2  |
| **Lucide React** | Icons                   | 0.487.0 |

### Backend

| Technology     | Purpose          | Version |
| -------------- | ---------------- | ------- |
| **Python**     | Runtime          | 3.10+   |
| **FastAPI**    | API Framework    | 0.104+  |
| **Pydantic**   | Data Validation  | 2.0+    |
| **spaCy/NLTK** | NLP Processing   | Latest  |
| **OpenAI**     | Text Generation  | API v1  |
| **Replicate**  | Image Generation | API v1  |

### Design System

- **Theme**: Light/Dark mode with Apple-inspired aesthetics
- **Effects**: Glass morphism, blur effects, smooth animations
- **Typography**: System font stack optimized for readability
- **Colors**: CSS custom properties for consistent theming

---

## 📦 Installation

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.10+
- **Git**

### Clone Repository

```bash
git clone https://github.com/sudharshan2002/promptlens.git
cd promptlens
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173` (or configured port).

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model (if using spaCy)
python -m spacy download en_core_web_sm

# Start backend server
uvicorn app:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# OpenAI Configuration (for text generation)
OPENAI_API_KEY=your_openai_api_key_here

# Replicate Configuration (for image generation)
REPLICATE_API_TOKEN=your_replicate_api_token_here

# Server Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:8080
```

### API Keys

| Service       | Purpose                             | Get Key                                            |
| ------------- | ----------------------------------- | -------------------------------------------------- |
| **OpenAI**    | Text generation (GPT-4)             | [platform.openai.com](https://platform.openai.com) |
| **Replicate** | Image generation (Stable Diffusion) | [replicate.com](https://replicate.com)             |

> **Note**: If API keys are not configured, the system will use mock responses for demonstration purposes.

---

## 📖 API Documentation

### Base URL

```
http://localhost:8000
```

### Interactive Docs

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Endpoints

#### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "service": "PromptLens Backend",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Submit Prompt

```http
POST /prompt/submit
Content-Type: application/json

{
  "prompt": "A majestic lion running through the African savanna at sunset"
}
```

**Response:**

```json
{
  "session_id": "uuid-string",
  "original_prompt": "A majestic lion running through...",
  "segments": [
    {
      "id": "seg_1",
      "text": "A majestic lion",
      "type": "subject",
      "confidence": 0.95,
      "start_idx": 0,
      "end_idx": 16
    },
    {
      "id": "seg_2",
      "text": "running through",
      "type": "action",
      "confidence": 0.89,
      "start_idx": 17,
      "end_idx": 32
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Generate Text

```http
POST /generate/text
Content-Type: application/json

{
  "session_id": "uuid-string",
  "segments": [...],
  "parameters": {
    "max_tokens": 500,
    "temperature": 0.7
  }
}
```

#### Generate Image

```http
POST /generate/image
Content-Type: application/json

{
  "session_id": "uuid-string",
  "segments": [...],
  "parameters": {
    "size": "1024x1024",
    "style": "vivid"
  }
}
```

#### What-If Analysis

```http
POST /whatif
Content-Type: application/json

{
  "original_prompt": "A red sports car",
  "modified_prompt": "A blue vintage car",
  "generation_type": "text"
}
```

#### Submit Metrics

```http
POST /metrics/submit
Content-Type: application/json

{
  "session_id": "uuid-string",
  "metric_type": "understandability",
  "value": 4,
  "feedback": "The explanations were clear"
}
```

---

## 🖥 User Interface Guide

### Main Interface Layout

```
┌────────────────────────────────────────────────────────────────┐
│  🔍 PromptLens           [Features] [Docs] [Support] [🌙/☀️]  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    PROMPT INPUT                          │  │
│  │  ┌─────────────────────────────────────────────────────┐│  │
│  │  │ Enter your prompt here...                           ││  │
│  │  │                                                      ││  │
│  │  └─────────────────────────────────────────────────────┘│  │
│  │  [📝 Text] [🖼️ Image]              [⚙️ Settings]        │  │
│  │                                                          │  │
│  │  SEGMENTS:                                               │  │
│  │  [Subject: majestic lion] [Action: running] [Setting: .]│  │
│  │                                                          │  │
│  │                    [✨ Generate]                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 EXPLAINABLE OUTPUT                       │  │
│  │  ┌─────────────────────────────────────────────────────┐│  │
│  │  │ Generated content with highlighted mappings...       ││  │
│  │  │ [Sentence 1] ─── influenced by [Subject segment]     ││  │
│  │  │ [Sentence 2] ─── influenced by [Action segment]      ││  │
│  │  └─────────────────────────────────────────────────────┘│  │
│  │                                                          │  │
│  │  CONTRIBUTION ANALYSIS:                                  │  │
│  │  Subject ████████████░░░░ 75%                            │  │
│  │  Action  ██████░░░░░░░░░░ 40%                            │  │
│  │  Setting ████████████████ 95%                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────────┐   │
│  │  WHAT-IF ANALYSIS    │  │  TRUST METRICS                │   │
│  │  [Edit & Compare]    │  │  📊 Dashboard                  │   │
│  └──────────────────────┘  └──────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### Interaction Patterns

1. **Hover Effects**: Hover over segments to highlight related output
2. **Click Actions**: Click segments to see detailed explanations
3. **Drag & Drop**: Reorder segments in What-If editor
4. **Tooltips**: Hover over metrics for detailed information

---

## 📊 Research Methodology

### Study Design

PromptLens is designed to support user studies evaluating:

1. **Perceived Understandability** - Do users feel they understand the AI's reasoning?
2. **Trust Calibration** - Does transparency lead to appropriate trust levels?
3. **Task Performance** - Do explanations help users create better prompts?
4. **User Satisfaction** - How do users rate the overall experience?

### Metrics Collection

The system collects the following anonymous metrics:

| Metric            | Scale  | Description                            |
| ----------------- | ------ | -------------------------------------- |
| Understandability | 1-5    | Clarity of explanations                |
| Accuracy          | 1-5    | Match between explanation and output   |
| Consistency       | 1-5    | Predictability of explanations         |
| Usefulness        | 1-5    | Practical value for prompt improvement |
| Confidence        | 0-100% | User confidence in AI output           |

### Data Privacy

- All data collection is **opt-in**
- No personal identifiable information (PII) is collected
- Session IDs are randomly generated UUIDs
- Data is stored in-memory (not persisted by default)

### ⚠️ Explainability Disclaimer

> **Important Research Context**
>
> PromptLens uses **proxy-based explainability techniques** rather than direct access to model internals. This is a deliberate design choice given that:
>
> 1. Commercial AI APIs (OpenAI, Replicate) do not expose internal attention weights or activation patterns
> 2. The explanations generated are **approximations** based on input-output analysis and prompt segmentation
> 3. Contribution scores and segment mappings are **heuristic estimates**, not ground-truth model explanations
>
> **This means:**
>
> - Explanations may not perfectly reflect actual model reasoning
> - Attention heatmaps for images are simulated based on prompt structure
> - What-if comparisons show output differences, but causal attribution is approximate
>
> This approach is common in applied XAI research where model internals are inaccessible. The system is designed to study whether _perceived_ transparency improves user trust and understanding, regardless of explanation fidelity.

### Research Limitations

This research prototype has the following known limitations:

| Limitation                   | Description                                  |
| ---------------------------- | -------------------------------------------- |
| **Black-box API dependency** | Cannot access true model attention/gradients |
| **Heuristic segmentation**   | NLP rules may misclassify edge cases         |
| **Simulated attention maps** | Image heatmaps are approximations            |
| **Sample size constraints**  | Academic study with limited participant pool |
| **Single-domain focus**      | Tested primarily on creative prompts         |
| **English-only**             | NLP pipeline optimized for English text      |

---

## 🗂 Project Structure

```
promptlens/
├── index.html                 # Entry HTML file
├── package.json               # Node.js dependencies
├── vite.config.ts            # Vite configuration
├── README.md                  # This file
│
├── backend/                   # Python FastAPI backend
│   ├── app.py                # Main FastAPI application
│   ├── models.py             # Pydantic data models
│   ├── nlp_service.py        # NLP segmentation service
│   ├── text_service.py       # Text generation & explanation
│   ├── image_service.py      # Image generation & explanation
│   ├── whatif_service.py     # What-if analysis service
│   ├── metrics_service.py    # Metrics collection service
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables (create this)
│
├── src/                       # React frontend source
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component
│   ├── index.css             # Tailwind imports
│   │
│   ├── components/           # React components
│   │   ├── PromptInput.tsx   # Prompt input field
│   │   ├── OutputPanel.tsx   # Generation output display
│   │   ├── WhatIfEditor.tsx  # What-if comparison tool
│   │   ├── Dashboard.tsx     # Trust metrics dashboard
│   │   ├── Navigation.tsx    # App navigation
│   │   ├── HeroSection.tsx   # Landing page hero
│   │   └── ui/               # Reusable UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ...
│   │
│   ├── services/             # API integration
│   │   ├── api.service.ts    # Backend API calls
│   │   └── api.types.ts      # TypeScript interfaces
│   │
│   └── styles/               # Global styles
│       └── globals.css       # CSS custom properties
│
└── public/                    # Static assets
```

---

## 🚀 Development

### Running Both Services

**Terminal 1 - Frontend:**

```bash
npm run dev
```

**Terminal 2 - Backend:**

```bash
cd backend
uvicorn app:app --reload --port 8000
```

### Building for Production

```bash
# Frontend build
npm run build

# Output in dist/ folder
```

### Code Style

- **Frontend**: ESLint + Prettier (configured in project)
- **Backend**: Black + isort for Python formatting
- **Commits**: Conventional commit messages recommended

---

## 🤝 Contributing

This is an academic project. Contributions are welcome for:

1. Bug fixes
2. Documentation improvements
3. Additional explanation visualizations
4. New AI model integrations

### Steps to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is developed for academic purposes as part of a Final Year Project at SLIIT.

**MIT License** - See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- **SLIIT** - Sri Lanka Institute of Information Technology
- **OpenAI** - GPT API for text generation
- **Replicate** - Stable Diffusion for image generation
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **FastAPI** - Modern Python web framework

---

## 📞 Contact

**Project Author**: [Your Name]  
**Institution**: SLIIT - Sri Lanka Institute of Information Technology  
**Program**: BSc (Hons) in Information Technology  
**Year**: Final Year Project 2024/2025

---

## 🔧 Changes and Implementation Log

### Critical Fixes Applied (January 2026)

| #   | Issue                                   | Fix                                                | File                           |
| --- | --------------------------------------- | -------------------------------------------------- | ------------------------------ |
| 1   | **Image generation used placeholder**   | Now calls `/generate/image` backend API            | `ExplainableMainInterface.tsx` |
| 2   | **Error fallback hid backend failures** | Shows error UI with dismiss button, clears outputs | `ExplainableMainInterface.tsx` |
| 3   | **Client-side explanation logic**       | Now uses `/explain/text` backend API               | `ExplainableMainInterface.tsx` |
| 4   | **Feedback only logged to console**     | Now submits to `/metrics/submit` backend API       | `ExplainableMainInterface.tsx` |

### API Integration Changes

```
BEFORE                              AFTER
──────────────────────────────────  ──────────────────────────────────
clientExplainText() [frontend]  →   POST /explain/text [backend API]
picsum.photos placeholder       →   POST /generate/image [backend API]
console.log(feedback)           →   POST /metrics/submit [backend API]
Mock data on error              →   Error state with clear message
```

### Key Implementation Details

1. **Backend-First Architecture**: All generation and explanation logic now routes through FastAPI backend
2. **Error Transparency**: Users see actual errors instead of mock data masking failures
3. **Proper Response Transformation**: Backend responses mapped to frontend TypeScript interfaces
4. **Session Tracking**: Feedback includes interaction counts, time spent, and session metadata

### Files Modified

- `src/components/ExplainableMainInterface.tsx` - Main interface with all API integrations
- `src/components/TrustMetricsDashboard.tsx` - Real metrics from `/metrics/summary`
- `backend/app.py` - CSV export endpoint added
- `README.md` - Disclaimer, limitations, and this changelog

---

<div align="center">

**Built with ❤️ for Explainable AI Research**

🔍 PromptLens - _Making AI Transparent_

</div>
