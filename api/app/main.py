from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="hwverify api")

# Dev convenience: the Vite dev server proxies /api, but allow the SvelteKit
# origin directly too in case you hit the API without the proxy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/metrics")
def metrics():
    # Stand-in verification data so you have something to chart immediately.
    return {"series": [{"stage": f"T{i}", "pass_rate": 90 + i} for i in range(8)]}
