import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("UPDATE trades SET exit_time = entry_time + interval '1 minute' WHERE exit_time <= entry_time"))
    conn.commit()
    print(f"Successfully repaired {result.rowcount} inconsistent trades.")
