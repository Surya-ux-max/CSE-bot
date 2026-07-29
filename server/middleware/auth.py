"""
middleware/auth.py
Enterprise HS256 JWT Authentication & Role Verification Middleware.
No external dependencies required (uses built-in hashlib, hmac, base64, json).
"""

import base64
import hmac
import hashlib
import json
import time
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status

SECRET_KEY = "sece_cse_bot_enterprise_jwt_secret_key_2026"
ALGORITHM = "HS256"
TOKEN_EXPIRE_SECONDS = 86400 * 7  # 7 days expiration


def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')


def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)


def create_jwt_token(email: str, role: str) -> str:
    """Generates a signed HS256 JWT token for an authenticated user."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": email.strip().lower(),
        "role": role.strip().lower(),
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_EXPIRE_SECONDS
    }

    header_b64 = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = base64url_encode(json.dumps(payload).encode('utf-8'))

    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    sig_b64 = base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def verify_jwt_token(token: str) -> Dict[str, Any]:
    """Verifies and decodes a signed HS256 JWT token."""
    try:
        clean_token = token.strip().replace("Bearer ", "")
        parts = clean_token.split('.')
        if len(parts) != 3:
            raise ValueError("Invalid JWT token format")

        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = base64url_encode(hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest())

        if not hmac.compare_digest(sig_b64, expected_sig):
            raise ValueError("Invalid JWT signature")

        payload_bytes = base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))

        if payload.get("exp") and time.time() > payload["exp"]:
            raise ValueError("JWT token expired")

        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication Error: {str(e)}"
        )


def get_current_user_from_token(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    FastAPI dependency that extracts and validates JWT token from Authorization header.
    Falls back gracefully if no header is provided (for backward compatibility).
    """
    if not authorization:
        return {"sub": "anonymous@sece.ac.in", "role": "student"}
    return verify_jwt_token(authorization)
