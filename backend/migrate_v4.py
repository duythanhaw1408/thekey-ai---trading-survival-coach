import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Adding columns...")
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC'"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS shadow_score JSONB"))
    except Exception as e:
        # If IF NOT EXISTS is not supported by this PG version (unlikely in Supabase)
        print(f"Error (probably columns already exist): {e}")
    
    # Create idempotency_keys table
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS idempotency_keys (
            id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(id),
            request_key VARCHAR(255) NOT NULL,
            response_body TEXT,
            status_code VARCHAR(10),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE
        )
    """))
    conn.commit()
    print("Done.")
