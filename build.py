#!/usr/bin/env python3
"""Build dist/index.html from src/az900-template.html by inlining the IBM Plex fonts.

Checks after the build:
  * no __PLEX*__ placeholder left
  * every <script> block passes `node --check` (there are two: pre-paint theme + main app)
  * the page contains the expected exam marker
Exit code is non-zero on any failure, so deploy.sh can rely on it.
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src" / "az900-template.html"
FONTS = ROOT / "src" / "fonts"
DIST = ROOT / "dist"
OUT = DIST / "index.html"
MARKER = "AZ-900"

PLACEHOLDERS = {
    "__PLEXMONO_BOLD__": "plexmono-bold.b64",
    "__PLEXSANS_REG__": "plexsans-reg.b64",
    "__PLEXSANS_SEMI__": "plexsans-semi.b64",
    "__PLEXSANS_BOLD__": "plexsans-bold.b64",
}


def fail(msg: str) -> None:
    print(f"build: FAIL - {msg}", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    html = SRC.read_text(encoding="utf-8")
    for key, fname in PLACEHOLDERS.items():
        if html.count(key) != 1:
            fail(f"expected exactly one {key} in template, found {html.count(key)}")
        html = html.replace(key, (FONTS / fname).read_text(encoding="utf-8").strip())
    if "__PLEX" in html:
        fail("placeholder left after substitution")
    if MARKER not in html:
        fail(f"marker {MARKER!r} missing from page")

    DIST.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8")

    scripts = re.findall(r"<script>(.*?)</script>", html, re.S)
    if len(scripts) < 2:
        fail(f"expected at least 2 <script> blocks, found {len(scripts)}")
    check = DIST / "script-check.js"
    check.write_text("\n".join("{\n" + s + "\n}" for s in scripts), encoding="utf-8")
    res = subprocess.run(["node", "--check", str(check)], capture_output=True, text=True)
    if res.returncode != 0:
        fail("node --check failed:\n" + res.stderr)

    print(f"build: OK -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size} bytes, {len(scripts)} script blocks)")


if __name__ == "__main__":
    main()
