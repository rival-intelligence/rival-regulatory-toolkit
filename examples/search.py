import json
import os
import urllib.parse
import urllib.request

base_url = os.getenv("RIVAL_API_BASE_URL", "https://api.tryrival.ai").rstrip("/")
api_key = os.environ["RIVAL_API_KEY"]

params = urllib.parse.urlencode({
    "q": "49 CFR 195.573 corrosion control",
    "authority": "phmsa",
    "limit": "3",
})

request = urllib.request.Request(
    f"{base_url}/api/v1/search?{params}",
    headers={
        "Accept": "application/json",
        "Authorization": f"Bearer {api_key}",
    },
)

with urllib.request.urlopen(request) as response:
    print(json.dumps(json.load(response), indent=2))
