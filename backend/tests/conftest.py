"""Pytest configuration and fixtures for async tests."""
import pytest
import os
import sys
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Set test environment BEFORE importing app
os.environ["ENVIRONMENT"] = "testing"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["GEMINI_API_KEY"] = "test-key"
os.environ["SECRET_KEY"] = "test-secret"

# Import after env setup
from database import Base, get_db
from main import app
from models import User


# Test database setup with async SQLite
SQLALCHEMY_TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingAsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


def _init_db():
    """Initialize test database synchronously."""
    asyncio.run(_init_db_async())


async def _init_db_async():
    """Initialize test database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def _drop_db():
    """Drop all tables synchronously."""
    asyncio.run(_drop_db_async())


async def _drop_db_async():
    """Drop all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
def client():
    """Create test client with async test database."""
    # Create tables
    _init_db()
    
    # Override dependency
    async def override_get_db():
        async with TestingAsyncSessionLocal() as session:
            yield session
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    
    # Drop tables
    _drop_db()


@pytest.fixture
def test_user_data():
    """Sample user data for testing."""
    return {
        "email": "testuser@example.com",
        "password": "TestPassword123",
        "full_name": "Test User"
    }


@pytest.fixture
def test_user(client, test_user_data):
    """Create test user in database."""
    response = client.post(
        "/api/auth/register",
        json=test_user_data
    )
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def test_token(client, test_user_data):
    """Get JWT token for test user."""
    # Register user
    client.post(
        "/api/auth/register",
        json=test_user_data
    )
    # Login
    response = client.post(
        "/api/auth/token",
        data={
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        }
    )
    assert response.status_code == 200
    return response.json()["access_token"]
