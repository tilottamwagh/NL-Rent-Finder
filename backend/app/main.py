from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routes.api import router

app = FastAPI(title="NL Rent Finder API", version="1.0.0", description="Netherlands Rental Matching Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()

app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {"status": "ok", "service": "NL Rent Finder API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
