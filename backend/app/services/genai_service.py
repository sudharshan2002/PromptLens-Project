"""Generation service for Replicate text and Pollinations image outputs."""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.utils.helpers import (
    build_mock_text_output,
    build_pollinations_image_url,
)
from config import Settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ProviderGenerationResult:
    """Normalized provider response payload."""

    output: str
    provider: str
    analysis_text: str


class GenAIService:
    """Wrap real or fallback generation behavior behind a small interface."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def generate_text(self, prompt: str) -> ProviderGenerationResult:
        """Generate text with Replicate when configured, otherwise use a deterministic mock."""
        if not self.settings.replicate_api_token:
            fallback = build_mock_text_output(prompt)
            return ProviderGenerationResult(
                output=fallback,
                provider="mock-text",
                analysis_text=fallback,
            )

        try:
            output = await asyncio.to_thread(self._run_replicate_prediction, prompt)
            return ProviderGenerationResult(
                output=output,
                provider="replicate",
                analysis_text=output,
            )
        except Exception as exc:  # pragma: no cover - defensive provider fallback
            logger.warning("Replicate text generation failed, falling back to mock mode: %s", exc)
            fallback = build_mock_text_output(prompt)
            return ProviderGenerationResult(
                output=fallback,
                provider="mock-text",
                analysis_text=fallback,
            )

    async def generate_image(self, prompt: str) -> ProviderGenerationResult:
        """Build a Pollinations image URL from the supplied prompt."""
        image_url = build_pollinations_image_url(
            prompt=prompt,
            base_url=self.settings.pollinations_base_url,
            model=self.settings.pollinations_model,
            width=self.settings.pollinations_width,
            height=self.settings.pollinations_height,
            nologo=self.settings.pollinations_nologo,
        )
        analysis_text = (
            "Generated image request with "
            f"{self.settings.pollinations_model} at {self.settings.pollinations_width}x{self.settings.pollinations_height} "
            "using Pollinations."
        )
        return ProviderGenerationResult(
            output=image_url,
            provider="pollinations",
            analysis_text=analysis_text,
        )

    def _run_replicate_prediction(self, prompt: str) -> str:
        owner, model = self._parse_model_name(self.settings.replicate_model)
        endpoint = f"https://api.replicate.com/v1/models/{owner}/{model}/predictions"
        payload = json.dumps({"input": {"prompt": prompt}}).encode("utf-8")

        request = Request(
            endpoint,
            data=payload,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.settings.replicate_api_token}",
                "Content-Type": "application/json",
                "Prefer": f"wait={self.settings.replicate_wait_seconds}",
            },
        )

        try:
            with urlopen(request, timeout=self.settings.replicate_wait_seconds + 10) as response:
                body = response.read().decode("utf-8")
        except HTTPError as exc:  # pragma: no cover - network/provider behavior
            error_body = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Replicate returned HTTP {exc.code}: {error_body}") from exc
        except URLError as exc:  # pragma: no cover - network/provider behavior
            raise RuntimeError(f"Replicate request failed: {exc.reason}") from exc

        data = json.loads(body)
        if data.get("status") not in {"succeeded", "processing"}:
            raise RuntimeError(f"Replicate prediction did not succeed: {data}")

        output = self._extract_replicate_output(data.get("output"))
        if not output:
            raise RuntimeError(f"Replicate returned no usable output: {data}")
        return output

    @staticmethod
    def _parse_model_name(value: str) -> tuple[str, str]:
        if "/" not in value:
            raise ValueError("REPLICATE_TEXT_MODEL must be in 'owner/model' format")
        owner, model = value.split("/", 1)
        return owner.strip(), model.strip()

    def _extract_replicate_output(self, output: Any) -> str:
        if isinstance(output, str):
            return output.strip()
        if isinstance(output, list):
            parts = [self._extract_replicate_output(item) for item in output]
            return "\n".join(part for part in parts if part).strip()
        if isinstance(output, dict):
            for key in ("text", "content", "output", "response"):
                if key in output:
                    return self._extract_replicate_output(output[key])
            return json.dumps(output)
        if output is None:
            return ""
        return str(output).strip()

    async def close(self) -> None:
        """Expose a consistent shutdown hook for the app lifespan."""
        return None
