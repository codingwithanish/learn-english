from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api import auth, text, speak, tutor, history, llm
from app.ws.speak_ws import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title="Learn English API",
    description="API for Learn English Application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_hosts_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(text.router, prefix="/api", tags=["text"])
app.include_router(speak.router, prefix="/api", tags=["speak"])
app.include_router(tutor.router, prefix="/api/tutor", tags=["tutor"])
app.include_router(history.router, prefix="/api", tags=["history"])
app.include_router(llm.router, prefix="/api/llm", tags=["llm"])
app.include_router(ws_router)


@app.get("/healthz")
async def health_check():
    return JSONResponse({"status": "healthy"})


@app.get("/metrics")
async def metrics():
    return JSONResponse({"metrics": "placeholder"})