# Python unit testing – pytest, Fakes, Spies, Mocks

Companion to [SKILL.md](./SKILL.md). Python **3.13.x**.

## Recommended stack

| Purpose | Tool |
| --- | --- |
| Test framework | **pytest** (plain `assert`, fixtures, parametrization) |
| Mocks / spies | `unittest.mock` through **pytest-mock** (`mocker`), always with autospec |
| Coverage | **pytest-cov** (`coverage.py`) with branch coverage |
| Property tests (pure math, optional) | **hypothesis** |

Do not write new `unittest.TestCase` classes.

```text
pip install pytest pytest-mock pytest-cov
pytest tests/path/test_module.py -q                       # narrow, while developing
pytest --cov=src --cov-branch --cov-report=term-missing --cov-fail-under=90
```

## Public and protected method coverage

For each class keep this checklist satisfied in its test module:

| Method kind | Required tests |
| --- | --- |
| Public `name()` | happy path, edge/boundary, error path (when it can raise) |
| Protected `_name()` | happy path, edge/boundary, error path – reached through a public call when possible, directly when it is a documented hook or the branch is otherwise unreachable |
| Private `__name()` | not tested directly; covered through callers. If it needs its own tests, extract it into a collaborator |

Ways to reach a protected method:

1. **Through the public API** (preferred).
2. **Directly**: `exporter._validate(mesh)` (add `# noqa: SLF001`).
3. **Test subclass** that overrides the hook, to verify the Template Method contract.
4. **Spy** on it: `mocker.spy(obj, "_serialize")` to prove it is called and inspect `spy.spy_return`.

Enforce with `--cov-branch --cov-fail-under=90` (aim for 100 % on domain logic).

## Test doubles – pick the lightest that works

| Double | Use when | How |
| --- | --- | --- |
| **Dummy** | argument required but unused | `object()` |
| **Stub** | canned return values | `mocker.Mock(spec=Port)` + `return_value` |
| **Fake** | working lightweight implementation (in-memory store, fake renderer) – **preferred** | hand-written class implementing the `Protocol`, kept in `tests/fakes/` |
| **Spy** | record calls, keep real behaviour | `mocker.spy(obj, "method")` or a recording fake |
| **Mock** | verify an outgoing interaction (command/side effect) | `create_autospec(Port, instance=True)` + `assert_called_once_with` |

Rules:

- Prefer state-based assertions on **Fakes**; use **Mocks** only to verify commands sent to a collaborator.
- Always **autospec** (`create_autospec`, `mocker.patch(..., autospec=True)`); never bare `Mock()`.
- Mock only at boundaries (ports); never the unit under test.
- Assert observable results first, interactions second; avoid asserting call order unless order is the behaviour.
- Inject clocks and RNGs (`random.Random(1234)`, fake clock); never patch `random`/`time` globally.
- Add one **contract test** parametrized over the real class and its Fake so the Fake cannot drift.

## Example (Fake + Spy + Mock + protected method)

```python
from dataclasses import dataclass
from typing import Protocol
from unittest.mock import create_autospec

import pytest


class Notifier(Protocol):
    def send(self, message: str) -> None: ...


class ScoreStore(Protocol):
    def load(self, player: str) -> int: ...
    def save(self, player: str, score: int) -> None: ...


@dataclass(frozen=True, slots=True)
class ScoreChange:
    player: str
    points: int


class ScoreService:
    MAX_SCORE = 100

    def __init__(self, store: ScoreStore, notifier: Notifier) -> None:
        self._store = store
        self._notifier = notifier

    def apply(self, change: ScoreChange) -> int:           # public
        new_score = self._clamp(self._store.load(change.player) + change.points)
        self._store.save(change.player, new_score)
        if new_score == self.MAX_SCORE:
            self._notifier.send(f"{change.player} reached max score")
        return new_score

    def _clamp(self, score: int) -> int:                    # protected
        return max(0, min(score, self.MAX_SCORE))


class FakeScoreStore:                                       # Fake
    def __init__(self, initial: dict[str, int] | None = None) -> None:
        self.scores = dict(initial or {})

    def load(self, player: str) -> int:
        return self.scores.get(player, 0)

    def save(self, player: str, score: int) -> None:
        self.scores[player] = score


class SpyNotifier:                                          # Spy
    def __init__(self) -> None:
        self.messages: list[str] = []

    def send(self, message: str) -> None:
        self.messages.append(message)


@pytest.fixture
def store() -> FakeScoreStore:
    return FakeScoreStore({"ann": 90})


@pytest.fixture
def notifier() -> SpyNotifier:
    return SpyNotifier()


@pytest.fixture
def service(store, notifier) -> ScoreService:
    return ScoreService(store, notifier)


def test_apply__below_max__saves_and_stays_silent(service, store, notifier):
    assert service.apply(ScoreChange("ann", 5)) == 95
    assert store.scores["ann"] == 95
    assert notifier.messages == []


def test_apply__reaches_max__notifies_once(service, notifier):
    service.apply(ScoreChange("ann", 50))
    assert notifier.messages == ["ann reached max score"]


def test_apply__mock_store__saves_clamped_value_once():     # Mock
    store_mock = create_autospec(ScoreStore, instance=True)
    store_mock.load.return_value = 99

    ScoreService(store_mock, SpyNotifier()).apply(ScoreChange("ann", 10))

    store_mock.save.assert_called_once_with("ann", 100)


@pytest.mark.parametrize(
    ("raw_score", "expected"),
    [(-5, 0), (0, 0), (42, 42), (100, 100), (250, 100)],
)
def test_clamp__boundaries__stays_in_range(service, raw_score, expected):  # protected
    assert service._clamp(raw_score) == expected  # noqa: SLF001
```

## Conventions

- File `tests/<package>/test_<module>.py`; shared fakes in `tests/fakes/`, fixtures in `tests/conftest.py`.
- Test names: `test_<unit>__<condition>__<expected>` (snake_case).
- Arrange – Act – Assert; one reason to fail per test.
- `pytest.approx` for floats, `pytest.raises(..., match=...)` for errors, `tmp_path` for files, `monkeypatch` for env vars.
- Tests are deterministic and independent: no network, GPU, window, browser, shared mutable state.

## pyproject.toml (test section)

```toml
[tool.pytest.ini_options]
minversion = "8.0"
testpaths = ["tests"]
pythonpath = ["src"]
addopts = "-ra --strict-markers --strict-config --cov=src --cov-branch --cov-report=term-missing --cov-fail-under=90"
markers = ["integration: needs a real render window or server"]

[tool.coverage.report]
show_missing = true
exclude_also = ["if __name__ == .__main__.:", "raise NotImplementedError"]
```

## Testing the PyVista / trame bundle

- Set `pv.OFF_SCREEN = True` in `tests/conftest.py`; never create `pv.Plotter()` at import time.
- **Geometry** is pure: assert on `n_points`, `n_cells`, `bounds` (with `pytest.approx`), not screenshots.
- **Scene logic**: use a `FakeSceneRenderer` / `FakeViewController` implementing the ports.
- **Adapters** (thin wrappers around `pv.Plotter`): `create_autospec(pv.Plotter, instance=True)` and assert forwarded calls.
- **trame handlers**: `get_server("test-name", client_type="vue3")` without `start()`; set `server.state`, call the handler, assert state/fake outputs. Use a unique server name per test.
- Tests needing a real render window get `@pytest.mark.integration` and are excluded by default (`-m "not integration"`).
