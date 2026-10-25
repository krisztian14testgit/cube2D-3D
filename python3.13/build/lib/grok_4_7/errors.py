"""Domain errors for the Grok 4.7 playground."""


class InvalidAxisError(ValueError):
    """Raised when a rotation axis is not ``x``, ``y``, or ``z``."""

    def __init__(self, axis: str) -> None:
        self.axis = axis
        super().__init__(f"rotation axis must be x, y, or z, got {axis!r}")


class InvalidColorError(ValueError):
    """Raised when a color is not ``#`` plus six hex digits."""

    def __init__(self, color: str) -> None:
        self.color = color
        super().__init__(f"color must match #RRGGBB, got {color!r}")
