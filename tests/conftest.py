# tests/conftest.py
"""
THEKEY AI - Test Configuration
Shared fixtures and configuration for all tests
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app
from models.base import Base, get_db

# ============================================
# Test Database Configuration
# ============================================

# Use in-memory SQLite for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ============================================
# Fixtures
# ============================================

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with overridden database"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()

@pytest.fixture
def test_user_data():
    """Sample user data for testing"""
    return {
        "email": "test@thekey.ai",
        "password": "SecurePassword123!"
    }

@pytest.fixture
def test_trade_data():
    """Sample trade data for testing"""
    from datetime import datetime
    return {
        "symbol": "BTCUSDT",
        "side": "BUY",
        "entry_price": 45000.0,
        "quantity": 0.1,
        "entry_time": datetime.utcnow().isoformat()
    }
