# NL Rent Finder 🏠

> AI-powered Netherlands rental matching platform  
> `nlrentfinder.tilottamwagh.com` · Deployed on Coolify

## Stack
- **Backend**: Python FastAPI + PostgreSQL + Redis + Celery
- **AI**: LiteLLM (OpenAI / Anthropic / Gemini / Groq / Ollama)
- **Frontend**: React + Vite + Tailwind CSS
- **Scraping**: BeautifulSoup4 + Playwright + Telegram Bot API
- **Deploy**: Coolify on VPS (109.199.108.202)

## Coolify Deployment

### 1. Add databases (one click each)
- New Resource → Database → **PostgreSQL** → Deploy → copy `DATABASE_URL`
- New Resource → Database → **Redis** → Deploy → copy `REDIS_URL`

### 2. Deploy backend (FastAPI)
- New Resource → Application → GitHub → `tilottamwagh/NL-Rent-Finder`
- Root dir: `/backend`
- Domain: `api.nlrentfinder.tilottamwagh.com`
- Dockerfile: auto-detected
- Add env vars (see below)

### 3. Deploy Celery worker
- Same repo, root `/backend`
- **No domain**
- Start command: `celery -A app.celery_tasks worker --beat --loglevel=info`
- Same env vars as backend

### 4. Deploy Telegram bot
- Same repo, root `/backend`
- **No domain**
- Start command: `python telegram_bot.py`
- Same env vars

### 5. Deploy frontend
- Same repo, root `/frontend`
- Domain: `nlrentfinder.tilottamwagh.com`
- Build arg: `VITE_API_URL=https://api.nlrentfinder.tilottamwagh.com`

## Environment Variables (set in Coolify)

```env
# Database (auto from Coolify)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# AI (required)
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-proj-...

# Telegram (optional)
TELEGRAM_BOT_TOKEN=...

# App
SECRET_KEY=generate-random-string-here
FRONTEND_URL=https://nlrentfinder.tilottamwagh.com
API_URL=https://api.nlrentfinder.tilottamwagh.com
SCRAPE_INTERVAL_HOURS=2
SERVICE_FEE_EUR=50
PAYPAL_LINK=paypal.me/yourname
```

## Switching AI provider
Change `AI_PROVIDER` and `AI_MODEL` in Coolify env vars, redeploy. Zero code changes needed.

| Provider   | AI_PROVIDER  | AI_MODEL                    |
|------------|--------------|------------------------------|
| OpenAI     | `openai`     | `gpt-4o-mini`               |
| Anthropic  | `anthropic`  | `claude-haiku-4-5-20251001` |
| Google     | `gemini`     | `gemini-1.5-flash`          |
| Groq       | `groq`       | `llama-3.1-8b-instant`      |
| Local      | `ollama`     | `llama3`                    |

## Updating the app
```bash
git add . && git commit -m "update" && git push
```
Coolify auto-redeploys on push.
