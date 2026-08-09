import os
from fastapi import FastAPI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from routers.analytics import router as analytics_router

app = FastAPI(
    title="Academic Survival Simulator - Internal Backend",
    description="Internal Python service for GPA calculations and performance trajectory machine learning.",
    version="1.0.0",
    # Disable docs in production for internal security
    docs_url="/docs" if os.getenv("ENV") == "development" else None,
    redoc_url=None,
)

# Include internal routers
app.include_router(analytics_router)

@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "service": "academic-survival-simulator-backend"}

if __name__ == "__main__":
    import uvicorn
    # IMPORTANT: Bound strictly to 127.0.0.1 (localhost) to ensure the FastAPI server is NEVER exposed publicly.
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
