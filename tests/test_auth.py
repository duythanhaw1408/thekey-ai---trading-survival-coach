# tests/test_auth.py
"""
THEKEY AI - Authentication Tests
Tests for signup, login, and token management
"""

import pytest


class TestSignup:
    """Tests for user registration"""
    
    def test_signup_success(self, client, test_user_data):
        """Test successful user registration"""
        response = client.post("/auth/signup", json=test_user_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == test_user_data["email"]
        assert data["user"]["email_verified"] == False
    
    def test_signup_duplicate_email(self, client, test_user_data):
        """Test registration with existing email fails"""
        # First signup
        client.post("/auth/signup", json=test_user_data)
        
        # Second signup with same email
        response = client.post("/auth/signup", json=test_user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_signup_invalid_email(self, client):
        """Test registration with invalid email fails"""
        response = client.post("/auth/signup", json={
            "email": "not-an-email",
            "password": "SecurePassword123!"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_signup_weak_password(self, client):
        """Test that weak passwords are handled"""
        # Note: Password strength validation should be added
        response = client.post("/auth/signup", json={
            "email": "test@thekey.ai",
            "password": "123"  # Very weak
        })
        
        # Currently passes - TODO: Add password validation
        # In future, this should return 400


class TestLogin:
    """Tests for user login"""
    
    def test_login_success(self, client, test_user_data):
        """Test successful login"""
        # First create user
        client.post("/auth/signup", json=test_user_data)
        
        # Then login
        response = client.post("/auth/login", json=test_user_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == test_user_data["email"]
    
    def test_login_wrong_password(self, client, test_user_data):
        """Test login with wrong password fails"""
        # Create user
        client.post("/auth/signup", json=test_user_data)
        
        # Login with wrong password
        response = client.post("/auth/login", json={
            "email": test_user_data["email"],
            "password": "WrongPassword123!"
        })
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user fails"""
        response = client.post("/auth/login", json={
            "email": "nonexistent@thekey.ai",
            "password": "SomePassword123!"
        })
        
        assert response.status_code == 401


class TestTokenValidation:
    """Tests for JWT token handling"""
    
    def test_access_protected_route_with_token(self, client, test_user_data):
        """Test accessing protected route with valid token"""
        # Signup and get token
        signup_response = client.post("/auth/signup", json=test_user_data)
        token = signup_response.json()["access_token"]
        
        # Access protected route
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["email"] == test_user_data["email"]
    
    def test_access_protected_route_without_token(self, client):
        """Test accessing protected route without token fails"""
        response = client.get("/auth/me")
        
        assert response.status_code == 401
    
    def test_access_protected_route_with_invalid_token(self, client):
        """Test accessing protected route with invalid token fails"""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        
        assert response.status_code == 401
