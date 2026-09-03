// Backend API base URL.
//
// Local dev: defaults to the FastAPI dev server on localhost.
// Production (Vercel): set VITE_API_URL in the project's Environment Variables
// to your deployed backend URL, e.g. https://your-app.onrender.com
// Vite bakes this in at build time.
//
// Trailing slash(es) are stripped defensively — a value like
// "https://your-app.onrender.com/" would otherwise produce a double slash
// when we append "/api/...", which most backends 404 on.
const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');
