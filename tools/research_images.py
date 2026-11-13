"""Ny søgning efter bedre fotos (kun store billeder) til retter i requeries.json. Gemmer i candidates2.json."""
import json, time, urllib.request, urllib.parse, os
UA = "FoodNowImageFetcher/1.0 (https://github.com/morri-byte/foodnow)"
HERE = os.path.dirname(__file__)
Q = json.load(open(os.path.join(HERE, os.environ.get("QFILE","requeries.json"))))
old = json.load(open(os.path.join(HERE, "candidates.json")))
OUT = os.path.join(HERE, os.environ.get("OUTFILE","candidates2.json"))
cand = json.load(open(OUT)) if os.path.exists(OUT) else {}
def search(q, page=1):
    url = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode({"q": q, "license_type": "commercial", "source": "wikimedia,flickr", **({} if os.environ.get("RELAX") else {"size":"large"}), "page_size": 20, "page": page, "mature": "false"})
    for a in range(6):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30))["results"]
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(30*(a+1)); continue
            return []
        except Exception: time.sleep(5)
    return []
def good(r):
    w, h = r.get("width") or 0, r.get("height") or 0
    return w >= (700 if os.environ.get("RELAX") else 900) and h and 1.0 <= w/h <= 1.9 and (r.get("url") or "").lower().split("?")[0].endswith((".jpg",".jpeg"))
for i,(rid,qs) in enumerate(Q.items()):
    if rid in cand and len(cand[rid]) >= (4 if os.environ.get("RELAX") else 8): continue
    seen = {c["id"] for c in old.get(rid,[])}; res=[]
    for q in qs:
        for page in (1,2):
            for r in search(q, page):
                if r["id"] in seen or not good(r): continue
                seen.add(r["id"])
                res.append({k:r.get(k) for k in ("id","title","creator","creator_url","license","license_version","license_url","foreign_landing_url","url","thumbnail","width","height","source")})
            time.sleep(3)
            if len(res) >= 16: break
        if len(res) >= 16: break
    cand[rid]=res[:16]; json.dump(cand,open(OUT,"w"),ensure_ascii=False,indent=1)
    print(f"{i+1}/{len(Q)} {rid}: {len(cand[rid])}", flush=True)
print("FÆRDIG")
