# tests/test_health.py
"""
THEKEY AI - Health Check Tests
Tests for API health and status endpoints
"""

import pytest


class TestHealthEndpoints:
    """Tests for health and status endpoints"""
    
    def test_root_endpoint(self, client):
        """Test root endpoint returns API info"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "THEKEY AI"
        assert "version" in data
        assert data["status"] == "operational"
    
    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "timestamp" in data
        assert "components" in data
    
    def test_ready_endpoint(self, client):
        """Test readiness probe endpoint"""
        response = client.get("/ready")
        
        assert response.status_code == 200
        assert response.json()["ready"] == True


class TestSecurityHeaders:
    """Tests for security headers"""
    
    def test_request_id_header(self, client):
        """Test that X-Request-ID is returned"""
        response = client.get("/")
        
        # Request ID should be in response headers
        assert "x-request-id" in response.headers
        assert len(response.headers["x-request-id"]) > 0
