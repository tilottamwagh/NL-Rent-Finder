import os
import json
import re
from app.config import settings

# Model map for LiteLLM routing
MODEL_MAP = {
    "openai":    lambda m: m,
    "anthropic": lambda m: f"anthropic/{m}",
    "gemini":    lambda m: f"gemini/{m}",
    "groq":      lambda m: f"groq/{m}",
    "ollama":    lambda m: f"ollama/{m}",
}

def get_model_string(provider: str, model: str) -> str:
    fn = MODEL_MAP.get(provider, lambda m: m)
    return fn(model)

def ask_ai(prompt: str, system: str = "", max_tokens: int = 800, provider: str = None, model: str = None) -> str:
    try:
        from litellm import completion
        _provider = provider or settings.AI_PROVIDER
        _model    = model    or settings.AI_MODEL
        model_str = get_model_string(_provider, _model)
        messages  = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        if settings.OPENAI_API_KEY:
            os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
        if settings.ANTHROPIC_API_KEY:
            os.environ["ANTHROPIC_API_KEY"] = settings.ANTHROPIC_API_KEY
        if settings.GEMINI_API_KEY:
            os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
        if settings.GROQ_API_KEY:
            os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY
        resp = completion(model=model_str, messages=messages, max_tokens=max_tokens)
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"AI error ({_provider}/{_model}): {e}")
        return ""

def parse_listing_text(raw_text: str) -> dict:
    system = """You are an expert Dutch rental listing parser.
Extract rental details from text (Dutch or English).
Return ONLY valid JSON, no markdown, no explanation.
JSON schema:
{
  "property_type": "Apartment|House|Studio|Flat|Room",
  "city": "string",
  "neighborhood": "string or null",
  "rent_price": number or null,
  "size_m2": number or null,
  "rooms": integer or null,
  "available_from": "YYYY-MM-DD or string or null",
  "furnished": boolean,
  "contact_info": "string or null",
  "landlord_name": "string or null"
}"""
    result = ask_ai(raw_text, system=system, max_tokens=400)
    try:
        clean = re.sub(r"```json|```", "", result).strip()
        return json.loads(clean)
    except:
        return {}

def is_rental_listing(text: str) -> bool:
    system = "You decide if a message is a rental listing. Reply only YES or NO."
    prompt = f"Is this a rental listing?\n\n{text[:500]}"
    result = ask_ai(prompt, system=system, max_tokens=5)
    return result.strip().upper().startswith("YES")

def write_match_message(client: dict, listings: list, fee: int = 50, paypal_link: str = "") -> str:
    listings_text = "\n".join([
        f"- {l.get('property_type','Property')} in {l.get('neighborhood','')}, {l.get('city','')} "
        f"€{l.get('rent_price',0)}/mo | {l.get('rooms','')} rooms | {l.get('size_m2','')}m² | "
        f"Available: {l.get('available_from','TBD')} | Contact: {l.get('contact_info','')}"
        for l in listings
    ])
    system = """Write a friendly, professional WhatsApp message for a rental finder service.
Be warm, concise, and specific about why each listing matches the client.
End with the service fee and PayPal payment info. Use line breaks for readability."""
    prompt = f"""Client: {client.get('name')}
Looking for: {client.get('preferred_city')} | Max €{client.get('max_budget')}/mo | {client.get('min_rooms')}+ rooms
Move-in: {client.get('move_in_date','ASAP')}

Matched listings:
{listings_text}

Service fee: €{fee}
PayPal: {paypal_link or 'QR code attached'}"""
    result = ask_ai(prompt, system=system, max_tokens=600)
    return result if result else f"Hi {client.get('name')}! Found {len(listings)} matches for you."

def understand_query(raw_text: str) -> dict:
    system = """Extract rental search requirements from casual text (Dutch or English).
Return ONLY valid JSON:
{
  "preferred_city": "string",
  "max_budget": number or null,
  "min_rooms": integer or null,
  "move_in_date": "string or null",
  "furnished_required": boolean,
  "notes": "string"
}"""
    result = ask_ai(raw_text, system=system, max_tokens=300)
    try:
        clean = re.sub(r"```json|```", "", result).strip()
        return json.loads(clean)
    except:
        return {}

def score_listing_quality(listing: dict) -> float:
    score = 0.0
    if listing.get("rent_price"): score += 2.0
    if listing.get("rooms"):      score += 1.5
    if listing.get("size_m2"):    score += 1.5
    if listing.get("city"):       score += 1.0
    if listing.get("neighborhood"): score += 0.5
    if listing.get("available_from"): score += 1.0
    if listing.get("contact_info"):   score += 1.5
    if listing.get("description") and len(listing.get("description","")) > 50: score += 1.0
    return round(min(score, 10.0), 1)

def test_connection(provider: str, model: str, api_key: str) -> dict:
    import os
    if provider == "openai":   os.environ["OPENAI_API_KEY"] = api_key
    if provider == "anthropic": os.environ["ANTHROPIC_API_KEY"] = api_key
    if provider == "gemini":   os.environ["GEMINI_API_KEY"] = api_key
    if provider == "groq":     os.environ["GROQ_API_KEY"] = api_key
    result = ask_ai("Say hello in one word.", provider=provider, model=model, max_tokens=10)
    return {"success": bool(result), "response": result}
