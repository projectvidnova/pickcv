"""Pytest configuration and fixtures."""
import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set test environment and required variables
os.environ["ENVIRONMENT"] = "testing"
os.environ["GEMINI_API_KEY"] = "test-key-for-testing"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing"

# Import after env setup
from database import Base, get_db
from main import app
from fastapi.testclient import TestClient


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create database tables for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create test client with test database."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Sample user data for testing."""
    return {
        "email": "testuser@example.com",
        "password": "TestPassword123",
        "full_name": "Test User"
    }


@pytest.fixture
def test_resume_data():
    """Sample resume data for testing."""
    return {
        "title": "My Resume",
        "raw_text": "Software Engineer with 5 years experience in Python, React, and AWS."
    }
