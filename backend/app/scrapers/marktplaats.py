import requests
import hashlib
import re
from xml.etree import ElementTree as ET
from app.ai_provider import score_listing_quality

RSS_URL = "https://www.marktplaats.nl/l/huizen-en-kamers/te-huur/rss.xml"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; NLRentFinder/1.0)",
    "Accept": "application/rss+xml, application/xml, text/xml",
    "Accept-Language": "nl-NL,nl;q=0.9",
}

def scrape_marktplaats(max_pages: int = 3) -> list:
    listings = []
    try:
        resp = requests.get(RSS_URL, headers=HEADERS, timeout=20)
        print(f"Marktplaats RSS status: {resp.status_code}, size: {len(resp.content)} bytes")
        if resp.status_code != 200:
            print(f"Marktplaats RSS blocked: {resp.status_code}")
            return listings

        root = ET.fromstring(resp.content)
        channel = root.find("channel")
        if channel is None:
            print("Marktplaats RSS: no <channel> element found")
            return listings

        items = channel.findall("item")
        print(f"Marktplaats RSS: found {len(items)} items")

        for item in items:
            try:
                title = item.findtext("title", "")
                description = item.findtext("description", "")
                link = item.findtext("link", "")
                raw = f"{title} {description}"

                price_match = re.search(r"€\s*([\d.,]+)", raw)
                price = float(price_match.group(1).replace(".", "").replace(",", ".")) if price_match else 0.0

                city_match = re.search(
                    r"(Amsterdam|Rotterdam|Utrecht|Den Haag|Eindhoven|Groningen|Haarlem|Leiden|Delft|Tilburg|Maastricht|Breda|Nijmegen|Enschede|Almere)",
                    raw, re.I
                )
                city = city_match.group(1) if city_match else "Netherlands"

                size_match = re.search(r"(\d+)\s*m[²2]", raw)
                size = float(size_match.group(1)) if size_match else None

                rooms_match = re.search(r"(\d+)\s*(kamer|slaapkamer|room|bedroom)", raw, re.I)
                rooms = int(rooms_match.group(1)) if rooms_match else None

                hash_key = hashlib.md5(f"marktplaats{link}".encode()).hexdigest()
                listing = {
                    "source": "Marktplaats",
                    "source_url": link,
                    "city": city,
                    "rent_price": price,
                    "rooms": rooms,
                    "size_m2": size,
                    "property_type": "Apartment",
                    "raw_text": raw[:500],
                    "hash_key": hash_key,
                }
                listing["quality_score"] = score_listing_quality(listing)
                listings.append(listing)
            except Exception as e:
                print(f"Marktplaats item parse error: {e}")
                continue

    except Exception as e:
        print(f"Marktplaats scraper error: {e}")

    print(f"Marktplaats: returning {len(listings)} listings")
    return listings
