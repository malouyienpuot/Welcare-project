# WelCare SaniTech — mobile-friendly web app

This is a standalone HTML, CSS and JavaScript storefront. It uses the existing FastAPI backend in `../backend`; no React or Node build is required.

## Files
- `index.html` — page structure and checkout form
- `style.css` — responsive desktop and mobile styling
- `app.js` — product API calls, search, category filters, cart and checkout

## Run locally
1. Start the Python API:
   ```bash
   cd backend
   python -m venv .venv
   # Windows: .venv\Scripts\activate
   # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
2. Serve the `mobile-app` directory with VS Code Live Server, or:
   ```bash
   cd mobile-app
   python -m http.server 5500
   ```
3. Open `http://localhost:5500`. The API defaults to `http://127.0.0.1:8000`.

If the API is hosted elsewhere, set `window.WELCARE_API_BASE` before loading `app.js`, or edit the `API_BASE` constant at the top of `app.js`.

## Remote deployment
Deploy the Python `backend` folder to a Python host that supports FastAPI and persistent storage. Set `WELCARE_ALLOWED_ORIGINS` on the backend to the exact frontend origin(s), comma-separated. Then configure `API_BASE` in `app.js` to the deployed HTTPS API URL. Deploy `mobile-app` as a static site (GitHub Pages, Netlify or similar).

The frontend falls back to sample products if the API is unavailable; checkout requires a working API. The only payment option currently enabled is a demo checkout, not a live payment transaction. Do not collect card numbers or M-Pesa PINs in this demo.
