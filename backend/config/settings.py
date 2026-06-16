from __future__ import annotations

"""Application configuration, provider registry and provider resolution.

This module is intentionally free of heavy imports so it can be imported very
early. The LLM-specific exceptions live in ``services.llm_service``; to avoid a
circular import (``llm_service`` imports ``settings``) we import
``MissingAPIKeyError`` lazily, inside the function that needs it.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


# ---------------------------------------------------------------------------
# Provider registry
# ---------------------------------------------------------------------------
# Each entry describes an OpenAI-compatible endpoint. ``supports_json_mode``
# controls whether we may pass ``response_format={"type": "json_object"}``.
PROVIDERS: Dict[str, Dict[str, object]] = {
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "default_model": "llama-3.3-70b-versatile",
        "env_key": "GROQ_API_KEY",
        "supports_json_mode": True,
    },
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "default_model": "gpt-4o-mini",
        "env_key": "OPENAI_API_KEY",
        "supports_json_mode": True,
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "default_model": "gemini-2.0-flash",
        "env_key": "GEMINI_API_KEY",
        "supports_json_mode": True,
    },
    "claude": {
        "base_url": "https://api.anthropic.com/v1/",
        "default_model": "claude-sonnet-4-6",
        "env_key": "ANTHROPIC_API_KEY",
        "supports_json_mode": False,
    },
}


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------
class Settings(BaseSettings):
    """Runtime configuration sourced from environment / ``.env`` file."""

    default_provider: str = "groq"

    # API keys (fall back when a request omits the key).
    groq_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None

    # Optional per-provider model overrides.
    groq_model: Optional[str] = None
    openai_model: Optional[str] = None
    gemini_model: Optional[str] = None
    claude_model: Optional[str] = None

    request_timeout: float = 60.0

    # Comma-separated CORS origins ("*" allows any during local dev).
    frontend_origins: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=False,
    )

    # -- helpers ----------------------------------------------------------
    def cors_origins(self) -> List[str]:
        """Parse ``frontend_origins`` into a list of origins."""
        raw = (self.frontend_origins or "").strip()
        if raw == "" or raw == "*":
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]


# Singleton instance used throughout the app.
settings = Settings()


# ---------------------------------------------------------------------------
# Provider resolution
# ---------------------------------------------------------------------------
@dataclass
class ProviderConfig:
    """Fully-resolved configuration for a single LLM request."""

    provider: str
    base_url: str
    api_key: str
    model: str
    supports_json_mode: bool


# Maps provider id -> attribute name on ``Settings`` holding the API key.
_API_KEY_FIELDS: Dict[str, str] = {
    "groq": "groq_api_key",
    "openai": "openai_api_key",
    "gemini": "gemini_api_key",
    "claude": "anthropic_api_key",
}

# Maps provider id -> attribute name on ``Settings`` holding the model override.
_MODEL_FIELDS: Dict[str, str] = {
    "groq": "groq_model",
    "openai": "openai_model",
    "gemini": "gemini_model",
    "claude": "claude_model",
}


def resolve_provider_config(
    provider: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
) -> ProviderConfig:
    """Resolve the effective provider configuration for a request.

    Precedence:
      * provider: request value -> ``settings.default_provider``.
      * api_key:  request value -> matching env value (else raise).
      * model:    request value -> per-provider env override -> registry default.

    Raises:
        ValueError: if ``provider`` is not a known provider.
        MissingAPIKeyError: if no API key can be resolved.
    """
    # Lazy import to avoid a circular dependency with services.llm_service.
    from services.llm_service import MissingAPIKeyError

    resolved_provider = (provider or "").strip() or settings.default_provider
    if resolved_provider not in PROVIDERS:
        valid = ", ".join(sorted(PROVIDERS.keys()))
        raise ValueError(
            "Unknown provider '%s'. Valid providers: %s." % (resolved_provider, valid)
        )

    entry = PROVIDERS[resolved_provider]

    # API key resolution.
    resolved_key = (api_key or "").strip()
    if not resolved_key:
        env_value = getattr(settings, _API_KEY_FIELDS[resolved_provider], None)
        resolved_key = (env_value or "").strip() if env_value else ""
    if not resolved_key:
        raise MissingAPIKeyError(
            "No API key provided for provider '%s'. Add it in Settings or set the "
            "%s environment variable." % (resolved_provider, entry["env_key"])
        )

    # Model resolution.
    resolved_model = (model or "").strip()
    if not resolved_model:
        env_model = getattr(settings, _MODEL_FIELDS[resolved_provider], None)
        resolved_model = (env_model or "").strip() if env_model else ""
    if not resolved_model:
        resolved_model = str(entry["default_model"])

    return ProviderConfig(
        provider=resolved_provider,
        base_url=str(entry["base_url"]),
        api_key=resolved_key,
        model=resolved_model,
        supports_json_mode=bool(entry["supports_json_mode"]),
    )
