# Downloads US public high schools (NCES EDGE, 2024-25) and writes a compact search index.
import json, urllib.request, urllib.parse, gzip, re
B = "https://services1.arcgis.com/Ua5sjt3LWTPigjyD/arcgis/rest/services/Public_School_Locations_Current/FeatureServer/0/query"
where = "UPPER(NAME) LIKE '%HIGH%' OR UPPER(NAME) LIKE '%SECONDARY%' OR UPPER(NAME) LIKE '%SENIOR%' OR UPPER(NAME) LIKE '% HS%' OR UPPER(NAME) LIKE '%H S%'"
out, off = [], 0
while True:
    q = urllib.parse.urlencode({"where": where, "outFields": "NCESSCH,NAME,CITY,STATE,LAT,LON", "resultOffset": off, "resultRecordCount": 2000, "f": "json", "orderByFields": "OBJECTID"})
    d = json.load(urllib.request.urlopen(B + "?" + q, timeout=60))
    fs = d.get("features", [])
    out += [f["attributes"] for f in fs]
    off += len(fs)
    if not fs or not d.get("exceededTransferLimit"): break
skip = re.compile(r"junior high|jr\.? high|middle|elementary|virtual|online|detention|juvenile|correction|jail|preschool|cyber|home school|homeschool", re.I)
def tc(n):
    if n.upper() != n: return n
    w = n.title()
    for k in [" Of ", " And ", " The ", " For ", " At ", " In "]: w = w.replace(k, k.lower())
    return w.replace("Hs", "HS").replace("Ii ", "II ").replace(" Jr ", " Jr. ")
def expand(n): return re.sub(r"\bH S\b|\bHS$", "High School", re.sub(r"\bSr H S\b", "Senior High School", n))
rows = [[a["NCESSCH"], expand(tc(a["NAME"])), a["CITY"].title() if a["CITY"] else "", a["STATE"], round(a["LAT"], 4), round(a["LON"], 4)]
        for a in out if a["LAT"] and not skip.search(a["NAME"]) and a["STATE"] not in ("AS", "GU", "MP", "VI", "BI", "DD")]
json.dump(rows, open("../web/data/schools.json", "w"), separators=(",", ":"))
print(len(out), "matched,", len(rows), "kept")
import collections; print(collections.Counter(r[3] for r in rows).most_common(8))
