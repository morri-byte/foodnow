"""Søger rigtige madfotos med kommerciel licens via Openverse (Wikimedia + Flickr).
Gemmer kandidater i tools/candidates.json. Kør: python3 tools/search_images.py"""
import json, time, urllib.request, urllib.parse, os, sys
UA = "FoodNowImageFetcher/1.0 (https://github.com/morri-byte/foodnow)"
HERE = os.path.dirname(__file__)
Q = json.load(open(os.path.join(HERE, "queries.json")))
OUT = os.path.join(HERE, "candidates.json")
cand = json.load(open(OUT)) if os.path.exists(OUT) else {}

def search(q):
    url = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode({
        "q": q, "license_type": "commercial", "source": "wikimedia,flickr", "page_size": 20, "mature": "false"})
    for attempt in range(6):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            return json.load(urllib.request.urlopen(req, timeout=30))["results"]
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 30 * (attempt + 1); print("  429 - venter", wait, "s", flush=True); time.sleep(wait); continue
            print("  HTTP", e.code, flush=True); return []
        except Exception as e:
            print("  fejl", e, flush=True); time.sleep(5)
    return []

def good(r):
    w, h = r.get("width") or 0, r.get("height") or 0
    if w and h and (w < 700 or not (0.9 <= w / h <= 2.2)): return False
    return (r.get("url") or "").lower().split("?")[0].endswith((".jpg", ".jpeg"))

for i, (rid, qs) in enumerate(Q.items()):
    if rid in cand and len(cand[rid]) >= 4: continue
    seen, res = set(), []
    for q in qs:
        for r in search(q):
            if r["id"] in seen or not good(r): continue
            seen.add(r["id"])
            res.append({k: r.get(k) for k in ("id", "title", "creator", "creator_url", "license", "license_version",
                                               "license_url", "foreign_landing_url", "url", "thumbnail", "width", "height", "source")})
        time.sleep(4)
        if len(res) >= 8: break
    cand[rid] = res[:8]
    json.dump(cand, open(OUT, "w"), ensure_ascii=False, indent=1)
    print(f"{i+1}/{len(Q)} {rid}: {len(cand[rid])} kandidater", flush=True)
print("FÆRDIG")
