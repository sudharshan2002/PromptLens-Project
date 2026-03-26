"""Metrics persistence and aggregation logic."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from threading import Lock

from app.models.schemas import MetricCreateRequest, MetricSummaryResponse


class MetricsService:
    """Persist interaction metrics in a lightweight SQLite database."""

    def __init__(self, db_path: Path) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def init_storage(self) -> None:
        """Create the metrics table when it does not already exist."""
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    prompt_length INTEGER NOT NULL,
                    response_time_ms REAL NOT NULL,
                    rating REAL,
                    endpoint TEXT,
                    mode TEXT,
                    trust_score REAL,
                    feedback TEXT,
                    created_at TEXT NOT NULL
                )
                """
            )
            connection.commit()

    def store_metric(self, payload: MetricCreateRequest) -> int:
        """Insert a new metrics record and return its identifier."""
        with self._lock, self._connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO metrics (
                    prompt_length,
                    response_time_ms,
                    rating,
                    endpoint,
                    mode,
                    trust_score,
                    feedback,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload.prompt_length,
                    payload.response_time_ms,
                    payload.rating,
                    payload.endpoint,
                    payload.mode,
                    payload.trust_score,
                    payload.feedback,
                    payload.created_at,
                ),
            )
            connection.commit()
            return int(cursor.lastrowid)

    def get_summary(self) -> MetricSummaryResponse:
        """Compute aggregate metrics across all stored requests."""
        with self._lock, self._connect() as connection:
            row = connection.execute(
                """
                SELECT
                    COUNT(*) AS total_requests,
                    AVG(response_time_ms) AS avg_response_time,
                    AVG(rating) AS avg_rating
                FROM metrics
                """
            ).fetchone()

        total_requests = int(row["total_requests"] or 0)
        avg_response_time = round(float(row["avg_response_time"] or 0.0), 2)
        avg_rating = row["avg_rating"]

        return MetricSummaryResponse(
            total_requests=total_requests,
            avg_response_time=avg_response_time,
            avg_rating=round(float(avg_rating), 2) if avg_rating is not None else None,
        )
