from __future__ import annotations

"""Pydantic request/response models (v2, Python 3.9 compatible)."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------
class GenerateRequest(BaseModel):
    """Base request: raw notes plus optional per-request provider overrides."""

    text: str = Field(..., min_length=1, description="Raw, unstructured notes to transform.")
    provider: Optional[str] = Field(default=None, description="Provider id override.")
    api_key: Optional[str] = Field(default=None, description="Per-request API key override.")
    model: Optional[str] = Field(default=None, description="Model id override.")


class SummaryRequest(GenerateRequest):
    pass


class EmailRequest(GenerateRequest):
    tone: Literal["professional", "friendly", "executive", "concise"] = "professional"


class DailyReportRequest(GenerateRequest):
    pass


class WeeklyReportRequest(GenerateRequest):
    pass


class StreamRequest(GenerateRequest):
    """Unified request for the streaming endpoint (any generator kind)."""

    kind: Literal["summary", "email", "daily", "weekly"]
    tone: Literal["professional", "friendly", "executive", "concise"] = "professional"


class ValidateRequest(BaseModel):
    """Lightweight credential check; no notes required."""

    provider: Optional[str] = Field(default=None, description="Provider id override.")
    api_key: Optional[str] = Field(default=None, description="Per-request API key override.")
    model: Optional[str] = Field(default=None, description="Model id override.")


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------
class SummaryResponse(BaseModel):
    summary: str = ""
    action_items: str = ""
    risks: str = ""
    dependencies: str = ""
    next_steps: str = ""


class EmailResponse(BaseModel):
    subject: str = ""
    email: str = ""


class DailyReportResponse(BaseModel):
    completed: str = ""
    in_progress: str = ""
    upcoming: str = ""


class WeeklyReportResponse(BaseModel):
    accomplishments: str = ""
    challenges: str = ""
    pending: str = ""
    next_week_priorities: str = ""


class ValidateResponse(BaseModel):
    ok: bool = False
    provider: str = ""
    model: str = ""
    detail: str = ""


class ErrorResponse(BaseModel):
    error: str
    detail: str = ""
    code: str = ""
