from fastapi import FastAPI
from .api.journal import router as journal_router
from .db.database import engine
from .db.models import Base

app = FastAPI(title="AI Journal API")

@app.on_event("startup")
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(journal_router)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-journal-api"} 