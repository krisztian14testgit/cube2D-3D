"""Burst lifetime and frame-delta clamping."""

from __future__ import annotations

import logging

import pytest
from tests.fakes.renderers import ScriptedRandom

from grok_4_7.features.cubes_exploding.constants import BURST_POINT_COUNT
from grok_4_7.features.cubes_exploding.effects import BurstBook
from grok_4_7.frame_time import MAX_DELTA_SECONDS, clamp_frame_delta
from grok_4_7.math_types import ORIGIN
from grok_4_7.orbit import orbit_position


def test_burst_book__spawn__uses_80_points_and_life_range() -> None:
    book = BurstBook(ScriptedRandom([0.0]))  # type: ignore[arg-type]
    book.spawn_burst(ORIGIN)
    burst = book.bursts[0]
    assert burst.point_count == BURST_POINT_COUNT
    assert burst.life_seconds == pytest.approx(0.15)
    assert book.active_count == 1


def test_burst_book__step_past_deadline__disposes() -> None:
    book = BurstBook(ScriptedRandom([1.0]))  # type: ignore[arg-type]
    book.spawn_burst(ORIGIN)
    book.step(0.2)
    assert book.active_count == 1
    book.step(0.25)
    assert book.active_count == 0


def test_burst_book__dispose__cancels_before_deadline() -> None:
    book = BurstBook(ScriptedRandom([0.5]))  # type: ignore[arg-type]
    book.spawn_burst(ORIGIN)
    book.dispose()
    book.dispose()
    assert book.active_count == 0


def test_clamp_frame_delta__large_value__logs_and_caps(caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level(logging.DEBUG):
        assert clamp_frame_delta(1.0) == pytest.approx(MAX_DELTA_SECONDS)
    assert "unclamped frame delta" in caplog.text


def test_clamp_frame_delta__non_positive__becomes_zero(caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level(logging.DEBUG):
        assert clamp_frame_delta(float("nan")) == 0
        assert clamp_frame_delta(-1) == 0
    assert "ignored frame delta" in caplog.text


def test_clamp_frame_delta__small_positive__is_unchanged() -> None:
    assert clamp_frame_delta(0.02) == pytest.approx(0.02)


def test_orbit_position__babylon_angles__matches_formula() -> None:
    position = orbit_position(0.0, 1.5707963267948966, 12)
    assert position.x == pytest.approx(12)
    assert position.y == pytest.approx(0, abs=1e-9)
    assert position.z == pytest.approx(0, abs=1e-9)
