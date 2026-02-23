"""Integration tests for authentication endpoints."""
import pytest


class TestAuthRoutes:
    """Tests for authentication API endpoints."""
    
    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "status" in data
    
    def test_register_valid_user(self, client, test_user_data):
        """Test user registration with valid data."""
        response = client.post(
            "/api/auth/register",
            json=test_user_data
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["full_name"] == test_user_data["full_name"]
        assert "id" in data
        assert "hashed_password" not in data  # Password should not be in response
    
    def test_register_duplicate_email(self, client, test_user_data):
        """Test user registration with duplicate email."""
        # Register first user
        client.post("/api/auth/register", json=test_user_data)
        
        # Try to register with same email
        response = client.post("/api/auth/register", json=test_user_data)
        assert response.status_code in [400, 409]  # Either Bad Request or Conflict
        assert "already" in response.json().get("detail", "").lower()
    
    def test_register_invalid_email(self, client):
        """Test user registration with invalid email."""
        invalid_data = {
            "email": "notanemail",
            "password": "ValidPassword123",
            "full_name": "Test User"
        }
        response = client.post("/api/auth/register", json=invalid_data)
        assert response.status_code == 422  # Validation error
    
    def test_register_weak_password(self, client):
        """Test user registration with weak password."""
        weak_data = {
            "email": "test@example.com",
            "password": "weak",  # Less than 8 characters
            "full_name": "Test User"
        }
        response = client.post("/api/auth/register", json=weak_data)
        assert response.status_code == 422  # Validation error
    
    def test_register_missing_field(self, client):
        """Test user registration with missing field."""
        incomplete_data = {
            "email": "test@example.com",
            "password": "ValidPassword123"
            # Missing full_name
        }
        response = client.post("/api/auth/register", json=incomplete_data)
        # Should either succeed (full_name optional) or return 422
        assert response.status_code in [201, 422]
    
    def test_login_valid_credentials(self, client, test_user_data):
        """Test login with valid credentials."""
        # Register user
        client.post("/api/auth/register", json=test_user_data)
        
        # Login
        response = client.post(
            "/api/auth/token",
            data={
                "username": test_user_data["email"],
                "password": test_user_data["password"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_password(self, client, test_user_data):
        """Test login with wrong password."""
        # Register user
        client.post("/api/auth/register", json=test_user_data)
        
        # Try login with wrong password
        response = client.post(
            "/api/auth/token",
            data={
                "username": test_user_data["email"],
                "password": "WrongPassword123"
            }
        )
        assert response.status_code == 401
        assert "incorrect" in response.json().get("detail", "").lower()
    
    def test_login_nonexistent_user(self, client):
        """Test login with nonexistent user."""
        response = client.post(
            "/api/auth/token",
            data={
                "username": "nonexistent@example.com",
                "password": "SomePassword123"
            }
        )
        assert response.status_code == 401
    
    def test_get_current_user_valid_token(self, client, test_user_data, test_token):
        """Test getting current user with valid token."""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert "id" in data
        assert "hashed_password" not in data
    
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token."""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        assert response.status_code == 401
    
    def test_get_current_user_no_token(self, client):
        """Test getting current user without token."""
        response = client.get("/api/auth/me")
        assert response.status_code in [401, 403]  # Unauthorized or Forbidden
    
    def test_get_current_user_expired_token(self, client, test_user_data):
        """Test getting current user with expired token."""
        from services.auth_service import AuthService
        from datetime import timedelta
        
        auth_service = AuthService()
        # Create expired token (already expired)
        expired_token = auth_service.create_access_token(
            {"sub": "1"},
            expires_delta=timedelta(seconds=-1)  # Negative = already expired
        )
        
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401


class TestAuthFlow:
    """Tests for complete authentication flow."""
    
    def test_register_login_get_user_flow(self, client, test_user_data):
        """Test complete flow: register → login → get user."""
        # 1. Register
        register_response = client.post(
            "/api/auth/register",
            json=test_user_data
        )
        assert register_response.status_code == 201
        user_id = register_response.json()["id"]
        
        # 2. Login
        login_response = client.post(
            "/api/auth/token",
            data={
                "username": test_user_data["email"],
                "password": test_user_data["password"]
            }
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # 3. Get current user
        user_response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert user_response.status_code == 200
        user_data = user_response.json()
        assert user_data["id"] == user_id
        assert user_data["email"] == test_user_data["email"]
