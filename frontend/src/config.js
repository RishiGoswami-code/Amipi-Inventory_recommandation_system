// Backend API base URL.
//
// Local dev: defaults to the FastAPI dev server on localhost.
// Production (Vercel): set VITE_API_URL in the project's Environment Variables
// to your deployed Railway backend URL, e.g. https://your-app.up.railway.app
// (no trailing slash). Vite bakes this in at build time.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
