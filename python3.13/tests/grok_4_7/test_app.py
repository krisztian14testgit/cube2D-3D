"""Page layout, control forwarding, and lifecycle. The server is never started."""

from __future__ import annotations

import random
from types import SimpleNamespace
from uuid import uuid4

from tests.fakes.renderers import FakeCamera, FakePicker, FakeSceneRenderer, FakeTimer, FakeView
from trame.app import get_server

from grok_4_7.app import AppOverrides, build_app, main
from grok_4_7.pages.copy import LABEL_COORD, LABEL_CUBES, PAGE_COORD, PAGE_CUBES


def _overrides() -> tuple[AppOverrides, list[FakeTimer]]:
    timers: list[FakeTimer] = []

    def timer_factory() -> FakeTimer:
        timer = FakeTimer()
        timers.append(timer)
        return timer

    overrides = AppOverrides(
        rng=random.Random(1),
        plotter_factory=lambda: SimpleNamespace(iren=None, renderer=None),
        timer_factory=timer_factory,
        view_factory=lambda _plotter: FakeView(),
        renderer_factory=lambda _plotter: FakeSceneRenderer(),
        camera_factory=lambda _plotter: FakeCamera(),
        picker_factory=lambda _plotter, _radius: FakePicker(),
    )
    return overrides, timers


def _server() -> object:
    return get_server(f"grok-4-7-test-{uuid4()}", client_type="vue3")


def test_build_app__coord_page__contains_titles_divider_and_labels() -> None:
    overrides, timers = _overrides()
    server = build_app(_server(), overrides)
    html = server.grok_layout.html  # type: ignore[attr-defined]
    assert "Created by Grok 4.7" in html
    assert "Coordinate system" in html
    assert "Bouncing squares" in html
    assert "VDivider" in html
    assert LABEL_COORD in html
    assert LABEL_CUBES in html
    assert "Grok 4.7" in html
    assert timers[0].is_running is True
    assert server.grok_host.active_page == PAGE_COORD  # type: ignore[attr-defined]


def test_show_cubes__contains_both_sections_divider_and_context_menu() -> None:
    overrides, _timers = _overrides()
    server = build_app(_server(), overrides)
    server.controller.show_cubes()  # type: ignore[attr-defined]
    html = server.grok_layout.html  # type: ignore[attr-defined]
    assert "Single 3D cube" in html
    assert "Exploding cubes" in html
    assert "VDivider" in html
    assert "contextmenu" in html
    assert server.state.page == PAGE_CUBES  # type: ignore[attr-defined]


def test_control_events__reach_the_scene_and_do_not_start_the_server(mocker) -> None:  # type: ignore[no-untyped-def]
    overrides, _timers = _overrides()
    server = build_app(_server(), overrides)
    start = mocker.spy(server, "start")
    server.state.ready()  # type: ignore[attr-defined]
    server.state.coord_scale = 2.0  # type: ignore[attr-defined]
    server.state.flush()  # type: ignore[attr-defined]
    host = server.grok_host  # type: ignore[attr-defined]
    assert host.coordinate_scene.square_scale == 2.0
    server.controller.show_cubes()  # type: ignore[attr-defined]
    server.state.max_cubes = 12  # type: ignore[attr-defined]
    server.state.flush()  # type: ignore[attr-defined]
    assert host.exploding_scene.max_cubes == 12
    server.controller.create_cube()  # type: ignore[attr-defined]
    assert host.cube_scene.has_cube is True
    assert server.state.cube_exists is True  # type: ignore[attr-defined]
    start.assert_not_called()


def test_leave_page__disposes_both_scenes_and_the_timer() -> None:
    overrides, timers = _overrides()
    server = build_app(_server(), overrides)
    host = server.grok_host  # type: ignore[attr-defined]
    first_coordinate = host.coordinate_scene
    host.show(PAGE_CUBES)
    assert timers[0].is_running is False
    assert timers[0].stop_count == 1
    assert first_coordinate._renderer.cleared is True  # noqa: SLF001
    assert first_coordinate._renderer.close_count == 1  # noqa: SLF001
    assert host._disposed_bouncing is not None  # noqa: SLF001
    assert timers[1].is_running is True
    host.show("missing")
    assert host.active_page is None
    assert timers[1].is_running is False


def test_reenter__builds_a_fresh_scene() -> None:
    overrides, _timers = _overrides()
    server = build_app(_server(), overrides)
    host = server.grok_host  # type: ignore[attr-defined]
    first = host.coordinate_scene
    host.show(PAGE_CUBES)
    host.show(PAGE_COORD)
    assert host.coordinate_scene is not first
    assert host.coordinate_scene.square_scale == 1


def test_timer_tick__refreshes_status_after_motion() -> None:
    overrides, timers = _overrides()
    server = build_app(_server(), overrides)
    host = server.grok_host  # type: ignore[attr-defined]
    host.bouncing_picker.plane_point = __import__("grok_4_7.math_types", fromlist=["Vec3"]).Vec3(0, 0, 0)
    host.spawn_square(1, 1)
    server.state.square_status = "stale"  # type: ignore[attr-defined]
    timers[0].fire(0.016)
    assert server.state.square_status == "Squares: 1 / 20"  # type: ignore[attr-defined]


def test_invalid_color__does_not_raise_and_keeps_the_cube_color() -> None:
    overrides, _timers = _overrides()
    server = build_app(_server(), overrides)
    server.controller.show_cubes()  # type: ignore[attr-defined]
    server.controller.create_cube()  # type: ignore[attr-defined]
    host = server.grok_host  # type: ignore[attr-defined]
    server.state.ready()  # type: ignore[attr-defined]
    server.state.cube_color = "not-a-color"  # type: ignore[attr-defined]
    server.state.flush()  # type: ignore[attr-defined]
    assert host.cube_scene._color == "#87cefa"  # noqa: SLF001
    assert server.state.cube_exists is True  # type: ignore[attr-defined]


def test_timer_tick__clamps_delta_before_step() -> None:
    overrides, timers = _overrides()
    server = build_app(_server(), overrides)
    host = server.grok_host  # type: ignore[attr-defined]
    host.bouncing_picker.plane_point = __import__("grok_4_7.math_types", fromlist=["Vec3"]).Vec3(0, 0, 0)
    host.spawn_square(1, 1)
    before = host.bouncing_scene.squares[0].position.x
    velocity = host.bouncing_scene.squares[0].velocity.x
    timers[0].fire(1.0)
    after = host.bouncing_scene.squares[0].position.x
    assert after - before == __import__("pytest").approx(velocity * 0.05)


def test_main__starts_on_port_8080(mocker) -> None:  # type: ignore[no-untyped-def]
    server = mocker.Mock()
    mocker.patch("grok_4_7.app.build_app", return_value=server)
    main()
    server.start.assert_called_once_with(port=8080)


def test_pure_modules__do_not_import_a_renderer() -> None:
    from pathlib import Path

    root = Path(__file__).resolve().parents[2] / "src" / "grok_4_7"
    relative_paths = [
        "features/bouncing_squares/math.py",
        "features/bouncing_squares/simulation.py",
        "features/cubes_exploding/math.py",
        "features/cubes_exploding/simulation.py",
        "features/cubes_exploding/effects.py",
        "picking.py",
        "orbit.py",
    ]
    for relative in relative_paths:
        lines = (root / relative).read_text(encoding="utf-8").splitlines()
        imports = [line.strip() for line in lines if line.strip().startswith(("import ", "from "))]
        assert all("pyvista" not in line and "trame" not in line and "import vtk" not in line for line in imports)
