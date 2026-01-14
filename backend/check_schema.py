import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, inspect

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

for table in ['users', 'trades', 'checkins']:
    print(f"\n--- Table: {table} ---")
    columns = inspector.get_columns(table)
    for col in columns:
        print(f"Column: {col['name']}, Type: {col['type']}")
