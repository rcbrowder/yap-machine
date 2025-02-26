from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .api.journal import router as journal_router
from .api.vector import router as vector_router
from .api.chat import router as chat_router
from .db.database import engine, AsyncSession, get_db
from .db.models import Base
from .db.vectordb import vector_db
import sqlalchemy as sa
import logging

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
    logging.info("Database initialization completed")

app.include_router(journal_router)
app.include_router(vector_router)
app.include_router(chat_router)

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Enhanced health check that verifies database connection"""
    # Verify SQL database connection
    try:
        # Execute a simple query to verify the database is responding
        await db.execute(sa.text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        logging.error(f"Database health check failed: {str(e)}")
        db_status = f"error: {str(e)}"
    
    # Verify vector database
    try:
        count = vector_db.get_count()
        vector_status = f"connected (entries: {count})"
    except Exception as e:
        logging.error(f"Vector DB health check failed: {str(e)}")
        vector_status = f"error: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "ai-journal-api",
        "databases": {
            "sql": db_status,
            "vector": vector_status
        }
    } 