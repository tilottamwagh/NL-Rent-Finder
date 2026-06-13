import requests
from bs4 import BeautifulSoup
import hashlib, time, random
from fake_useragent import UserAgent
from app.ai_provider import score_listing_quality

BASE = "https://www.pararius.nl/huurwoningen/nederland"

def get_headers():
    try:
        ua = UserAgent()
        return {"User-Agent": ua.random, "Accept-Language": "nl-NL,nl;q=0.9"}
    except:
        return {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

def parse_price(text: str) -> float:
    nums = re.findall(r"[\d.]+", text.replace(",", "."))
    for n in nums:
        try:
            v = float(n.replace(".", ""))
            if 100 < v < 20000:
                return v
        except:
            pass
    return 0.0

import re

def scrape_pararius(max_pages: int = 3) -> list:
    listings = []
    for page in range(1, max_pages + 1):
        try:
            url = f"{BASE}/pagina-{page}" if page > 1 else BASE
            resp = requests.get(url, headers=get_headers(), timeout=15)
            if resp.status_code != 200:
                break
            soup = BeautifulSoup(resp.text, "lxml")
            items = soup.select(".listing-search-item__link--title") or soup.select("section.listing-search-item")
            for item in items:
                try:
                    parent = item.find_parent("section") or item.find_parent("li") or item
                    title = parent.select_one("a[class*='title']") or parent.find("h2")
                    price_el = parent.select_one("[class*='price']")
                    city_el = parent.select_one("[class*='city']") or parent.select_one("[class*='location']")
                    detail_el = parent.select_one("[class*='features']") or parent.select_one("[class*='detail']")
                    raw = parent.get_text(separator=" ", strip=True)
                    city = city_el.get_text(strip=True) if city_el else "Netherlands"
                    price = parse_price(price_el.get_text()) if price_el else 0.0
                    rooms_match = re.search(r"(\d+)\s*(kamer|room|slaap)", raw, re.I)
                    rooms = int(rooms_match.group(1)) if rooms_match else None
                    size_match = re.search(r"(\d+)\s*m[²2]", raw)
                    size = float(size_match.group(1)) if size_match else None
                    link_el = parent.find("a", href=True)
                    source_url = "https://www.pararius.nl" + link_el["href"] if link_el and link_el["href"].startswith("/") else ""
                    hash_key = hashlib.md5(f"{city}{price}{rooms}".encode()).hexdigest()
                    listing = {"source": "Pararius", "source_url": source_url, "city": city,
                               "rent_price": price, "rooms": rooms, "size_m2": size,
                               "property_type": "Apartment", "raw_text": raw[:500],
                               "hash_key": hash_key}
                    listing["quality_score"] = score_listing_quality(listing)
                    listings.append(listing)
                except:
                    continue
            time.sleep(random.uniform(2.0, 4.0))
        except Exception as e:
            print(f"Pararius page {page} error: {e}")
            break
    return listings
