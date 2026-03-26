"""Generation service for text and image-style outputs."""

from __future__ import annotations

import inspect
import logging

from app.utils.helpers import build_mock_image_output, build_mock_text_output
from config import Settings

try:  # pragma: no cover - optional dependency behavior
    from openai import AsyncOpenAI
except ImportError:  # pragma: no cover - optional dependency behavior
    AsyncOpenAI = None

logger = logging.getLogger(__name__)


class GenAIService:
    """Wrap real or fallback generation behavior behind a small interface."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._client = None

        if settings.openai_api_key and AsyncOpenAI is not None:
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        elif settings.openai_api_key:
            logger.warning("OPENAI_API_KEY is set but the openai package is unavailable; using mock mode")

    async def generate_text(self, prompt: str) -> str:
        """Generate text with OpenAI when configured, otherwise use a deterministic mock."""
        if not self._client:
            return build_mock_text_output(prompt)

        try:
            response = await self._client.responses.create(
                model=self.settings.openai_text_model,
                input=prompt,
            )
            output_text = getattr(response, "output_text", "") or ""
            return output_text.strip() or build_mock_text_output(prompt)
        except Exception as exc:  # pragma: no cover - defensive provider fallback
            logger.warning("OpenAI text generation failed, falling back to mock mode: %s", exc)
            return build_mock_text_output(prompt)

    async def generate_image(self, prompt: str) -> str:
        """Return a mock image payload that the frontend can treat as an image source."""
        return build_mock_image_output(prompt)

    async def close(self) -> None:
        """Close any underlying HTTP client when supported by the provider."""
        if self._client and hasattr(self._client, "close"):
            close_result = self._client.close()
            if inspect.isawaitable(close_result):
                await close_result
