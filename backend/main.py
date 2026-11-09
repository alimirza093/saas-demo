from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import Base, engine, ensure_database_migrations
from .routers import admin, auth, customer, public
from .seed import seed_demo_data

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SaaS Demo SaaS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(public.router)
app.include_router(customer.router)
app.include_router(admin.router)


@app.on_event("startup")
def startup_event():
    ensure_database_migrations()
    with engine.begin() as conn:
        conn.execute(text("SELECT 1"))
    from .database import SessionLocal

    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Restaurant SaaS demo backend"}
