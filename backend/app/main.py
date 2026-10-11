from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database
from app.routes import (
    auth_routes,
    chat_routes,
    ticket_routes,
    knowledge_routes,
    calendar_routes,
    admin_routes,
    eval_routes,
    contact_routes
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema exists & seed initial college dataset
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Full-stack AI Campus Helpdesk & Student Services Agent featuring Multi-Agent ReAct loop, RAG knowledge retrieval, and persistent ticket lifecycle management.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local dev and deployment environments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_routes.router)
app.include_router(chat_routes.router)
app.include_router(ticket_routes.router)
app.include_router(knowledge_routes.router)
app.include_router(calendar_routes.router)
app.include_router(admin_routes.router)
app.include_router(eval_routes.router)
app.include_router(contact_routes.router)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "demo_mode": settings.DEMO_MODE,
        "documentation": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "demo_mode": settings.DEMO_MODE,
        "environment": settings.ENVIRONMENT,
        "agents": [
            "Router / Triage Agent",
            "Knowledge Agent",
            "Student Support Agent",
            "Reviewer Agent"
        ],
        "tools": [
            "college_knowledge_search",
            "create_support_ticket",
            "get_ticket_with_auth",
            "academic_calendar_lookup"
        ]
    }
