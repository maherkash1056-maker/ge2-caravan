#!/usr/bin/env python3
# Guard for slot 9. The repo also contains quests/rally.html, the OLD 2D rally; if that ever gets copied to
# build/outputs/Slot-9-Khareef-Rally.html and published, the 3D game disappears from production.
# Run before publish.sh:  python3 caravan/rally/check_slot9.py   → exit 0 only if the slot file matches a known 3D build.
import hashlib, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.environ.get("CARAVAN_OUT") or os.path.join(ROOT, "build", "outputs"); slot = os.path.join(OUT, "Slot-9-Khareef-Rally.html")
man = json.load(open(os.path.join(HERE, "recovered", "MANIFEST.json"), encoding="utf-8"))
src_sha = hashlib.sha256(open(os.path.join(ROOT, "rally3d", "index.html"), "rb").read()).hexdigest()   # pre-publish source (bugcatch not yet injected)
if not os.path.exists(slot): sys.exit(f"slot 9: {slot} is missing — copy rally3d/index.html there (or a newer approved 3D build)")
h = open(slot, "rb").read(); sha = hashlib.sha256(h).hexdigest(); txt = h.decode("utf-8", "replace")
if sha == man["page"]["sha256"]: print("slot 9: identical to the recovered production page (" + sha[:12] + ")"); sys.exit(0)
if sha == src_sha: print("slot 9: identical to rally3d/index.html, the pre-publish source (" + sha[:12] + "); publish.sh will inject the bug catcher"); sys.exit(0)
if "RALLY_BRIDGE" in txt and 'type="module"' in txt and "WebGLRenderer" in txt: print("slot 9: a DIFFERENT 3D build (" + sha[:12] + ") — make sure this is an approved newer version"); sys.exit(0)
sys.exit("slot 9: REFUSING — this file is not the 3D rally (no RALLY_BRIDGE/three.js). It looks like the 2D quest. Do not publish it.")
