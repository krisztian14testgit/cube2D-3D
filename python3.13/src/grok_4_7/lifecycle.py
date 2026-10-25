"""Per-page resize and frame callbacks that scenes can unregister."""

from __future__ import annotations

from collections.abc import Callable


class TickRegistry:
    """Fan-out for one page's timer. Dispose removes only that scene's callback."""

    def __init__(self) -> None:
        self._resize: Callable[[], None] | None = None
        self._ticks: list[Callable[[float], None]] = []

    @property
    def resize_callback(self) -> Callable[[], None] | None:
        """Registered resize hook, if any."""
        return self._resize

    @property
    def tick_count(self) -> int:
        """Number of registered frame callbacks."""
        return len(self._ticks)

    def register_resize(self, callback: Callable[[], None]) -> None:
        """Replace the resize callback."""
        self._resize = callback

    def register_tick(self, callback: Callable[[float], None]) -> None:
        """Register a frame callback once."""
        if callback not in self._ticks:
            self._ticks.append(callback)

    def unregister(self, callback: Callable[..., None]) -> None:
        """Remove a callback. Missing callbacks are ignored."""
        if self._resize == callback:
            self._resize = None
        self._ticks = [item for item in self._ticks if item != callback]

    def fire(self, delta_seconds: float) -> None:
        """Call each tick callback. A callback may unregister itself."""
        for callback in tuple(self._ticks):
            callback(delta_seconds)

    def resize(self) -> None:
        """Call the resize hook when one is registered."""
        if self._resize is not None:
            self._resize()
