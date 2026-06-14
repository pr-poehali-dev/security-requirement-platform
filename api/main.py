from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.routers import (
    requirements, architectures, templates,
    org_domains, tech_domains, technologies,
    users, dashboard,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создаём таблицы при старте (для SQLite / первого запуска)
    Base.metadata.create_all(bind=engine)
    # Засеваем начальные данные
    db = SessionLocal()
    try:
        from app.seed import seed
        seed(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роутеры
for router in [
    requirements.router,
    architectures.router,
    templates.router,
    org_domains.router,
    tech_domains.router,
    technologies.router,
    users.router,
    dashboard.router,
]:
    app.include_router(router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "db": settings.DATABASE_URL.split("://")[0]}
