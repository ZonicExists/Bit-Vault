import math
import hashlib
import secrets
import string
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
import httpx
import pyotp

from app.middleware.auth_middleware import require_unlocked_vault
from app.models.responses import success_response

router = APIRouter(prefix="/api/utils", tags=["Utilities & Security Generators"])

class PasswordGenRequest(BaseModel):
    length: int = Field(default=16, ge=4, le=128)
    include_uppercase: bool = True
    include_lowercase: bool = True
    include_digits: bool = True
    include_symbols: bool = True
    avoid_ambiguous: bool = False

class PwnedCheckRequest(BaseModel):
    password: str

class TOTPVerifyRequest(BaseModel):
    secret: str
    code: str

@router.post("/generate-password")
def generate_password(
    req: PasswordGenRequest,
    master_key: bytes = Depends(require_unlocked_vault)
):
    chars = ""
    uppercase_chars = string.ascii_uppercase
    lowercase_chars = string.ascii_lowercase
    digit_chars = string.digits
    symbol_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"

    if req.avoid_ambiguous:
        ambiguous = "l1IO0"
        uppercase_chars = "".join(c for c in uppercase_chars if c not in ambiguous)
        lowercase_chars = "".join(c for c in lowercase_chars if c not in ambiguous)
        digit_chars = "".join(c for c in digit_chars if c not in ambiguous)

    guaranteed = []
    if req.include_uppercase:
        chars += uppercase_chars
        guaranteed.append(secrets.choice(uppercase_chars))
    if req.include_lowercase:
        chars += lowercase_chars
        guaranteed.append(secrets.choice(lowercase_chars))
    if req.include_digits:
        chars += digit_chars
        guaranteed.append(secrets.choice(digit_chars))
    if req.include_symbols:
        chars += symbol_chars
        guaranteed.append(secrets.choice(symbol_chars))

    if not chars:
        chars = string.ascii_letters + string.digits

    remaining_len = req.length - len(guaranteed)
    if remaining_len < 0:
        guaranteed = guaranteed[:req.length]
        remaining_len = 0

    password_chars = guaranteed + [secrets.choice(chars) for _ in range(remaining_len)]
    secrets.SystemRandom().shuffle(password_chars)
    password = "".join(password_chars)

    # Compute entropy
    pool_size = len(set(chars))
    entropy_bits = round(req.length * math.log2(pool_size), 2) if pool_size > 0 else 0

    if entropy_bits < 40:
        strength_label = "Very Weak"
    elif entropy_bits < 60:
        strength_label = "Weak"
    elif entropy_bits < 80:
        strength_label = "Good"
    elif entropy_bits < 100:
        strength_label = "Strong"
    else:
        strength_label = "Very Strong"

    return success_response({
        "password": password,
        "length": req.length,
        "entropy_bits": entropy_bits,
        "strength_label": strength_label
    })

@router.post("/check-pwned")
def check_pwned_password(
    req: PwnedCheckRequest,
    master_key: bytes = Depends(require_unlocked_vault)
):
    if not req.password:
        return success_response({"is_compromised": False, "breach_count": 0})

    sha1_hash = hashlib.sha1(req.password.encode('utf-8')).hexdigest().upper()
    prefix = sha1_hash[:5]
    suffix = sha1_hash[5:]

    url = f"https://api.pwnedpasswords.com/range/{prefix}"
    
    try:
        with httpx.Client(timeout=5.0) as client:
            res = client.get(url)
            if res.status_code != 200:
                return success_response({"is_compromised": False, "breach_count": 0, "status": "api_unavailable"})

            hashes = res.text.splitlines()
            for line in hashes:
                if ":" in line:
                    h_suffix, count_str = line.split(":", 1)
                    if h_suffix.strip() == suffix:
                        count = int(count_str.strip())
                        return success_response({
                            "is_compromised": True,
                            "breach_count": count,
                            "prefix": prefix
                        })
    except Exception:
        return success_response({"is_compromised": False, "breach_count": 0, "status": "network_error"})

    return success_response({
        "is_compromised": False,
        "breach_count": 0,
        "prefix": prefix
    })

@router.post("/totp/generate-secret")
def generate_totp_secret(
    account_name: str = "Vault User",
    master_key: bytes = Depends(require_unlocked_vault)
):
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(name=account_name, issuer_name="Bit Vault")

    return success_response({
        "secret": secret,
        "otpauth_url": otpauth_url
    })

@router.post("/totp/verify")
def verify_totp_code(
    req: TOTPVerifyRequest,
    master_key: bytes = Depends(require_unlocked_vault)
):
    try:
        totp = pyotp.TOTP(req.secret)
        is_valid = totp.verify(req.code)
    except Exception:
        is_valid = False

    return success_response({
        "is_valid": is_valid
    })
