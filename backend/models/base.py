import os
import psycopg
from psycopg.rows import dict_row
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/thekey")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_connection():
    """Get a raw psycopg connection for direct SQL execution."""
    # Clean up DATABASE_URL for psycopg (remove +psycopg if present)
    url = DATABASE_URL
    if "+psycopg" in url:
        url = url.replace("+psycopg", "")
    
    conn = psycopg.connect(url)
    return conn
