"""Henter de udvalgte fotos (tools/selected.json: {ret-id: kandidat-nummer}), beskærer til 4:3,
gemmer i www/billeder/ og skriver www/data/billeder.js med kreditering."""
import json, os, io, re, time, urllib.request, urllib.parse
from PIL import Image, ImageOps
UA = "FoodNowImageFetcher/1.0 (https://github.com/morri-byte/foodnow)"
HERE = os.path.dirname(__file__); ROOT = os.path.dirname(HERE)
cand = json.load(open(os.path.join(HERE, "candidates.json")))
sel = json.load(open(os.path.join(HERE, "selected.json")))
OUT = os.path.join(ROOT, "www", "billeder"); os.makedirs(OUT, exist_ok=True)
JS = os.path.join(ROOT, "www", "data", "billeder.js")
meta = {}
if os.path.exists(JS):
    try: meta = json.loads(open(JS).read().split("=", 1)[1].strip().rstrip(";"))
    except Exception: meta = {}
def wm_thumb(url, w=1280):
    m = re.match(r"https://upload\.wikimedia\.org/wikipedia/commons/(\w)/(\w\w)/(.+)$", url)
    return f"https://upload.wikimedia.org/wikipedia/commons/thumb/{m.group(1)}/{m.group(2)}/{m.group(3)}/{w}px-{m.group(3)}" if m else url
def get(url):
    for a in range(5):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=40).read()
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(20 * (a + 1)); continue
            raise
    raise RuntimeError("for mange 429")
LIC = {"by": "CC BY", "by-sa": "CC BY-SA", "cc0": "CC0", "pdm": "Public Domain"}
for rid, idx in sel.items():
    if idx is None: continue
    c = cand[rid][idx]; path = os.path.join(OUT, rid + ".jpg")
    if os.path.exists(path) and meta.get(rid, {}).get("id") == c["id"]: continue
    urls = [wm_thumb(c["url"]), wm_thumb(c["url"], 960), c["url"]] if c["source"] == "wikimedia" else [c["url"]]
    data = None
    for u in urls:
        try: data = get(u); break
        except Exception as e: print("  fejl", rid, u[:60], e, flush=True); time.sleep(3)
    if not data: continue
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    im = ImageOps.fit(im, (960, 720), Image.LANCZOS, centering=(0.5, 0.5))
    im.save(path, "JPEG", quality=76, optimize=True, progressive=True)
    lic = (LIC.get(c["license"], c["license"].upper()) + " " + (c.get("license_version") or "")).strip()
    meta[rid] = {"f": f"billeder/{rid}.jpg", "id": c["id"], "title": c.get("title"), "by": c.get("creator"),
                 "lic": lic, "licUrl": c.get("license_url"), "src": c.get("foreign_landing_url"), "mod": True}
    open(JS, "w").write("/* Fotos via Openverse (Wikimedia Commons / Flickr), CC-licenser – se Billedkreditter i appen */\nwindow.FN_IMG = " + json.dumps(meta, ensure_ascii=False, indent=0) + ";\n")
    print("ok", rid, os.path.getsize(path) // 1024, "KB", flush=True); time.sleep(2)
print("FÆRDIG", len(meta))
