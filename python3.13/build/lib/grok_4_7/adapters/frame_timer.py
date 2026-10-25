"""Async frame timer. ``stop`` cancels the task created by ``start``."""

from __future__ import annotations

from collections.abc import Awaitable, Callable

from grok_4_7.frame_time import FRAME_SECONDS


class AsyncFrameTimer:
    """Repeating timer driven by an injected sleep and task factory."""

    def __init__(
        self,
        clock: Callable[[], float],
        sleep: Callable[[float], Awaitable[None]],
        create_task: Callable[[Awaitable[None]], object],
    ) -> None:
        self._clock = clock
        self._sleep = sleep
        self._create_task = create_task
        self._on_tick: Callable[[float], None] | None = None
        self._task: object | None = None
        self._running = False

    @property
    def is_running(self) -> bool:
        """Whether a task is active."""
        return self._running

    @property
    def task(self) -> object | None:
        """Handle returned by the task factory. ``stop`` clears it."""
        return self._task

    def start(self, on_tick: Callable[[float], None]) -> None:
        """Start a new loop. Without a running loop the task is deferred."""
        self.stop()
        self._on_tick = on_tick
        self._running = True
        self.activate()

    def activate(self) -> None:
        """Create the task once an event loop is running. Safe to call twice."""
        if not self._running or self._task is not None or self._on_tick is None:
            return
        self._task = self._create_task(self._loop())

    def stop(self) -> None:
        """Cancel the task from ``start``. Safe when nothing is running."""
        self._running = False
        self._on_tick = None
        task = self._task
        self._task = None
        if task is not None and hasattr(task, "cancel"):
            task.cancel()

    async def _loop(self) -> None:
        last = self._clock()
        while self._running and self._on_tick is not None:
            await self._sleep(FRAME_SECONDS)
            if not self._running or self._on_tick is None:
                return
            now = self._clock()
            delta = now - last
            last = now
            self._on_tick(delta)
