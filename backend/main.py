from __future__ import annotations

"""FastAPI application entrypoint.

Run from inside the ``backend/`` directory:

    uvicorn main:app --reload
"""

from typing import Dict, List

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import PROVIDERS, settings
from routers.generate import router as generate_router

APP_TITLE = "Smart Meeting & Work Summary Assistant API"

app = FastAPI(title=APP_TITLE, version="1.0.0")

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
_origins = settings.cors_origins()
_allow_credentials = _origins != ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helper / health endpoints
# ---------------------------------------------------------------------------
@app.get("/")
def root() -> Dict[str, object]:
    return {
        "name": APP_TITLE,
        "status": "ok",
        "providers": list(PROVIDERS.keys()),
    }


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/providers")
def providers() -> List[Dict[str, object]]:
    """Public provider metadata for the Settings UI (no secrets)."""
    result: List[Dict[str, object]] = []
    for provider_id, entry in PROVIDERS.items():
        result.append(
            {
                "id": provider_id,
                "default_model": entry["default_model"],
                "supports_json_mode": entry["supports_json_mode"],
            }
        )
    return result


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
app.include_router(generate_router)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
