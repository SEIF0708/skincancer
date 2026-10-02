from __future__ import annotations

import datetime
from typing import Any, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import bcrypt
from sqlalchemy.orm import Session

SECRET_KEY = "skin_cancer_xai_clinical_dashboard_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(data: dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def get_current_doctor(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(__import__("backend.database", fromlist=["get_db"]).get_db),
):
    from .database import Doctor

    if not token:
        # Fallback for unauthenticated access: return default doctor
        doctor = db.query(Doctor).first()
        return doctor

    payload = decode_access_token(token)
    if payload is None:
        doctor = db.query(Doctor).first()
        return doctor

    email: str = payload.get("sub")
    if email is None:
        doctor = db.query(Doctor).first()
        return doctor

    doctor = db.query(Doctor).filter(Doctor.email == email).first()
    if doctor is None:
        doctor = db.query(Doctor).first()
    return doctor
