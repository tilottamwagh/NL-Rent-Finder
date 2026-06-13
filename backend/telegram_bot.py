import asyncio
import logging
import uuid
from datetime import datetime, timezone, timedelta
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes
from app.config import settings
from app.ai_provider import is_rental_listing, parse_listing_text, score_listing_quality
from app.database import SessionLocal
from app.models import Listing

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return
    text = update.message.text
    if len(text) < 20:
        return
    try:
        if is_rental_listing(text):
            parsed = parse_listing_text(text)
            if parsed.get("city") or parsed.get("rent_price"):
                db = SessionLocal()
                import hashlib
                hash_key = hashlib.md5(f"telegram{parsed.get('city','')}{parsed.get('rent_price','')}{text[:30]}".encode()).hexdigest()
                existing = db.query(Listing).filter(Listing.hash_key == hash_key).first()
                if not existing:
                    exp = datetime.now(timezone.utc) + timedelta(days=settings.LISTING_EXPIRY_DAYS)
                    listing = Listing(
                        id=str(uuid.uuid4()),
                        source="Telegram",
                        property_type=parsed.get("property_type", "Apartment"),
                        city=parsed.get("city", "Netherlands"),
                        neighborhood=parsed.get("neighborhood"),
                        rent_price=parsed.get("rent_price"),
                        size_m2=parsed.get("size_m2"),
                        rooms=parsed.get("rooms"),
                        available_from=parsed.get("available_from"),
                        furnished=parsed.get("furnished", False),
                        contact_info=parsed.get("contact_info"),
                        raw_text=text[:500],
                        hash_key=hash_key,
                        quality_score=score_listing_quality(parsed),
                        expires_at=exp,
                        status="active"
                    )
                    db.add(listing)
                    db.commit()
                    logger.info(f"Saved Telegram listing: {parsed.get('city')} €{parsed.get('rent_price')}")
                db.close()
    except Exception as e:
        logger.error(f"Telegram handler error: {e}")

def run_bot():
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("No Telegram bot token configured")
        return
    app = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    logger.info("Telegram bot started")
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    run_bot()
