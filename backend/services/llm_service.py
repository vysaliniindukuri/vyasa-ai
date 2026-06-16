from __future__ import annotations

"""LLM service layer.

Wraps an OpenAI-compatible chat completion call behind a small, provider-aware
helper that always returns a flat ``Dict[str, str]`` of Markdown sections.

All provider/transport errors are normalised into the exception hierarchy
defined here so the router can map them to clean HTTP responses.
"""

import json
from typing import Any, AsyncIterator, Dict, List, Optional, Tuple

import openai
from openai import AsyncOpenAI

from config.settings import resolve_provider_config, settings


# ---------------------------------------------------------------------------
# Exception hierarchy
# ---------------------------------------------------------------------------
class LLMError(Exception):
    """Base class for all LLM-related failures."""


class MissingAPIKeyError(LLMError):
    """Raised when no API key can be resolved for the chosen provider."""


class ProviderAuthError(LLMError):
    """Raised when the provider rejects the credentials (401-style)."""


class RateLimitError(LLMError):
    """Raised when the provider rate-limits the request (429-style)."""


class ProviderError(LLMError):
    """Raised for generic upstream failures or unparseable responses."""


# ---------------------------------------------------------------------------
# JSON extraction
# ---------------------------------------------------------------------------
def _extract_json(text: str) -> Dict[str, Any]:
    """Robustly extract a single JSON object from a model response.

    Handles responses that:
      * are wrapped in ```json ... ``` (or plain ```) code fences,
      * contain leading/trailing commentary around the object,
      * are already clean JSON.

    Raises:
        ProviderError: if no valid JSON object can be parsed.
    """
    if not text:
        raise ProviderError("The model returned an empty response.")

    cleaned = text.strip()

    # Strip code fences if present (```json ... ``` or ``` ... ```).
    if cleaned.startswith("```"):
        # Drop the opening fence line.
        newline = cleaned.find("\n")
        if newline != -1:
            cleaned = cleaned[newline + 1 :]
        else:
            cleaned = cleaned[3:]
        # Drop the trailing closing fence if present.
        if cleaned.rstrip().endswith("```"):
            cleaned = cleaned.rstrip()[: -3]
        cleaned = cleaned.strip()

    # First attempt: parse the (possibly already clean) string directly.
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except (ValueError, TypeError):
        pass

    # Fallback: locate the outermost {...} span and parse that.
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = cleaned[start : end + 1]
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed
        except (ValueError, TypeError):
            pass

    raise ProviderError("The model did not return valid JSON.")


