PromptLens

An Explainable Interface for Generative AI Systems

Author: Sudharshan Ravichandran
Institution: IIT
Degree: Undergraduate Research Project
Year: 2024–2025

Abstract

PromptLens is a research prototype that explores explainability in modern generative AI systems. While large language and image generation models produce high-quality outputs, their internal decision-making processes remain opaque to end users. This project investigates whether interactive prompt decomposition and output-level explanations can improve user understanding, trust, and control over generative AI behaviour.

The system provides a web-based interface that segments user prompts into semantic components and visually links these components to generated outputs. PromptLens is designed as an experimental platform to support explainable AI (XAI) research in black-box generative models accessed via commercial APIs.

Research Objectives

The primary objectives of PromptLens are:

To explore explainability techniques for black-box generative AI systems

To visualise how different parts of a user prompt influence generated outputs

To study whether explanation interfaces improve user trust and prompt refinement

To provide a reusable experimental platform for XAI research in generative contexts

Problem Statement

Generative AI models such as large language models and diffusion-based image generators operate as black boxes. Users typically receive only final outputs, with no visibility into:

Which parts of their prompt influenced specific outputs

Why the model interpreted the prompt in a particular way

How modifying prompt structure changes results

This lack of transparency limits trust, usability, and effective human-AI collaboration. PromptLens addresses this problem by introducing an explainable interaction layer between the user and the generative model.

System Overview

PromptLens consists of a frontend explainability interface and a backend API layer that coordinates segmentation, generation, and explanation logic.

High-level workflow

User enters a prompt

Prompt is segmented into semantic components

Segments are sent to the backend for generation

Generated output is analysed and mapped back to input segments

Explanations are visualised interactively in the UI

Key Features
Prompt Segmentation

Automatic decomposition of prompts into semantic units

Categories include subject, style, context, modifier, and action

Editable segments for user-driven refinement

Explainable Text Generation

Sentence-level attribution to prompt segments

Contribution scoring for each segment

Interactive highlighting between input and output

Explainable Image Generation

Prompt-to-image influence mapping

Region-based explanation overlays

Compositional analysis based on prompt structure

What-If Analysis

Side-by-side comparison of original and modified prompts

Impact analysis of prompt changes

Output difference explanation

Trust and Feedback Metrics

User-rated understandability and usefulness

Session-based interaction tracking

Aggregated research metrics dashboard

Architecture
Frontend

Interactive explainability interface

Prompt editor with live segmentation

Visual explanation panels

Backend

REST API built with FastAPI

Prompt processing and segmentation services

Generation and explanation orchestration

Metrics and feedback collection

External AI Services

Text generation via OpenAI API

Image generation via Replicate (Stable Diffusion)

Technology Stack
Frontend

React

TypeScript

Vite

Tailwind CSS

Lucide Icons

Recharts

Backend

Python

FastAPI

Pydantic

spaCy / NLTK

OpenAI API

Replicate API

Installation and Setup
Prerequisites

Node.js 18+

Python 3.10+

Git

Clone Repository
git clone https://github.com/sudharshan2002/promptlens.git
cd promptlens

Frontend
npm install
npm run dev

Backend
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app:app --reload --port 8000

Configuration

Create a .env file inside the backend/ directory:

OPENAI_API_KEY=your_openai_api_key
REPLICATE_API_TOKEN=your_replicate_api_token
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

Explainability Disclaimer

PromptLens does not access internal model weights, attention maps, or gradients. All explanations are proxy-based, derived from prompt segmentation, output comparison, and heuristic attribution techniques.

As a result:

Explanations represent approximations of model behaviour

Attribution scores are not ground-truth model reasoning

Image attention visualisations are simulated

This approach reflects real-world constraints when working with closed-source AI APIs and aligns with common practices in applied XAI research.

Research Limitations

Black-box dependency on external APIs

Heuristic-based segmentation may misclassify edge cases

Image explanations are approximate

English-only language support

Limited participant sample size for evaluation

Intended Use

This project is intended for:

Academic research and experimentation

Explainable AI interface studies

Human-AI interaction research

Educational demonstrations

It is not intended for production deployment.

License

MIT License
This project is developed for academic research purposes.

Author

Sudharshan Ravichandran
Undergraduate Researcher
IIT
Final Year Project (2024–2025)