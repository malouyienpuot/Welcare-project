# WelCare SaniTech

A full-stack e-commerce starter for reusable sanitary pads and pocket hand sanitizers.

## Stack
- React + Vite (HTML/CSS/JavaScript)
- FastAPI + Python
- SQLite + SQLAlchemy
- Server-side order totals and demo payment flow

## Features
- Product catalogue, category filters, cart and checkout
- KES pricing and delivery fee calculation
- Smart basket assistant (rule-based suggestions; no external AI service)
- Order creation and confirmation
- Demo payment simulation; no card/PIN data is collected
- SQLite persists products, orders and order items

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
API: http://127.0.0.1:8000/docs

### Frontend
In another terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL (usually http://localhost:5173). The frontend proxies `/api` to FastAPI.

## Demo checkout
Choose **Demo payment** at checkout. This records a demo-paid order in SQLite. It is not a live M-Pesa/card transaction. To accept real payments, integrate a provider such as Safaricom Daraja or a licensed payment gateway on the server, using environment secrets and verified callbacks.

## AI-assisted pricing note
The assistant currently uses transparent local rules to recommend a bundle and calculate savings. Final totals are always recalculated and validated by the API; this is not a connected generative-AI model.

## Configuration
Set `VITE_API_BASE` only if the API is hosted separately. For production, configure CORS to trusted origins, HTTPS, authentication/admin access, rate limiting, backups, and a real payment provider before accepting customer payments.
