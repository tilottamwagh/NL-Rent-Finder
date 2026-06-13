import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import hashlib, re, time, random
from app.ai_provider import parse_listing_text, score_listing_quality

BASE_URL = "https://www.marktplaats.nl/l/huizen-en-kamers/te-huur/p/1/"
HEADERS = {"Accept-Language": "nl-NL,nl;q=0.9", "Accept": "text/html,application/xhtml+xml"}

def get_headers():
    try:
        ua = UserAgent()
        return {**HEADERS, "User-Agent": ua.random}
    except:
        return {**HEADERS, "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}

def scrape_marktplaats(max_pages: int = 3) -> list:
    listings = []
    for page in range(1, max_pages + 1):
        try:
            url = f"{BASE_URL}?currentPage={page}"
            resp = requests.get(url, headers=get_headers(), timeout=15)
            if resp.status_code != 200:
                break
            soup = BeautifulSoup(resp.text, "lxml")
            items = soup.select("li[class*='listing']") or soup.select("article") or soup.select(".mp-listing")
            for item in items:
                try:
                    raw = item.get_text(separator=" ", strip=True)
                    if len(raw) < 20:
                        continue
                    link_el = item.find("a", href=True)
                    url_listing = "https://www.marktplaats.nl" + link_el["href"] if link_el and link_el["href"].startswith("/") else (link_el["href"] if link_el else "")
                    parsed = parse_listing_text(raw)
                    if not parsed.get("city"):
                        parsed["city"] = "Netherlands"
                    hash_key = hashlib.md5(f"{parsed.get('city','')}{parsed.get('rent_price','')}{parsed.get('rooms','')}".encode()).hexdigest()
                    parsed["source"] = "Marktplaats"
                    parsed["source_url"] = url_listing
                    parsed["raw_text"] = raw[:500]
                    parsed["hash_key"] = hash_key
                    parsed["quality_score"] = score_listing_quality(parsed)
                    listings.append(parsed)
                except Exception as e:
                    continue
            time.sleep(random.uniform(1.5, 3.0))
        except Exception as e:
            print(f"Marktplaats page {page} error: {e}")
            break
    return listings
