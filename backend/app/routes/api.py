from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Listing, RenterQuery, Match, ScraperLog, AISettings
from app.ai_provider import parse_listing_text, understand_query, score_listing_quality, test_connection, write_match_message
from app.matching import create_matches, find_matches
from app.config import settings
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid, hashlib

router = APIRouter()

# ─── LISTINGS ──────────────────────────────────────────────
class ListingCreate(BaseModel):
    source: str = "Manual"
    source_url: Optional[str] = None
    property_type: Optional[str] = "Apartment"
    city: str
    neighborhood: Optional[str] = None
    rent_price: Optional[float] = None
    size_m2: Optional[float] = None
    rooms: Optional[int] = None
    available_from: Optional[str] = None
    furnished: Optional[bool] = False
    contact_info: Optional[str] = None
    description: Optional[str] = None

@router.get("/listings")
def get_listings(city: Optional[str]=None, property_type: Optional[str]=None,
                 max_price: Optional[float]=None, min_rooms: Optional[int]=None,
                 source: Optional[str]=None, status: Optional[str]="active",
                 skip: int=0, limit: int=50, db: Session=Depends(get_db)):
    q = db.query(Listing)
    if status:   q = q.filter(Listing.status == status)
    if city:     q = q.filter(Listing.city.ilike(f"%{city}%"))
    if property_type: q = q.filter(Listing.property_type.ilike(f"%{property_type}%"))
    if max_price: q = q.filter(Listing.rent_price <= max_price)
    if min_rooms: q = q.filter(Listing.rooms >= min_rooms)
    if source:   q = q.filter(Listing.source == source)
    total = q.count()
    items = q.order_by(Listing.scraped_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": [listing_to_dict(l) for l in items]}

@router.post("/listings")
def create_listing(data: ListingCreate, db: Session=Depends(get_db)):
    exp = datetime.now(timezone.utc) + timedelta(days=settings.LISTING_EXPIRY_DAYS)
    hash_key = hashlib.md5(f"{data.city}{data.rent_price}{data.rooms}{data.neighborhood}".encode()).hexdigest()
    existing = db.query(Listing).filter(Listing.hash_key == hash_key).first()
    if existing:
        raise HTTPException(409, "Duplicate listing")
    listing = Listing(id=str(uuid.uuid4()), **data.dict(), hash_key=hash_key,
                      quality_score=score_listing_quality(data.dict()), expires_at=exp, status="active")
    db.add(listing); db.commit(); db.refresh(listing)
    return listing_to_dict(listing)

@router.delete("/listings/{listing_id}")
def delete_listing(listing_id: str, db: Session=Depends(get_db)):
    l = db.query(Listing).filter(Listing.id == listing_id).first()
    if not l: raise HTTPException(404)
    db.delete(l); db.commit()
    return {"success": True}

@router.post("/listings/parse")
def parse_listing(payload: dict, db: Session=Depends(get_db)):
    raw = payload.get("text", "")
    parsed = parse_listing_text(raw)
    parsed["raw_text"] = raw
    return parsed

# ─── QUERIES ──────────────────────────────────────────────
class QueryCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    preferred_city: Optional[str] = None
    max_budget: Optional[float] = None
    min_rooms: Optional[int] = 1
    min_size_m2: Optional[float] = None
    move_in_date: Optional[str] = None
    furnished_required: Optional[bool] = False
    notes: Optional[str] = None
    raw_query_text: Optional[str] = None

@router.get("/queries")
def get_queries(db: Session=Depends(get_db)):
    items = db.query(RenterQuery).filter(RenterQuery.is_active == True).order_by(RenterQuery.created_at.desc()).all()
    return [query_to_dict(q) for q in items]

@router.post("/queries")
def create_query(data: QueryCreate, db: Session=Depends(get_db)):
    if data.raw_query_text and not data.preferred_city:
        understood = understand_query(data.raw_query_text)
        if understood.get("preferred_city"): data.preferred_city = understood["preferred_city"]
        if understood.get("max_budget") and not data.max_budget: data.max_budget = understood["max_budget"]
        if understood.get("min_rooms") and not data.min_rooms: data.min_rooms = understood["min_rooms"]
    q = RenterQuery(id=str(uuid.uuid4()), **data.dict())
    db.add(q); db.commit(); db.refresh(q)
    return query_to_dict(q)

@router.delete("/queries/{query_id}")
def delete_query(query_id: str, db: Session=Depends(get_db)):
    q = db.query(RenterQuery).filter(RenterQuery.id == query_id).first()
    if not q: raise HTTPException(404)
    q.is_active = False; db.commit()
    return {"success": True}

# ─── MATCHES ──────────────────────────────────────────────
@router.get("/matches/{query_id}")
def get_matches(query_id: str, db: Session=Depends(get_db)):
    matches = create_matches(query_id, db)
    result = []
    for m in matches:
        listing = db.query(Listing).filter(Listing.id == m.listing_id).first()
        result.append({"id": m.id, "score": m.score, "message": m.message_text,
                       "listing": listing_to_dict(listing) if listing else {}})
    result.sort(key=lambda x: x["score"], reverse=True)
    return result

@router.get("/matches")
def get_all_matches(db: Session=Depends(get_db)):
    matches = db.query(Match).order_by(Match.created_at.desc()).limit(50).all()
    return [{"id":m.id,"score":m.score,"query_id":m.query_id,"listing_id":m.listing_id,
             "created_at":str(m.created_at),"status":m.status} for m in matches]

# ─── SCRAPER ──────────────────────────────────────────────
@router.get("/scraper/logs")
def get_scraper_logs(db: Session=Depends(get_db)):
    logs = db.query(ScraperLog).order_by(ScraperLog.started_at.desc()).limit(20).all()
    return [{"id":l.id,"source":l.source,"status":l.status,"listings_found":l.listings_found,
             "listings_saved":l.listings_saved,"started_at":str(l.started_at),
             "finished_at":str(l.finished_at),"error":l.error_message} for l in logs]

@router.post("/scraper/run")
def trigger_scrape():
    try:
        from app.celery_tasks import scrape_all
        scrape_all.delay()
        return {"success": True, "message": "Scrape started"}
    except Exception as e:
        return {"success": False, "message": str(e)}

# ─── AI SETTINGS ──────────────────────────────────────────
class AISettingsUpdate(BaseModel):
    provider: str
    model: str
    api_key: Optional[str] = None

@router.get("/ai/settings")
def get_ai_settings(db: Session=Depends(get_db)):
    s = db.query(AISettings).filter(AISettings.id == 1).first()
    if not s:
        return {"provider": settings.AI_PROVIDER, "model": settings.AI_MODEL}
    return {"provider": s.provider, "model": s.model}

@router.post("/ai/settings")
def update_ai_settings(data: AISettingsUpdate, db: Session=Depends(get_db)):
    s = db.query(AISettings).filter(AISettings.id == 1).first()
    if not s:
        s = AISettings(id=1)
        db.add(s)
    s.provider = data.provider
    s.model = data.model
    if data.provider == "openai" and data.api_key:     s.api_key_openai = data.api_key
    if data.provider == "anthropic" and data.api_key:  s.api_key_anthropic = data.api_key
    if data.provider == "gemini" and data.api_key:     s.api_key_gemini = data.api_key
    if data.provider == "groq" and data.api_key:       s.api_key_groq = data.api_key
    db.commit()
    return {"success": True}

@router.post("/ai/test")
def test_ai(payload: dict):
    return test_connection(payload.get("provider","openai"), payload.get("model","gpt-4o-mini"), payload.get("api_key",""))

# ─── STATS ──────────────────────────────────────────────
@router.get("/stats")
def get_stats(db: Session=Depends(get_db)):
    from sqlalchemy import func
    total = db.query(Listing).filter(Listing.status == "active").count()
    queries = db.query(RenterQuery).filter(RenterQuery.is_active == True).count()
    matches = db.query(Match).count()
    sources = db.query(Listing.source, func.count(Listing.id)).group_by(Listing.source).all()
    recent = db.query(Listing).filter(Listing.status == "active").order_by(Listing.scraped_at.desc()).limit(5).all()
    return {"total_listings": total, "total_queries": queries, "total_matches": matches,
            "sources": {s: c for s, c in sources},
            "recent": [listing_to_dict(l) for l in recent]}

# ─── HELPERS ──────────────────────────────────────────────
def listing_to_dict(l):
    return {"id":l.id,"source":l.source,"source_url":l.source_url,"property_type":l.property_type,
            "city":l.city,"neighborhood":l.neighborhood,"address":l.address,"rent_price":l.rent_price,
            "size_m2":l.size_m2,"rooms":l.rooms,"available_from":l.available_from,"furnished":l.furnished,
            "contact_info":l.contact_info,"description":l.description,"quality_score":l.quality_score,
            "status":l.status,"scraped_at":str(l.scraped_at)}

def query_to_dict(q):
    return {"id":q.id,"name":q.name,"phone":q.phone,"email":q.email,"preferred_city":q.preferred_city,
            "max_budget":q.max_budget,"min_rooms":q.min_rooms,"move_in_date":q.move_in_date,
            "furnished_required":q.furnished_required,"notes":q.notes,"created_at":str(q.created_at)}
