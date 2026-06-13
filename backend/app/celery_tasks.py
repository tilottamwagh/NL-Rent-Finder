from celery import Celery
from celery.schedules import crontab
from app.config import settings
import uuid
from datetime import datetime, timezone, timedelta

celery_app = Celery("nlrentfinder", broker=settings.REDIS_URL, backend=settings.REDIS_URL)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Europe/Amsterdam",
    enable_utc=True,
    beat_schedule={
        "scrape-all-sites": {
            "task": "app.celery_tasks.scrape_all",
            "schedule": crontab(minute=0, hour=f"*/{settings.SCRAPE_INTERVAL_HOURS}"),
        },
        "expire-old-listings": {
            "task": "app.celery_tasks.expire_listings",
            "schedule": crontab(minute=0, hour=6),
        },
    },
)

def _is_valid_listing(item: dict) -> bool:
    """Reject junk scraped from nav bars / search widgets / empty elements.
    A real listing must have at least a price, a size, or a number of rooms,
    and some meaningful raw text."""
    has_data = bool(item.get("rent_price")) or item.get("size_m2") or item.get("rooms")
    raw = (item.get("raw_text") or "").strip()
    return has_data and len(raw) >= 20


@celery_app.task(name="app.celery_tasks.scrape_all")
def scrape_all():
    from app.database import SessionLocal
    from app.models import Listing, ScraperLog
    from app.scrapers.marktplaats import scrape_marktplaats
    from app.scrapers.pararius import scrape_pararius
    from app.scrapers.kamernet_ha import scrape_kamernet, scrape_housinganywhere
    db = SessionLocal()
    sources = [
        ("Marktplaats", scrape_marktplaats),
        ("Pararius", scrape_pararius),
        ("Kamernet", scrape_kamernet),
        ("HousingAnywhere", scrape_housinganywhere),
    ]
    for source_name, fn in sources:
        log = ScraperLog(id=str(uuid.uuid4()), source=source_name, status="running")
        db.add(log)
        db.commit()
        try:
            items = fn()
            saved = 0
            skipped_junk = 0
            seen_hashes = set()  # dedup within this run, not just against the DB
            for item in items:
                if not _is_valid_listing(item):
                    skipped_junk += 1
                    continue
                hash_key = item.get("hash_key") or str(uuid.uuid4())
                if hash_key in seen_hashes:
                    continue
                seen_hashes.add(hash_key)
                if db.query(Listing).filter(Listing.hash_key == hash_key).first():
                    continue
                exp = datetime.now(timezone.utc) + timedelta(days=settings.LISTING_EXPIRY_DAYS)
                listing = Listing(
                    id=str(uuid.uuid4()),
                    source=item.get("source", source_name),
                    source_url=item.get("source_url", ""),
                    property_type=item.get("property_type", "Apartment"),
                    city=item.get("city", ""),
                    neighborhood=item.get("neighborhood"),
                    rent_price=item.get("rent_price"),
                    size_m2=item.get("size_m2"),
                    rooms=item.get("rooms"),
                    available_from=item.get("available_from"),
                    furnished=item.get("furnished", False),
                    contact_info=item.get("contact_info"),
                    raw_text=item.get("raw_text", ""),
                    hash_key=hash_key,
                    quality_score=item.get("quality_score", 5.0),
                    expires_at=exp,
                    status="active"
                )
                # savepoint per row: a duplicate/bad row is skipped, not fatal
                try:
                    with db.begin_nested():
                        db.add(listing)
                        db.flush()
                    saved += 1
                except Exception as row_err:
                    print(f"{source_name}: skipped row: {row_err}")
            db.commit()
            log.status = "success"
            log.listings_found = len(items)
            log.listings_saved = saved
            log.finished_at = datetime.now(timezone.utc)
            db.commit()
            print(f"{source_name}: {len(items)} found, {saved} saved, {skipped_junk} junk skipped")
        except Exception as e:
            db.rollback()  # recover the session before writing the error log
            log.status = "error"
            log.error_message = str(e)[:1000]
            log.finished_at = datetime.now(timezone.utc)
            db.commit()
            print(f"{source_name} scrape failed: {e}")
    db.close()
    return "Scraping complete"

@celery_app.task(name="app.celery_tasks.expire_listings")
def expire_listings():
    from app.database import SessionLocal
    from app.models import Listing
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    expired = db.query(Listing).filter(
        Listing.expires_at < now,
        Listing.status == "active"
    ).all()
    for l in expired:
        l.status = "expired"
    db.commit()
    db.close()
    return f"Expired {len(expired)} listings"
