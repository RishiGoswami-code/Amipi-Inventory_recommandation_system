# AMIPI AI Intern Assignment - Project 3: Event-Aware Inventory Recommendation Tool

A production-grade, event-aware restocking recommendation application for fine jewelry inventory. Built using **FastAPI** (Python backend), **React** (Vite, clean minimalist UI), and **OpenRouter API** (AI business reasoning).

---

## 🖥️ Dashboard Walkthrough

- **Compact header** — just the logo and a single **Upload CSV** button. No clutter; recommendations for the bundled dataset load automatically on open.
- **Upload CSV, guided** — clicking Upload CSV opens a modal that first explains, in plain language, exactly what the file needs (which columns are required vs. optional) before you pick a file, so it's hard to upload the wrong thing.
- **Priority-first table** — columns are ordered the way you'd actually scan them: Style → Priority → Order Qty → Stock & Sales → Event → Business Rationale → Details. The dense formula breakdown (all 5 calculation steps) lives one click away behind the Details (ⓘ) button instead of crowding the table.
- **Smart default sort** — rows are sorted **High → Medium → Low → Do Not Reorder** by default, and within each priority tier, by `suggested_order_qty` (the actual stock/sales gap) descending — so the single most urgent reorder in the whole table is always the very first row. This tiebreak applies no matter which column you click to sort.
- **Hover for the full reason** — the Business Rationale column shows a clean two-line preview; hovering it pops a small floating card with the complete sentence, instead of relying on the browser's plain tooltip.
- **Light, minimalist theme** — white cards on a soft gray background, subtle shadows instead of heavy borders, and priority badges colored for quick scanning (rose = High, amber = Medium, green = Low, violet = Do Not Reorder).

---

## 📐 Formulas & Priority Business Logic

### Deterministic Formulas
1. $$\text{available\_inventory} = \text{current\_stock} + \text{on\_order}$$
2. $$\text{monthly\_sales\_rate} = \frac{\text{last\_90\_day\_sales}}{3}$$
3. $$\text{projected\_demand\_until\_event} = \text{monthly\_sales\_rate} \times \left(\frac{\text{days\_until\_event}}{30}\right)$$
4. $$\text{recommended\_stock\_needed} = \text{projected\_demand\_until\_event} \times \text{event\_multiplier}$$
5. $$\text{suggested\_order\_qty} = \max\left(0, \text{round}(\text{recommended\_stock\_needed} - \text{available\_inventory})\right)$$

### Priority Rules & Overrides
- **Override Rule (Do Not Reorder)**: If `last_90_day_sales` $\le 3$ AND `current_stock` $\ge 8$, the item is classified as **"Do Not Reorder"** (overrides normal priority).
- **High Priority**: `suggested_order_qty >= 5` OR (`current_stock <= 2` AND `last_90_day_sales >= 10`).
- **Medium Priority**: `suggested_order_qty` is between 2 and 4, OR (`current_stock <= 3` AND `last_90_day_sales >= 6`).
- **Low Priority**: `suggested_order_qty` is 0 or 1.

---

## 🤖 AI vs. Deterministic Logic

| Component | Responsibility | Provider / Engine |
| :--- | :--- | :--- |
| **Numerical Calculations** | 100% Deterministic (Formulas strictly evaluated) | Python Core (`app/engine.py`) |
| **Priority & Overrides** | 100% Deterministic (Rules strictly evaluated) | Python Core (`app/engine.py`) |
| **Business Rationale (`reason`)** | Plain-English explanation (no jargon) | **OpenRouter API** (`openai/gpt-4o-mini`) |
| **Offline Rationale Fallback** | Plain-English, rule-based template — same friendly tone | Python Domain Engine (`app/ai_service.py`) |

> **Critical Safety Guarantee**: The AI model **never** calculates or alters numerical quantities or priority assignments. It strictly receives calculated results and converts them into a simple, one-sentence explanation anyone can read in one go — e.g. *"The 14W Lab Grown Diamond Band is selling fast (20 sold in the last 90 days), and JCK Vegas will push demand even higher — order 8 more units so you don't run out."*

---

## 🚀 Setup & Local Execution Guide

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm

---

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
# Activate on Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set your OpenRouter API Key in backend/.env
# OPENROUTER_API_KEY=your_key_here

# Run backend unit tests
python -m pytest tests

# Start FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```
Backend server runs at: `http://localhost:8000` (API documentation available at `http://localhost:8000/docs`).

---

