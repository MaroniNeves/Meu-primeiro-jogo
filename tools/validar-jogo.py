#!/usr/bin/env python3
"""Verifica que o jogo migrado mantém todos os assets necessários."""
from pathlib import Path
import json
import re

root = Path(__file__).resolve().parents[1]
required = [
    "index.html", "agua.html", "agua-v1226.js",
    "ecossistema-v1232.js", "arcano-assets-v1232.js",
    "nature-imported-v1239.js",
    "assets/quaternius/CommonTree_1.gltf",
    "assets/quaternius/CommonTree_1.bin",
    "assets/quaternius/Grass.png",
    "assets/ultimate/BirchTree_3.fbx",
]
missing = [name for name in required if not (root / name).is_file()]
assets = [p for p in (root / "assets").rglob("*") if p.is_file()]
assert len(assets) >= 100, f"Assets incompletos: {len(assets)} arquivos"
assert not missing, f"Arquivos essenciais ausentes: {missing}"

html = (root / "index.html").read_bytes()
assert html == (root / "agua.html").read_bytes(), "Index do jogo não equivale ao laboratório"
html_text = html.decode("utf-8")
for name in re.findall(r'<script[^>]+src="\./([^"]+)', html_text):
    assert (root / name).is_file(), f"Script referenciado mas ausente: {name}"

gltfs = list((root / "assets").rglob("*.gltf"))
assert len(gltfs) >= 7
for asset in gltfs:
    doc = json.loads(asset.read_text(encoding="utf-8"))
    for item in doc.get("buffers", []):
        uri = item.get("uri", "")
        if uri and not uri.startswith("data:"):
            assert (asset.parent / uri).is_file(), f"Buffer ausente: {asset.parent / uri}"

main = (root / "agua-v1226.js").read_text(encoding="utf-8")
eco = (root / "ecossistema-v1232.js").read_text(encoding="utf-8")
assert "function updateGame(dt){" in main and "function hydrologyStep(dt){" in main
assert "async function grassShape(){" in eco
print(f"Jogo íntegro: {len(assets)} assets, {len(gltfs)} glTFs, scripts e HTML verificados.")
