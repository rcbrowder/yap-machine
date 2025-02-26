from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.journal import router as journal_router
from .api.vector import router as vector_router
from .api.chat import router as chat_router
from .db.database import engine
from .db.models import Base
from .db.vectordb import vector_db

app = FastAPI(title="AI Journal API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def init_db():
    # Initialize SQL database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Ensure vector database is initialized
    # The vectordb singleton is already initialized when imported
    # This just makes sure it's ready before we accept requests
    _ = vector_db.client

app.include_router(journal_router)
app.include_router(vector_router)
app.include_router(chat_router)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-journal-api"} 