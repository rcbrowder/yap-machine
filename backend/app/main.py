from fastapi import FastAPI
from .api.journal import router as journal_router

app = FastAPI(title="AI Journal API")

app.include_router(journal_router)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-journal-api"} 