from __future__ import annotations

"""Generation endpoints.

Four POST endpoints, each: builds (system, user) prompts, calls the LLM service
with the matching key set, and returns the matching response model. All known
LLM failures are mapped to clean HTTP responses via :func:`_to_http_exception`.
"""

import json
from typing import AsyncIterator, Dict

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from config.settings import resolve_provider_config
from models.schemas import (
    DailyReportRequest,
    DailyReportResponse,
    EmailRequest,
    EmailResponse,
    StreamRequest,
    SummaryRequest,
    SummaryResponse,
    ValidateRequest,
    ValidateResponse,
    WeeklyReportRequest,
    WeeklyReportResponse,
)
from prompts.templates import (
    KEYS,
    daily_report_prompt,
    email_prompt,
    stream_prompt,
    summary_prompt,
    weekly_report_prompt,
)
from services.llm_service import (
    LLMError,
    MissingAPIKeyError,
    ProviderAuthError,
    ProviderError,
    RateLimitError,
    generate_structured,
    stream_generate,
    validate_credentials,
)

router = APIRouter(prefix="", tags=["generate"])


def _error_detail(message: str, code: str, detail: str = "") -> Dict[str, str]:
    """Shape an error payload like ``ErrorResponse``."""
    return {"error": message, "detail": detail, "code": code}


def _to_http_exception(exc: Exception) -> HTTPException:
    """Translate an LLM/validation exception into an HTTPException."""
    if isinstance(exc, MissingAPIKeyError):
        return HTTPException(
            status_code=400,
            detail=_error_detail(str(exc), "missing_api_key"),
        )
    if isinstance(exc, ProviderAuthError):
        return HTTPException(
            status_code=401,
            detail=_error_detail(str(exc), "auth_error"),
        )
    if isinstance(exc, RateLimitError):
        return HTTPException(
            status_code=429,
            detail=_error_detail(str(exc), "rate_limit"),
        )
    if isinstance(exc, (ProviderError, LLMError)):
        return HTTPException(
            status_code=502,
            detail=_error_detail(
                "The AI provider could not complete your request.",
                "provider_error",
                str(exc),
            ),
        )
    if isinstance(exc, ValueError):
        return HTTPException(
            status_code=400,
            detail=_error_detail(str(exc), "bad_request"),
        )
    # Unexpected: surface as a provider error to avoid leaking internals.
    return HTTPException(
        status_code=502,
        detail=_error_detail(
            "An unexpected error occurred while generating your output.",
            "provider_error",
            str(exc),
        ),
    )


@router.post("/generate-summary", response_model=SummaryResponse)
async def generate_summary(req: SummaryRequest) -> SummaryResponse:
    system, user = summary_prompt(req.text)
    try:
        data = await generate_structured(
            system_prompt=system,
            user_prompt=user,
            keys=KEYS["summary"],
            provider=req.provider,
            api_key=req.api_key,
            model=req.model,
        )
    except Exception as exc:  # noqa: BLE001 - mapped to HTTP below.
        raise _to_http_exception(exc)
    return SummaryResponse(**data)


@router.post("/generate-email", response_model=EmailResponse)
async def generate_email(req: EmailRequest) -> EmailResponse:
    system, user = email_prompt(req.text, req.tone)
    try:
        data = await generate_structured(
            system_prompt=system,
            user_prompt=user,
            keys=KEYS["email"],
            provider=req.provider,
            api_key=req.api_key,
            model=req.model,
        )
    except Exception as exc:  # noqa: BLE001 - mapped to HTTP below.
        raise _to_http_exception(exc)
    return EmailResponse(**data)


@router.post("/generate-daily-report", response_model=DailyReportResponse)
async def generate_daily_report(req: DailyReportRequest) -> DailyReportResponse:
    system, user = daily_report_prompt(req.text)
    try:
        data = await generate_structured(
            system_prompt=system,
            user_prompt=user,
            keys=KEYS["daily"],
            provider=req.provider,
            api_key=req.api_key,
            model=req.model,
        )
    except Exception as exc:  # noqa: BLE001 - mapped to HTTP below.
        raise _to_http_exception(exc)
    return DailyReportResponse(**data)


@router.post("/generate-weekly-report", response_model=WeeklyReportResponse)
async def generate_weekly_report(req: WeeklyReportRequest) -> WeeklyReportResponse:
    system, user = weekly_report_prompt(req.text)
    try:
        data = await generate_structured(
            system_prompt=system,
            user_prompt=user,
            keys=KEYS["weekly"],
            provider=req.provider,
            api_key=req.api_key,
            model=req.model,
        )
    except Exception as exc:  # noqa: BLE001 - mapped to HTTP below.
        raise _to_http_exception(exc)
    return WeeklyReportResponse(**data)


# ---------------------------------------------------------------------------
# Credential validation
# ---------------------------------------------------------------------------
@router.post("/validate-key", response_model=ValidateResponse)
async def validate_key(req: ValidateRequest) -> ValidateResponse:
    try:
        provider, model = await validate_credentials(req.provider, req.api_key, req.model)
    except Exception as exc:  # noqa: BLE001 - mapped to HTTP below.
        raise _to_http_exception(exc)
    return ValidateResponse(
        ok=True,
        provider=provider,
        model=model,
        detail="Connection successful.",
    )


# ---------------------------------------------------------------------------
# Streaming generation (Server-Sent Events)
# ---------------------------------------------------------------------------
_PROMPT_BUILDERS = {
    "summary": lambda req: summary_prompt(req.text),
    "email": lambda req: email_prompt(req.text, req.tone),
    "daily": lambda req: daily_report_prompt(req.text),
    "weekly": lambda req: weekly_report_prompt(req.text),
}


@router.post("/generate/stream")
async def generate_stream(req: StreamRequest) -> StreamingResponse:
    """Stream a generation as Server-Sent Events of Markdown deltas.

    Each event is ``data: {"delta": "..."}``; the stream ends with
    ``data: [DONE]``. Errors are surfaced as an ``event: error`` frame.
    """
    # Fail fast (proper HTTP status) for missing key / unknown provider before
    # we commit to a streaming response.
    try:
        resolve_provider_config(req.provider, req.api_key, req.model)
    except Exception as exc:  # noqa: BLE001 - mapped to HTTP below.
        raise _to_http_exception(exc)

    system, user = stream_prompt(req.kind, req.text, req.tone)

    async def event_stream() -> AsyncIterator[str]:
        try:
            async for delta in stream_generate(
                system_prompt=system,
                user_prompt=user,
                provider=req.provider,
                api_key=req.api_key,
                model=req.model,
            ):
                yield "data: " + json.dumps({"delta": delta}) + "\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:  # noqa: BLE001 - surfaced as an SSE error frame.
            http = _to_http_exception(exc)
            payload = (
                http.detail
                if isinstance(http.detail, dict)
                else {"error": str(exc), "detail": "", "code": "provider_error"}
            )
            yield "event: error\ndata: " + json.dumps(payload) + "\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
