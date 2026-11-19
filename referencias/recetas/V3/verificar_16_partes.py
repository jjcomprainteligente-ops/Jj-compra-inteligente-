#!/usr/bin/env python3
"""Entrada compatible; los controles se centralizan en scripts/recetas_v3_intake.py."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts"))
from recetas_v3_intake import main

if __name__ == "__main__":
    raise SystemExit(main(profile_name="github16"))