### 2. Frontend Setup (React SPA)

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend client runs at: `http://localhost:5173` (or port indicated in terminal).

---

## ☁️ Deploying: Backend on Railway, Frontend on Vercel

The frontend calls the backend through a configurable base URL (`VITE_API_URL`, see [`src/config.js`](frontend/src/config.js)) — it defaults to `http://localhost:8000` for local dev, so nothing extra is needed until you actually deploy.

### Backend → Railway
1. Create a new Railway project from this repo, and set its **Root Directory** to `Amipi-Inventory_recommandation_system/backend`.
2. Railway will detect `requirements.txt` and use [`Procfile`](backend/Procfile) (`web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`) to start the service — no extra build config needed.
3. In the service's **Variables** tab, optionally set `OPENROUTER_API_KEY` (and `OPENROUTER_MODEL` if you want a model other than `openai/gpt-4o-mini`). Without a key, the app runs entirely on the deterministic fallback reasoning — no functionality is lost.
4. The bundled dataset ships inside `backend/data/` so it deploys with the service — no separate storage needed for the defaults.
5. Once deployed, copy the public URL Railway gives the service (e.g. `https://your-app.up.railway.app`) — you'll need it for the frontend.

### Frontend → Vercel
1. Import this repo into Vercel and set its **Root Directory** to `Amipi-Inventory_recommandation_system/frontend`. Vercel auto-detects the Vite build (`npm run build`, output `dist`).
2. In **Project Settings → Environment Variables**, add `VITE_API_URL` = your Railway backend URL from above (no trailing slash). This gets baked into the build, so redeploy after changing it.
3. Deploy. The site will call your Railway backend directly for every request.

### Good to know before you deploy
- **Nothing is persisted** — there's no database. Every recommendation (including the AI `reason` text) is computed fresh on each request; nothing is cached or saved to disk.
- **Uploaded CSVs are not saved** — a custom CSV uploaded through the UI is used for that single response only. Refreshing the page (or a Railway restart/redeploy) reverts to the bundled default dataset.
- If `OPENROUTER_API_KEY` is set, every page load/refresh triggers a fresh OpenRouter call per row — there's no caching, so be mindful of API cost on a public deployment.

---

## 📝 Required Sample Outputs (At Least 3)

### Sample Output 1: Medium Priority Reorder
```json
{
  "style_number": "B401400-14WVS",
  "available_inventory": 7,
  "monthly_sales_rate": 4.67,
  "projected_demand_until_event": 5.44,
  "event_multiplier": 2.0,
  "recommended_stock_needed": 10.89,
  "suggested_order_qty": 4,
  "priority": "Medium",
  "recommendation": "Reorder",
  "reason": "The 14W Natural Diamond Band has been selling steadily (14 sold in the last 90 days), and JCK Vegas is coming up — ordering 4 more units should keep you well covered."
}
```

### Sample Output 2: High Priority Reorder
```json
{
  "style_number": "LB401400-14WVS",
  "available_inventory": 8,
  "monthly_sales_rate": 6.67,
  "projected_demand_until_event": 7.78,
  "event_multiplier": 2.0,
  "recommended_stock_needed": 15.56,
  "suggested_order_qty": 8,
  "priority": "High",
  "recommendation": "Reorder",
  "reason": "The 14W Lab Grown Diamond Band is selling fast (20 sold in the last 90 days), and JCK Vegas will push demand even higher — order 8 more units so you don't run out."
}
```

### Sample Output 3: Override Rule (Do Not Reorder)
```json
{
  "style_number": "B901500-14YS",
  "available_inventory": 9,
  "monthly_sales_rate": 1.0,
  "projected_demand_until_event": 2.0,
  "event_multiplier": 1.5,
  "recommended_stock_needed": 3.0,
  "suggested_order_qty": 0,
  "priority": "Do Not Reorder",
  "recommendation": "Do Not Reorder",
  "reason": "You already have plenty of the 14Y Sapphire Band on hand (9 units), and it's barely selling (3 sold in the last 90 days) — no need to reorder right now."
}
```

---

## 🛡️ Input Validation & Error Handling

- **Header Validation**: Verifies that uploaded CSV files contain all mandatory columns (`style_number`, `last_90_day_sales`, `current_stock`, `on_order`, `event`, `days_until_event`).
- **Data Type Safety**: Rejects negative values or non-integer inputs gracefully with line-by-line line number diagnostics.
- **OpenRouter Resiliency**: Automatically catches network timeouts, missing API keys, or HTTP errors, seamlessly falling back to deterministic template generation without crashing.