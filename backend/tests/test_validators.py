# tests/test_validators.py
"""
Tests for password and input validators
"""

import pytest
from utils.validators import validate_password, validate_email, validate_symbol


class TestPasswordValidator:
    """Tests for password validation"""
    
    def test_valid_strong_password(self):
        """Test that a strong password passes validation"""
        result = validate_password("StrongPass123!")
        assert result.is_valid == True
        assert result.strength == 'strong'
        assert result.score >= 80
        assert len(result.errors) == 0
    
    def test_valid_medium_password(self):
        """Test that a medium password meets minimum requirements"""
        result = validate_password("MyTest123")  # Valid medium password without common patterns
        assert result.is_valid == True
        assert result.strength in ['medium', 'strong']
    
    def test_too_short_password(self):
        """Test that short passwords are rejected"""
        result = validate_password("Short1")
        assert result.is_valid == False
        assert "ít nhất 8 ký tự" in result.errors[0].lower()
    
    def test_missing_uppercase(self):
        """Test that passwords without uppercase are rejected"""
        result = validate_password("lowercase123")
        assert result.is_valid == False
        assert any("chữ hoa" in err.lower() for err in result.errors)
    
    def test_missing_lowercase(self):
        """Test that passwords without lowercase are rejected"""
        result = validate_password("UPPERCASE123")
        assert result.is_valid == False
        assert any("chữ thường" in err.lower() for err in result.errors)
    
    def test_missing_number(self):
        """Test that passwords without numbers are rejected"""
        result = validate_password("PasswordOnly")
        assert result.is_valid == False
        assert any("số" in err.lower() for err in result.errors)
    
    def test_common_password_pattern(self):
        """Test that common password patterns reduce score"""
        result = validate_password("Password123")  # Contains 'password'
        assert result.strength in ['weak', 'medium']
    
    def test_empty_password(self):
        """Test that empty password fails"""
        result = validate_password("")
        assert result.is_valid == False


class TestEmailValidator:
    """Tests for email validation"""
    
    def test_valid_email(self):
        """Test valid email format"""
        is_valid, error = validate_email("user@example.com")
        assert is_valid == True
        assert error == ""
    
    def test_empty_email(self):
        """Test empty email rejection"""
        is_valid, error = validate_email("")
        assert is_valid == False
        assert "không được để trống" in error.lower()
    
    def test_invalid_format(self):
        """Test invalid email format rejection"""
        is_valid, error = validate_email("not-an-email")
        assert is_valid == False
        assert "định dạng" in error.lower()
    
    def test_too_long_email(self):
        """Test email length limit"""
        long_email = "a" * 300 + "@example.com"
        is_valid, error = validate_email(long_email)
        assert is_valid == False
        assert "quá dài" in error.lower()


class TestSymbolValidator:
    """Tests for trading symbol validation"""
    
    def test_valid_symbol(self):
        """Test valid trading symbols"""
        symbols = ["BTCUSD", "ETH/USD", "BTC-PERP", "AAPL"]
        for symbol in symbols:
            is_valid, error = validate_symbol(symbol)
            assert is_valid == True, f"Symbol {symbol} should be valid"
    
    def test_empty_symbol(self):
        """Test empty symbol rejection"""
        is_valid, error = validate_symbol("")
        assert is_valid == False
    
    def test_invalid_characters(self):
        """Test symbols with invalid characters"""
        is_valid, error = validate_symbol("BTC@USD")
        assert is_valid == False
