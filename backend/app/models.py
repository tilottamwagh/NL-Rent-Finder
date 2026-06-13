from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum
import uuid

def gen_uuid():
    return str(uuid.uuid4())

class ListingSource(str, enum.Enum):
    marktplaats = "Marktplaats"
    pararius = "Pararius"
    kamernet = "Kamernet"
    housinganywhere = "HousingAnywhere"
    telegram = "Telegram"
    manual = "Manual"
    facebook = "Facebook"
    instagram = "Instagram"

class ListingStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    rented = "rented"

class Listing(Base):
    __tablename__ = "listings"
    id = Column(String, primary_key=True, default=gen_uuid)
    source = Column(String, nullable=False)
    source_url = Column(String)
    property_type = Column(String)
    city = Column(String, nullable=False)
    neighborhood = Column(String)
    address = Column(String)
    rent_price = Column(Float)
    size_m2 = Column(Float)
    rooms = Column(Integer)
    available_from = Column(String)
    furnished = Column(Boolean, default=False)
    description = Column(Text)
    contact_info = Column(String)
    landlord_name = Column(String)
    raw_text = Column(Text)
    quality_score = Column(Float, default=5.0)
    status = Column(String, default="active")
    hash_key = Column(String, unique=True)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    matches = relationship("Match", back_populates="listing")

class RenterQuery(Base):
    __tablename__ = "renter_queries"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    phone = Column(String)
    email = Column(String)
    preferred_city = Column(String)
    max_budget = Column(Float)
    min_rooms = Column(Integer, default=1)
    min_size_m2 = Column(Float)
    move_in_date = Column(String)
    furnished_required = Column(Boolean, default=False)
    notes = Column(Text)
    raw_query_text = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_notified_at = Column(DateTime(timezone=True))
    matches = relationship("Match", back_populates="query")

class Match(Base):
    __tablename__ = "matches"
    id = Column(String, primary_key=True, default=gen_uuid)
    listing_id = Column(String, ForeignKey("listings.id"))
    query_id = Column(String, ForeignKey("renter_queries.id"))
    score = Column(Float)
    message_text = Column(Text)
    notified_at = Column(DateTime(timezone=True))
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    listing = relationship("Listing", back_populates="matches")
    query = relationship("RenterQuery", back_populates="matches")

class ScraperLog(Base):
    __tablename__ = "scraper_logs"
    id = Column(String, primary_key=True, default=gen_uuid)
    source = Column(String)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True))
    listings_found = Column(Integer, default=0)
    listings_saved = Column(Integer, default=0)
    status = Column(String, default="running")
    error_message = Column(Text)

class AISettings(Base):
    __tablename__ = "ai_settings"
    id = Column(Integer, primary_key=True, default=1)
    provider = Column(String, default="openai")
    model = Column(String, default="gpt-4o-mini")
    api_key_openai = Column(String)
    api_key_anthropic = Column(String)
    api_key_gemini = Column(String)
    api_key_groq = Column(String)
    ollama_url = Column(String)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
