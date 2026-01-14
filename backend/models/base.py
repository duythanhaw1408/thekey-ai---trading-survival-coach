import os
from dotenv import load_dotenv

# Load env before accessing DATABASE_URL
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to local for development only if no env provided
    DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/thekey"
elif DATABASE_URL.startswith("postgres://"):
    # Render and some other providers use 'postgres://' which SQLAlchemy 2.0 doesn't support.
    # We also ensure it uses the 'psycopg' (v3) driver explicitly.
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif "postgresql://" in DATABASE_URL and "+psycopg" not in DATABASE_URL:
    # Force use of psycopg v3 driver if not specified
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

import psycopg
from psycopg.rows import dict_row
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone

from sqlalchemy.types import TypeDecorator, String as SQLString
from utils.encryption import encrypt_data, decrypt_data

class EncryptedString(TypeDecorator):
    """Custom type for storing encrypted strings in DB."""
    impl = SQLString
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return encrypt_data(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return decrypt_data(value)
        return value

# SQLAlchemy engine configuration with prepared statements disabled for pooler compatibility
engine = create_engine(DATABASE_URL, connect_args={"prepare_threshold": None})
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
    
    # Disable prepared statements on raw connection too
    conn = psycopg.connect(url, prepare_threshold=None)
    return conn
