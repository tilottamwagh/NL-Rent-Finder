import requests
from bs4 import BeautifulSoup
import hashlib, time, random, re
from fake_useragent import UserAgent
from app.ai_provider import score_listing_quality

def get_headers():
    try:
        from fake_useragent import UserAgent
        ua = UserAgent()
        return {"User-Agent": ua.random, "Accept-Language": "nl-NL,nl;q=0.9"}
    except:
        return {"User-Agent": "Mozilla/5.0"}

def scrape_kamernet(max_pages: int = 2) -> list:
    listings = []
    base = "https://kamernet.nl/en/for-rent/rooms-netherlands"
    for page in range(1, max_pages + 1):
        try:
            url = f"{base}?pageNo={page}"
            resp = requests.get(url, headers=get_headers(), timeout=15)
            print(f"Kamernet page {page}: status={resp.status_code}, size={len(resp.content)} bytes")
            if resp.status_code != 200:
                print(f"Kamernet blocked on page {page}: {resp.status_code}")
                break
            soup = BeautifulSoup(resp.text, "lxml")
            items = soup.select(".search-result-item") or soup.select("[class*='listing']") or soup.select("article")
            print(f"Kamernet page {page}: found {len(items)} items with CSS selectors")
            for item in items:
                try:
                    raw = item.get_text(separator=" ", strip=True)
                    price_match = re.search(r"€\s*([\d.,]+)", raw)
                    price = float(price_match.group(1).replace(".", "").replace(",", ".")) if price_match else 0.0
                    city_match = re.search(r"(Amsterdam|Rotterdam|Utrecht|Den Haag|Eindhoven|Groningen|Haarlem|Leiden|Delft|Tilburg|Maastricht)", raw, re.I)
                    city = city_match.group(1) if city_match else "Netherlands"
                    size_match = re.search(r"(\d+)\s*m[²2]", raw)
                    size = float(size_match.group(1)) if size_match else None
                    link_el = item.find("a", href=True)
                    source_url = "https://kamernet.nl" + link_el["href"] if link_el and link_el["href"].startswith("/") else ""
                    hash_key = hashlib.md5(f"kamernet{city}{price}{size}".encode()).hexdigest()
                    listing = {"source": "Kamernet", "source_url": source_url, "city": city,
                               "rent_price": price, "size_m2": size, "property_type": "Room",
                               "raw_text": raw[:500], "hash_key": hash_key}
                    listing["quality_score"] = score_listing_quality(listing)
                    listings.append(listing)
                except:
                    continue
            time.sleep(random.uniform(1.5, 3.0))
        except Exception as e:
            print(f"Kamernet page {page} error: {e}")
            break
    return listings

def scrape_housinganywhere(max_pages: int = 2) -> list:
    listings = []
    base = "https://housinganywhere.com/s/Netherlands--Netherlands"
    try:
        resp = requests.get(base, headers=get_headers(), timeout=15)
        if resp.status_code != 200:
            return listings
        soup = BeautifulSoup(resp.text, "lxml")
        items = soup.select("[class*='listing']") or soup.select("[class*='property']") or soup.select("article")
        for item in items:
            try:
                raw = item.get_text(separator=" ", strip=True)
                if len(raw) < 20:
                    continue
                price_match = re.search(r"€\s*([\d.,]+)", raw)
                price = float(price_match.group(1).replace(".", "").replace(",", ".")) if price_match else 0.0
                city_match = re.search(r"(Amsterdam|Rotterdam|Utrecht|Den Haag|Eindhoven|Groningen|Haarlem|Leiden)", raw, re.I)
                city = city_match.group(1) if city_match else "Netherlands"
                link_el = item.find("a", href=True)
                source_url = link_el["href"] if link_el else ""
                if source_url.startswith("/"):
                    source_url = "https://housinganywhere.com" + source_url
                hash_key = hashlib.md5(f"ha{city}{price}{raw[:50]}".encode()).hexdigest()
                listing = {"source": "HousingAnywhere", "source_url": source_url, "city": city,
                           "rent_price": price, "property_type": "Apartment",
                           "raw_text": raw[:500], "hash_key": hash_key}
                listing["quality_score"] = score_listing_quality(listing)
                listings.append(listing)
            except:
                continue
    except Exception as e:
        print(f"HousingAnywhere error: {e}")
    return listings
