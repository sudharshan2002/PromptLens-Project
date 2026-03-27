
## Running the code

Run `npm i` to install the frontend dependencies.

Run `npm run dev` to start the Vite site.

The frontend now expects the FastAPI backend at `http://127.0.0.1:8000` via `.env.local`.

Backend setup:

1. Create a Python environment and install `backend/requirements.txt`.
2. Copy `backend/.env.example` if you want a fresh local config.
3. Run `python backend/run.py` from the project root once FastAPI dependencies are installed.

## Deploying the backend to Render

This repo now includes a root `render.yaml` blueprint for the FastAPI backend.

Render service settings:

1. Create a new Blueprint service from this repository.
2. Render will use `backend/` as the service root.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn run:app --host 0.0.0.0 --port $PORT`
5. Health check path: `/health`
6. The included blueprint uses the paid `starter` plan because the backend stores SQLite data on a persistent disk.

Environment variables to set in Render:

- `CORS_ORIGINS`: your frontend origin, for example `https://your-frontend-domain.com`
- `GROQ_API_KEY`: required for live Groq text generation and prompt analysis
- `HF_TOKEN`: required for live Hugging Face image and vision generation

Persistence notes:

- The blueprint mounts a persistent disk at `/var/data`.
- `SQLITE_DB_PATH` is set to `/var/data/metrics.db` so sessions and metrics survive restarts.
- If you deploy without a disk, Render's filesystem is ephemeral and SQLite data will be lost on redeploy/restart.
