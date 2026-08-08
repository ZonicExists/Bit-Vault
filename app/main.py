from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.db.database import init_db
from app.routers import auth, items, files, categories, utils, audit, backup, settings as settings_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Execute database tables setup on application startup
    init_db()
    yield

app = FastAPI(
    title="Bit Vault API",
    description="Secure, encrypted personal vault API built with FastAPI and SQLite",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware Setup — restrict to configured origins
_cors_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Exception Handler to wrap HTTP exceptions in ApiResponse format
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        error_payload = exc.detail
    else:
        error_payload = {
            "code": "HTTP_ERROR",
            "message": str(exc.detail)
        }
        
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": error_payload
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Never leak internal details in production
    if settings.NODE_ENV == "development":
        error_message = str(exc)
    else:
        error_message = "An unexpected internal error occurred."
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": error_message
            }
        }
    )

# Include Routers
app.include_router(auth.router)
app.include_router(items.router)
app.include_router(files.router)
app.include_router(categories.router)
app.include_router(utils.router)
app.include_router(audit.router)
app.include_router(backup.router)
app.include_router(settings_router.router)

import os
from fastapi.staticfiles import StaticFiles

# Mount static frontend build if present
frontend_build = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "build")
if os.path.exists(frontend_build):
    app.mount("/", StaticFiles(directory=frontend_build, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "success": True,
            "message": "Custom Vault API is running",
            "docs": "/docs"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
