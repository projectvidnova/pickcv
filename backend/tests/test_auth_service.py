"""Unit tests for authentication service."""
import pytest
from services.auth_service import AuthService


class TestAuthService:
    """Tests for AuthService."""
    
    @pytest.fixture
    def auth_service(self):
        """Create auth service instance."""
        return AuthService()
    
    def test_password_hash_create(self, auth_service):
        """Test password hashing creates hash."""
        password = "TestPassword123"
        hashed = auth_service.get_password_hash(password)
        
        assert hashed is not None
        assert hashed != password
        assert len(hashed) > len(password)
    
    def test_password_hash_different_each_time(self, auth_service):
        """Test password hashing creates different hashes each time."""
        password = "TestPassword123"
        hash1 = auth_service.get_password_hash(password)
        hash2 = auth_service.get_password_hash(password)
        
        # Hashes should be different (bcrypt uses random salt)
        assert hash1 != hash2
    
    def test_password_verify_correct(self, auth_service):
        """Test password verification with correct password."""
        password = "TestPassword123"
        hashed = auth_service.get_password_hash(password)
        
        assert auth_service.verify_password(password, hashed) is True
    
    def test_password_verify_incorrect(self, auth_service):
        """Test password verification with incorrect password."""
        password = "TestPassword123"
        wrong_password = "WrongPassword123"
        hashed = auth_service.get_password_hash(password)
        
        assert auth_service.verify_password(wrong_password, hashed) is False
    
    def test_create_access_token(self, auth_service):
        """Test JWT token creation."""
        data = {"sub": "1"}
        token = auth_service.create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert "." in token  # JWT format: header.payload.signature
    
    def test_decode_valid_token(self, auth_service):
        """Test JWT token decoding with valid token."""
        data = {"sub": "1"}
        token = auth_service.create_access_token(data)
        
        decoded = auth_service.decode_access_token(token)
        assert decoded is not None
        assert decoded["sub"] == "1"
    
    def test_decode_invalid_token(self, auth_service):
        """Test JWT token decoding with invalid token."""
        invalid_token = "invalid.token.here"
        
        decoded = auth_service.decode_access_token(invalid_token)
        assert decoded is None
    
    def test_decode_tampered_token(self, auth_service):
        """Test JWT token decoding with tampered token."""
        data = {"sub": "1"}
        token = auth_service.create_access_token(data)
        
        # Tamper with token
        tampered_token = token[:-10] + "0123456789"
        
        decoded = auth_service.decode_access_token(tampered_token)
        assert decoded is None
