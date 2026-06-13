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
            for item in items:
                existing = db.query(Listing).filter(Listing.hash_key == item.get("hash_key")).first()
                if existing:
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
                    hash_key=item.get("hash_key", str(uuid.uuid4())),
                    quality_score=item.get("quality_score", 5.0),
                    expires_at=exp,
                    status="active"
                )
                db.add(listing)
                saved += 1
            db.commit()
            log.status = "success"
            log.listings_found = len(items)
            log.listings_saved = saved
            log.finished_at = datetime.now(timezone.utc)
            db.commit()
        except Exception as e:
            log.status = "error"
            log.error_message = str(e)
            log.finished_at = datetime.now(timezone.utc)
            db.commit()
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
