from typing import List
from sqlalchemy.orm import Session
from app.models import Listing, RenterQuery, Match
from app.ai_provider import write_match_message
from app.config import settings
from datetime import datetime, timezone
import uuid

def score_match(listing: Listing, query: RenterQuery) -> float:
    score = 0.0
    # City match (40 pts)
    if query.preferred_city and listing.city:
        if query.preferred_city.lower() in listing.city.lower() or listing.city.lower() in query.preferred_city.lower():
            score += 40.0
        elif query.preferred_city.lower() in ["any", "anywhere", ""]:
            score += 20.0
    # Budget match (30 pts)
    if query.max_budget and listing.rent_price:
        if listing.rent_price <= query.max_budget:
            score += 30.0
        elif listing.rent_price <= query.max_budget * 1.1:
            score += 15.0
    # Rooms match (20 pts)
    if query.min_rooms and listing.rooms:
        if listing.rooms >= query.min_rooms:
            score += 20.0
        elif listing.rooms >= query.min_rooms - 1:
            score += 10.0
    # Quality bonus (10 pts)
    score += (listing.quality_score or 5.0)
    return round(min(score, 100.0), 1)

def find_matches(query: RenterQuery, db: Session, top_n: int = 5) -> List[dict]:
    listings = db.query(Listing).filter(Listing.status == "active").all()
    scored = []
    for listing in listings:
        s = score_match(listing, query)
        if s >= 30:
            scored.append({"listing": listing, "score": s})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_n]

def create_matches(query_id: str, db: Session) -> List[Match]:
    query = db.query(RenterQuery).filter(RenterQuery.id == query_id).first()
    if not query:
        return []
    results = find_matches(query, db)
    matches = []
    for r in results:
        listing = r["listing"]
        existing = db.query(Match).filter(
            Match.listing_id == listing.id,
            Match.query_id == query_id
        ).first()
        if existing:
            existing.score = r["score"]
            matches.append(existing)
            continue
        listings_data = [{"property_type": listing.property_type, "city": listing.city,
                          "neighborhood": listing.neighborhood, "rent_price": listing.rent_price,
                          "rooms": listing.rooms, "size_m2": listing.size_m2,
                          "available_from": listing.available_from, "contact_info": listing.contact_info}]
        client_data = {"name": query.name, "preferred_city": query.preferred_city,
                       "max_budget": query.max_budget, "min_rooms": query.min_rooms,
                       "move_in_date": query.move_in_date}
        msg = write_match_message(client_data, listings_data,
                                  fee=settings.SERVICE_FEE_EUR,
                                  paypal_link=settings.PAYPAL_LINK)
        match = Match(
            id=str(uuid.uuid4()),
            listing_id=listing.id,
            query_id=query_id,
            score=r["score"],
            message_text=msg,
            status="pending"
        )
        db.add(match)
        matches.append(match)
    db.commit()
    return matches
