"""Henter miniaturer af kandidaterne og laver oversigtsark (10 retter pr. ark) til manuel udvælgelse."""
import json, os, sys, io, time, urllib.request
from PIL import Image, ImageDraw, ImageFont
UA = "FoodNowImageFetcher/1.0 (https://github.com/morri-byte/foodnow)"
HERE = os.path.dirname(__file__)
OUTDIR = sys.argv[1]
ids = sys.argv[2].split(",") if len(sys.argv) > 2 else None
cand = json.load(open(os.path.join(HERE, os.environ.get("CANDS","candidates.json"))))
TH = os.path.join(OUTDIR, "thumbs"); os.makedirs(TH, exist_ok=True)
font = ImageFont.load_default()
def thumb(c):
    p = os.path.join(TH, c["id"] + ".jpg")
    if os.path.exists(p): return Image.open(p)
    import re
    m = re.match(r"https://upload\.wikimedia\.org/wikipedia/commons/(\w)/(\w\w)/(.+)$", c["url"])
    urls = [f"https://upload.wikimedia.org/wikipedia/commons/thumb/{m.group(1)}/{m.group(2)}/{m.group(3)}/330px-{m.group(3)}"] if m else [c["url"].replace("_b.jpg","_n.jpg"), c["url"]]
    for url in urls:
        if not url: continue
        for attempt in range(4):
            try:
                data = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read()
                im = Image.open(io.BytesIO(data)).convert("RGB"); im.thumbnail((360, 270)); im.save(p, quality=80); time.sleep(2.5); return im
            except urllib.error.HTTPError as e:
                if e.code == 429: time.sleep(15 * (attempt + 1)); continue
                print("  thumb-fejl", c["id"][:8], e, flush=True); break
            except Exception as e: print("  thumb-fejl", c["id"][:8], e, flush=True); time.sleep(3); break
    return None
keys = ids or list(cand.keys())
for b in range(0, len(keys), 10):
    batch = keys[b:b+10]
    N = int(os.environ.get("NCOL","8")); W, H = N * 182 + 150, len(batch) * 140
    sheet = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(sheet)
    for row, rid in enumerate(batch):
        y = row * 140
        d.text((4, y + 60), rid[:22], fill="black", font=font)
        for col, c in enumerate(cand.get(rid, [])[:N]):
            im = thumb(c)
            if not im: continue
            im = im.copy(); im.thumbnail((178, 134))
            x = 150 + col * 182; sheet.paste(im, (x, y + 2))
            d.rectangle([x, y + 2, x + 16, y + 16], fill="yellow"); d.text((x + 4, y + 3), str(col), fill="black", font=font)
    out = os.path.join(OUTDIR, f"sheet_{b//10:02d}.jpg"); sheet.save(out, quality=82); print("ark", out, flush=True)
