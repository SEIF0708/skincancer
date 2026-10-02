from __future__ import annotations

import datetime
from pathlib import Path
from typing import Generator

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "clinic.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    title = Column(String, default="Senior Dermatologist")
    hospital = Column(String, default="University Medical Center")
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sessions = relationship("ScanSession", back_populates="doctor")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String, nullable=False)
    fitzpatrick = Column(String, default="Type III")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sessions = relationship("ScanSession", back_populates="patient", cascade="all, delete-orphan")


class ScanSession(Base):
    __tablename__ = "scan_sessions"

    id = Column(String, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    timestamp = Column(String, nullable=False)
    anatomical_site = Column(String, default="Upper Back")
    prediction = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    image_src = Column(Text, nullable=False)
    heatmap_src = Column(Text, nullable=True)
    
    # ABCD features
    asymmetry = Column(Float, default=50.0)
    border = Column(Float, default=50.0)
    color = Column(Float, default=50.0)
    diameter = Column(Float, default=50.0)
    diameter_mm = Column(Float, default=5.0)
    
    # Model execution metadata
    architecture = Column(String, default="ResNet50-Attention-v1")
    inference_time = Column(String, default="120ms")
    focal_loss = Column(String, default="0.043")
    auc_roc = Column(String, default="0.962")
    clinical_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="sessions")
    doctor = relationship("Doctor", back_populates="sessions")


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed default Doctor if none exists
        if not db.query(Doctor).first():
            from .auth import get_password_hash
            default_doctor = Doctor(
                email="doctor@clinic.org",
                name="Dr. Sarah Jenkins, MD",
                title="Senior Dermatologist",
                hospital="University Medical Center",
                hashed_password=get_password_hash("admin123"),
            )
            db.add(default_doctor)
            db.commit()
            db.refresh(default_doctor)

        # Seed initial sample patients if none exist
        if not db.query(Patient).first():
            p1 = Patient(patient_code="PAT-101", name="E. Vance", age=48, sex="Female", fitzpatrick="Type III")
            p2 = Patient(patient_code="PAT-102", name="M. Torres", age=34, sex="Male", fitzpatrick="Type II")
            p3 = Patient(patient_code="PAT-103", name="K. Lindqvist", age=52, sex="Male", fitzpatrick="Type I")
            p4 = Patient(patient_code="PAT-104", name="R. Sharma", age=61, sex="Female", fitzpatrick="Type IV")
            db.add_all([p1, p2, p3, p4])
            db.commit()
            db.refresh(p1)
            db.refresh(p2)
            db.refresh(p3)
            db.refresh(p4)

            # Seed initial sample scan sessions
            s1 = ScanSession(
                id="#88392-A",
                patient_id=p1.id,
                timestamp="Today, 14:20",
                anatomical_site="Upper Back (Dorsal)",
                prediction="High Risk: Melanoma",
                confidence=88.4,
                risk_level="high",
                image_src="/scans/scan_58c30abcff.jpg",
                asymmetry=78.0,
                border=84.0,
                color=92.0,
                diameter=68.0,
                diameter_mm=6.8,
            )
            s2 = ScanSession(
                id="#88391-B",
                patient_id=p2.id,
                timestamp="Today, 11:15",
                anatomical_site="Left Shoulder",
                prediction="Low Risk: Benign Nevus",
                confidence=12.1,
                risk_level="low",
                image_src="/scans/scan_5ecd986768.jpg",
                asymmetry=22.0,
                border=18.0,
                color=15.0,
                diameter=32.0,
                diameter_mm=3.2,
            )
            s3 = ScanSession(
                id="#88389-C",
                patient_id=p3.id,
                timestamp="Yesterday, 16:40",
                anatomical_site="Right Forearm",
                prediction="Moderate Risk: Dysplastic Nevus",
                confidence=64.5,
                risk_level="moderate",
                image_src="/scans/scan_634843d6a6.jpg",
                asymmetry=55.0,
                border=60.0,
                color=58.0,
                diameter=58.0,
                diameter_mm=5.8,
            )
            s4 = ScanSession(
                id="#88385-D",
                patient_id=p4.id,
                timestamp="Sep 27, 09:30",
                anatomical_site="Lower Lumbar",
                prediction="High Risk: Melanoma",
                confidence=91.2,
                risk_level="high",
                image_src="/scans/scan_b8f3ff3f85.jpg",
                asymmetry=82.0,
                border=88.0,
                color=86.0,
                diameter=74.0,
                diameter_mm=7.4,
            )
            db.add_all([s1, s2, s3, s4])
            db.commit()
    finally:
        db.close()
