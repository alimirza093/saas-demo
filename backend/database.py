from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_database_migrations() -> None:
    with engine.begin() as conn:
        columns = conn.execute(text("PRAGMA table_info(download_history)")).fetchall()
        has_operating_system = any(column[1] == "operating_system" for column in columns)
        if not has_operating_system:
            conn.execute(text("ALTER TABLE download_history ADD COLUMN operating_system VARCHAR(30) DEFAULT 'windows' NOT NULL"))


Base.metadata.create_all(bind=engine)
ensure_database_migrations()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
