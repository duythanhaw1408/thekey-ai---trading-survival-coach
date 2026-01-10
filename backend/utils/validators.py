# backend/utils/validators.py
"""
Input Validation Utilities for THEKEY AI
"""

import re
from typing import Tuple, List
from dataclasses import dataclass


@dataclass
class PasswordValidationResult:
    """Password validation result with strength indicator"""
    is_valid: bool
    strength: str  # 'weak', 'medium', 'strong'
    score: int  # 0-100
    errors: List[str]
    suggestions: List[str]


def validate_password(password: str) -> PasswordValidationResult:
    """
    Validate password strength.
    
    Requirements:
    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 number
    - (Optional) Special character for strong rating
    
    Returns:
        PasswordValidationResult with validation details
    """
    errors: List[str] = []
    suggestions: List[str] = []
    score = 0
    
    # Length check
    if len(password) < 8:
        errors.append("Mật khẩu phải có ít nhất 8 ký tự")
    else:
        score += 25
        if len(password) >= 12:
            score += 10
        if len(password) >= 16:
            score += 5
    
    # Uppercase check
    if not re.search(r'[A-Z]', password):
        errors.append("Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)")
    else:
        score += 20
    
    # Lowercase check
    if not re.search(r'[a-z]', password):
        errors.append("Mật khẩu phải có ít nhất 1 chữ thường (a-z)")
    else:
        score += 20
    
    # Number check
    if not re.search(r'\d', password):
        errors.append("Mật khẩu phải có ít nhất 1 số (0-9)")
    else:
        score += 20
    
    # Special character check (optional but adds to score)
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 15
    else:
        suggestions.append("Thêm ký tự đặc biệt (!@#$%^&*) để tăng độ mạnh")
    
    # Common password patterns check
    common_patterns = ['password', '123456', 'qwerty', 'abc123', 'letmein', 'admin']
    if any(pattern in password.lower() for pattern in common_patterns):
        errors.append("Mật khẩu chứa chuỗi dễ đoán")
        score = max(0, score - 30)
    
    # Determine strength
    if score >= 80:
        strength = 'strong'
    elif score >= 50:
        strength = 'medium'
    else:
        strength = 'weak'
    
    # Add suggestions based on score
    if score < 50:
        suggestions.append("Sử dụng mật khẩu dài hơn với nhiều loại ký tự")
    
    is_valid = len(errors) == 0
    
    return PasswordValidationResult(
        is_valid=is_valid,
        strength=strength,
        score=min(100, score),
        errors=errors,
        suggestions=suggestions
    )


def validate_email(email: str) -> Tuple[bool, str]:
    """
    Validate email format.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not email:
        return False, "Email không được để trống"
    
    if len(email) > 254:
        return False, "Email quá dài (tối đa 254 ký tự)"
    
    if not re.match(email_pattern, email):
        return False, "Email không đúng định dạng"
    
    return True, ""


def validate_symbol(symbol: str) -> Tuple[bool, str]:
    """
    Validate trading symbol format.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not symbol:
        return False, "Symbol không được để trống"
    
    if len(symbol) > 20:
        return False, "Symbol quá dài (tối đa 20 ký tự)"
    
    # Allow alphanumeric, /, -, _, .
    if not re.match(r'^[A-Za-z0-9/\-_.]+$', symbol):
        return False, "Symbol chỉ được chứa chữ cái, số và ký tự / - _ ."
    
    return True, ""
