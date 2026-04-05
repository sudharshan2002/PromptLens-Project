# Frigate: Explainable AI Platform

**Final Year Project (FYP)**
- **Student Name:** Ravichandran Sudharshan
- **University:** University of Westminster
- **Student ID:** 20221703
- **Registration Number:** w1999512
- **Course:** BSc Computer Science Hons

---

## Overview

Frigate is a web-based platform designed to demystify generative AI models through Explainable AI (XAI) techniques. It provides users with tools to write, evaluate, and understand prompts for both text and image generation. 

By analyzing the structure of prompts, providing live feedback, and visualizing the "What-If" impact of specific words, Frigate empowers users to write more effective instructions while understanding the internal priors and biases of the underlying underlying models.

### Key Features
- **Prompt Composer:** Real-time generation of images and text using integrated APIs (Groq, Hugging Face).
- **Live Analysis:** Immediate feedback on the clarity, trust, and quality of a draft prompt.
- **Explainability Engine:** A token-level segmenter that identifies objects, styles, environments, and lighting cues to show exactly how a prompt influenced the output.
- **What-If Analysis:** Automated counterfactual testing that removes prompt segments to measure and visualize their structural impact on the generated result.
- **Analytics Dashboard:** Session tracking and aggregate usage metrics powered by Supabase.

---

## Workspace Structure

- **`frontend/`**: The React/Vite web application providing the user interface, state management, and API integrations.
- **`backend/`**: The FastAPI Python server handling generation, metric routing, explainability scoring, and orchestrating API calls.
- **`training/` & `models/`**: Scripts, model weights, and datasets used to curate public instruction datasets and train the prompt segmentation classification models.
- **`supabase/`**: SQL schema and configurations for Postgres authentication and data persistence.

---

## Running the code

Run `npm i` from the project root to install the frontend dependencies.

Run `npm run dev` from the project root to start the Vite site.

Set `VITE_DEMO_MODE=true` in `.env.local` if you want the frontend to use seeded demo data without calling the backend.

The frontend expects the FastAPI backend at `http://127.0.0.1:8000` unless `VITE_API_URL` is set in `.env.local`.

The Vite app now lives in `frontend/`, but the root scripts still proxy to it so the local workflow stays the same.

## Supabase auth setup

This project uses Supabase Auth for login and Supabase Postgres for persisted profile and app-session history. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor to create `public.profiles`, `public.app_sessions`, and the RPC helpers the frontend uses for dashboard/session history.

For local auth to work cleanly:

1. In Supabase, set the site URL to the exact frontend origin you actually open in the browser.
   Local examples: `http://localhost:5173` or `http://localhost:3000`.
2. Add that same origin's `/auth/callback` route to your redirect URLs.
   Local examples: `http://localhost:5173/auth/callback` or `http://localhost:3000/auth/callback`.
3. If you want local development to always build callback links against a fixed origin, set `VITE_SITE_URL` in `.env.local`.
   The app only uses that override on `localhost` or `127.0.0.1`, so deployed domains continue using their real browser origin.
4. If you deploy the frontend, add the deployed `/auth/callback` URL there too.
5. In Google Cloud, open your OAuth 2.0 client and add your Supabase callback URL to `Authorized redirect URIs`.
   For this project, that is `https://culmogqueuddchdmetyt.supabase.co/auth/v1/callback`.
6. In `Authentication -> Providers -> Google`, enable Google and paste your Google OAuth client ID and secret.

Important:

- Supabase `Redirect URLs` should contain the exact app callback route you use locally, such as `http://localhost:5173/auth/callback` or `http://localhost:3000/auth/callback`.
- Google `Authorized redirect URIs` should contain the Supabase Auth callback URL, not your frontend callback route.
- `redirectTo` in `signInWithOAuth()` tells Supabase where to send the browser after Auth finishes. It does not replace the Google callback URI.
- If Supabase cannot use your requested callback URL, it falls back to the `Site URL`. That is why a bad local setup often lands on `http://localhost:3000/#access_token=...`.

After that:

- `Authentication -> Users` shows signed-in accounts.
- `Table Editor -> profiles` shows the profile rows created by the SQL script.
- `Table Editor -> app_sessions` shows stored composer and what-if history for each scoped visitor.
- OAuth, magic links, and email confirmations all return through `/auth/callback` before routing the user into `/dashboard` or `/profile`.

## Running the backend locally

1. Create a Python virtual environment.
2. Install the backend requirements with `pip install -r backend/requirements.txt`.
3. Optional: copy `backend/.env.example` to `backend/.env` and fill in any API keys you want to use.
4. Start the backend from the project root with `npm run backend`.

You can also run it directly with:

`python backend/run.py`

The API will start on `http://127.0.0.1:8000` by default and exposes:

- `GET /health`
- `POST /api/generate`
- `POST /api/what-if`
- `POST /api/analyze`

If `npm run backend` does not work, check these common issues:

1. Python is not installed or not available on your `PATH`.
2. Your virtual environment was created with a Python path that no longer exists.
3. The backend dependencies were not installed into the active environment.

## Deploying the backend to Render

This repo now includes a root `render.yaml` blueprint for the FastAPI backend.

Render service settings:

1. Create a new Blueprint service from this repository.
2. Render will use `backend/` as the service root.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn run:app --host 0.0.0.0 --port $PORT`
5. Health check path: `/health`
6. A persistent disk is no longer required for app session history because that data lives in Supabase.

Environment variables to set in Render:

- `CORS_ORIGINS`: your frontend origin, for example `https://your-frontend-domain.com`
- `GROQ_API_KEY`: required for live Groq text generation
- `HF_TOKEN`: required for live Hugging Face image and vision generation