def _coerce_to_str(value: Any) -> str:
    """Best-effort conversion of a JSON value to a Markdown string."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list):
        parts: List[str] = []
        for item in value:
            if isinstance(item, str):
                parts.append("- " + item if not item.lstrip().startswith("-") else item)
            else:
                parts.append("- " + _coerce_to_str(item))
        return "\n".join(parts)
    if isinstance(value, dict):
        try:
            return json.dumps(value, ensure_ascii=False, indent=2)
        except (TypeError, ValueError):
            return str(value)
    return str(value)


# ---------------------------------------------------------------------------
# Core generation
# ---------------------------------------------------------------------------
async def generate_structured(
    *,
    system_prompt: str,
    user_prompt: str,
    keys: List[str],
    provider: Optional[str],
    api_key: Optional[str],
    model: Optional[str],
) -> Dict[str, str]:
    """Run a structured generation and return the requested keys as strings.

    Args:
        system_prompt: System role content.
        user_prompt: User role content (includes the raw notes).
        keys: The exact JSON keys expected back from the model.
        provider: Requested provider id (falls back to default).
        api_key: Requested API key (falls back to env).
        model: Requested model (falls back to override / registry default).

    Returns:
        A dict containing every key in ``keys`` mapped to a string (default "").

    Raises:
        MissingAPIKeyError, ProviderAuthError, RateLimitError, ProviderError.
    """
    cfg = resolve_provider_config(provider, api_key, model)

    client = AsyncOpenAI(
        api_key=cfg.api_key,
        base_url=cfg.base_url,
        timeout=settings.request_timeout,
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    kwargs: Dict[str, Any] = {
        "model": cfg.model,
        "messages": messages,
        "temperature": 0.4,
    }
    if cfg.supports_json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        resp = await client.chat.completions.create(**kwargs)
    except openai.AuthenticationError as exc:
        raise ProviderAuthError(
            "The provider rejected your API key. Please check it in Settings."
        ) from exc
    except openai.RateLimitError as exc:
        raise RateLimitError(
            "The provider is rate-limiting requests. Please wait and try again."
        ) from exc
    except openai.APIError as exc:
        raise ProviderError(str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - normalise any transport failure.
        raise ProviderError(str(exc)) from exc

    try:
        content = resp.choices[0].message.content
    except (AttributeError, IndexError, KeyError) as exc:
        raise ProviderError("The provider returned an unexpected response shape.") from exc

    data = _extract_json(content or "")

    # Keep only the requested keys, coercing each value to a string.
    result: Dict[str, str] = {}
    for key in keys:
        result[key] = _coerce_to_str(data.get(key, ""))
    return result


# ---------------------------------------------------------------------------
# Streaming generation
# ---------------------------------------------------------------------------
async def stream_generate(
    *,
    system_prompt: str,
    user_prompt: str,
    provider: Optional[str],
    api_key: Optional[str],
    model: Optional[str],
) -> AsyncIterator[str]:
    """Yield text deltas from a streaming chat completion.

    Credential/transport failures are normalised into the LLM exception
    hierarchy (raised on first iteration), so callers can map them to HTTP.
    """
    cfg = resolve_provider_config(provider, api_key, model)

    client = AsyncOpenAI(
        api_key=cfg.api_key,
        base_url=cfg.base_url,
        timeout=settings.request_timeout,
    )

    try:
        stream = await client.chat.completions.create(
            model=cfg.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
            stream=True,
        )
    except openai.AuthenticationError as exc:
        raise ProviderAuthError(
            "The provider rejected your API key. Please check it in Settings."
        ) from exc
    except openai.RateLimitError as exc:
        raise RateLimitError(
            "The provider is rate-limiting requests. Please wait and try again."
        ) from exc
    except openai.APIError as exc:
        raise ProviderError(str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - normalise any transport failure.
        raise ProviderError(str(exc)) from exc

    try:
        async for chunk in stream:
            choices = getattr(chunk, "choices", None)
            if not choices:
                continue
            delta = getattr(choices[0], "delta", None)
            content = getattr(delta, "content", None) if delta is not None else None
            if content:
                yield content
    except openai.APIError as exc:
        raise ProviderError(str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - normalise mid-stream failures.
        raise ProviderError(str(exc)) from exc


# ---------------------------------------------------------------------------
# Credential validation
# ---------------------------------------------------------------------------
async def validate_credentials(
    provider: Optional[str],
    api_key: Optional[str],
    model: Optional[str],
) -> Tuple[str, str]:
    """Validate a provider/key with a zero-cost ``models.list`` call.

    Returns:
        (resolved_provider, resolved_model) on success.

    Raises:
        MissingAPIKeyError, ProviderAuthError, RateLimitError, ProviderError,
        ValueError (unknown provider).
    """
    cfg = resolve_provider_config(provider, api_key, model)

    client = AsyncOpenAI(
        api_key=cfg.api_key,
        base_url=cfg.base_url,
        timeout=settings.request_timeout,
    )

    try:
        await client.models.list()
    except openai.AuthenticationError as exc:
        raise ProviderAuthError(
            "The provider rejected your API key. Please check it and try again."
        ) from exc
    except openai.RateLimitError as exc:
        raise RateLimitError(
            "The provider is rate-limiting requests. Please wait and try again."
        ) from exc
    except openai.APIError as exc:
        raise ProviderError(str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - normalise any transport failure.
        raise ProviderError(str(exc)) from exc

    return cfg.provider, cfg.model
