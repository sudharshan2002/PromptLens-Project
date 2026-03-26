
## Running the code

Run `npm i` to install the frontend dependencies.

Run `npm run dev` to start the Vite site.

The frontend now expects the FastAPI backend at `http://127.0.0.1:8000` via `.env.local`.

Backend setup:

1. Create a Python environment and install `backend/requirements.txt`.
2. Copy `backend/.env.example` if you want a fresh local config.
3. Run `python backend/run.py` from the project root once FastAPI dependencies are installed.
