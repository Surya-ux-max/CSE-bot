import os
import sys
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

# Add parent directory to sys.path to allow imports from db.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_db_session, DSectionStudent, FacultyAccount, User
from middleware.auth import create_jwt_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ─── Pydantic Request Schemas ───────────────────────────────────────────────

class StudentLoginRequest(BaseModel):
    email: str
    password: str

class StudentRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    section: Optional[str] = "Section D"
    year: Optional[str] = "3rd Year"

class FacultyLoginRequest(BaseModel):
    email: str
    password: str

class FacultyRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    designation: Optional[str] = "Faculty Member"
    section: Optional[str] = "All Sections"
    year: Optional[str] = "All Years"

class PlacementCellLoginRequest(BaseModel):
    email: str
    password: str

class PlacementCellRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    designation: Optional[str] = "Placement Officer"
    section: Optional[str] = "All Sections"
    year: Optional[str] = "All Years"


# Helper to sync users to central users table
def sync_to_unified_user(db: Session, name: str, email: str, password: str, role: str, designation: str, section: str, year: str) -> User:
    email_clean = email.strip().lower()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        existing.name = name
        existing.password = password
        existing.role = role
        existing.designation = designation
        existing.section = section
        existing.year = year
        db.commit()
        db.refresh(existing)
        return existing
    
    new_user = User(
        name=name,
        email=email_clean,
        password=password,
        role=role,
        designation=designation,
        section=section,
        year=year
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# Seed standard users if users table is empty
def seed_unified_users_if_needed(db: Session):
    if db.query(User).count() == 0:
        print("[Auth Seed] Seeding default accounts into unified users table...")
        # 1. Student
        sync_to_unified_user(
            db, 
            name="Suryaprakash S", 
            email="suryaprakash.s.d@csebot.edu", 
            password="CSE@2026#1015", 
            role="student", 
            designation="Student", 
            section="Section D", 
            year="3rd Year"
        )
        # 2. Faculty
        sync_to_unified_user(
            db, 
            name="Dr. S. Yuvaraj", 
            email="s.yuvaraj@faculty.csebot.edu", 
            password="Faculty@2026#2012", 
            role="faculty", 
            designation="Assistant Professor", 
            section="All Sections", 
            year="All Years"
        )
        # 3. Placement Officer
        sync_to_unified_user(
            db, 
            name="CSE Placement Cell", 
            email="placements@csebot.edu", 
            password="Placement@2026#3015", 
            role="placement_cell", 
            designation="Placement Coordinator", 
            section="All Sections", 
            year="All Years"
        )


# ─── Student Authentication Endpoints ─────────────────────────────────────

@router.post("/student/login")
def login_student(payload: StudentLoginRequest):
    email_clean = payload.email.strip().lower()
    password_clean = payload.password.strip()

    with get_db_session() as db:
        seed_unified_users_if_needed(db)
        # Check against unified table to ensure strict role-based login blocks
        u_match = db.query(User).filter(User.email == email_clean).first()
        if u_match and u_match.role != "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role Access Denied: '{email_clean}' is registered as a {u_match.role.replace('_', ' ')} account. Please select the correct tab to log in."
            )

        student = db.query(DSectionStudent).filter(
            DSectionStudent.email.ilike(email_clean)
        ).first()

        if not student or student.password != password_clean:
            # Fallback check on User table
            if u_match and u_match.role == "student" and u_match.password == password_clean:
                # Sync student to DSectionStudent
                student = DSectionStudent(
                    name=u_match.name,
                    email=u_match.email,
                    password=u_match.password,
                    section=u_match.section,
                    year=u_match.year
                )
                db.add(student)
                db.commit()
                db.refresh(student)
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid student email or password. Please verify credentials."
                )

        return {
            "status": "success",
            "role": "student",
            "user": {
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "section": student.section,
                "year": student.year,
                "token": create_jwt_token(student.email, "student")
            },
            "message": f"Welcome back, {student.name}! Redirecting to Student Workspace..."
        }


@router.post("/student/register")
def register_student(payload: StudentRegisterRequest):
    email_clean = payload.email.strip().lower()

    with get_db_session() as db:
        seed_unified_users_if_needed(db)
        u_match = db.query(User).filter(User.email == email_clean).first()
        if u_match and u_match.role != "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role Access Denied: '{email_clean}' is already registered as a {u_match.role.replace('_', ' ')}."
            )

        existing = db.query(DSectionStudent).filter(
            DSectionStudent.email.ilike(email_clean)
        ).first()

        if existing:
            # Sync to User
            sync_to_unified_user(db, existing.name, existing.email, existing.password, "student", "Student", existing.section, existing.year)
            return {
                "status": "account_exists",
                "message": f"Account for '{existing.name}' is already registered in SECE DB! Please sign in.",
                "user": {
                    "id": existing.id,
                    "name": existing.name,
                    "email": existing.email,
                    "section": existing.section,
                    "year": existing.year
                }
            }

        # Register in DSectionStudent
        new_student = DSectionStudent(
            name=payload.name.strip(),
            email=email_clean,
            password=payload.password.strip(),
            section=payload.section or "Section D",
            year=payload.year or "3rd Year"
        )
        db.add(new_student)
        db.commit()
        db.refresh(new_student)

        # Sync to central User
        sync_to_unified_user(db, new_student.name, new_student.email, new_student.password, "student", "Student", new_student.section, new_student.year)

        # Seed local SQLite calendar
        try:
            from services.academic_calendar_parser import seed_user_academic_calendar
            seed_user_academic_calendar(email_clean)
        except Exception as seed_err:
            print(f"[Registration Calendar Seed Error] Student: {seed_err}")

        return {
            "status": "success",
            "role": "student",
            "user": {
                "id": new_student.id,
                "name": new_student.name,
                "email": new_student.email,
                "section": new_student.section,
                "year": new_student.year,
                "token": create_jwt_token(new_student.email, "student")
            },
            "message": "Student account registered successfully!"
        }


# ─── Faculty Authentication Endpoints ─────────────────────────────────────

@router.post("/faculty/login")
def login_faculty(payload: FacultyLoginRequest):
    email_clean = payload.email.strip().lower()
    password_clean = payload.password.strip()

    with get_db_session() as db:
        seed_unified_users_if_needed(db)
        u_match = db.query(User).filter(User.email == email_clean).first()
        if u_match and u_match.role != "faculty":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role Access Denied: '{email_clean}' is registered as a {u_match.role.replace('_', ' ')} account. Please select the correct tab to log in."
            )

        faculty = db.query(FacultyAccount).filter(
            FacultyAccount.email.ilike(email_clean)
        ).first()

        if not faculty or faculty.password != password_clean:
            if u_match and u_match.role == "faculty" and u_match.password == password_clean:
                faculty = FacultyAccount(
                    name=u_match.name,
                    email=u_match.email,
                    password=u_match.password,
                    designation=u_match.designation,
                    section=u_match.section,
                    year=u_match.year
                )
                db.add(faculty)
                db.commit()
                db.refresh(faculty)
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid faculty email or password. Please verify credentials."
                )

        return {
            "status": "success",
            "role": "faculty",
            "user": {
                "id": faculty.id,
                "name": faculty.name,
                "email": faculty.email,
                "designation": faculty.designation,
                "section": faculty.section,
                "year": faculty.year,
                "token": create_jwt_token(faculty.email, "faculty")
            },
            "message": f"Welcome back, {faculty.name}! Redirecting to Faculty Advisory Portal..."
        }


@router.post("/faculty/register")
def register_faculty(payload: FacultyRegisterRequest):
    email_clean = payload.email.strip().lower()

    with get_db_session() as db:
        seed_unified_users_if_needed(db)
        u_match = db.query(User).filter(User.email == email_clean).first()
        if u_match and u_match.role != "faculty":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role Access Denied: '{email_clean}' is already registered as a {u_match.role.replace('_', ' ')}."
            )

        existing = db.query(FacultyAccount).filter(
            FacultyAccount.email.ilike(email_clean)
        ).first()

        if existing:
            sync_to_unified_user(db, existing.name, existing.email, existing.password, "faculty", existing.designation, existing.section, existing.year)
            return {
                "status": "account_exists",
                "message": f"Faculty account for '{existing.name}' is already registered! Please sign in.",
                "user": {
                    "id": existing.id,
                    "name": existing.name,
                    "email": existing.email,
                    "designation": existing.designation,
                    "section": existing.section,
                    "year": existing.year
                }
            }

        new_faculty = FacultyAccount(
            name=payload.name.strip(),
            email=email_clean,
            password=payload.password.strip(),
            designation=payload.designation or "Faculty Member",
            section=payload.section or "All Sections",
            year=payload.year or "All Years"
        )
        db.add(new_faculty)
        db.commit()
        db.refresh(new_faculty)

        sync_to_unified_user(db, new_faculty.name, new_faculty.email, new_faculty.password, "faculty", new_faculty.designation, new_faculty.section, new_faculty.year)

        # Seed local SQLite calendar
        try:
            from services.academic_calendar_parser import seed_user_academic_calendar
            seed_user_academic_calendar(email_clean)
        except Exception as seed_err:
            print(f"[Registration Calendar Seed Error] Faculty: {seed_err}")

        return {
            "status": "success",
            "role": "faculty",
            "user": {
                "id": new_faculty.id,
                "name": new_faculty.name,
                "email": new_faculty.email,
                "designation": new_faculty.designation,
                "section": new_faculty.section,
                "year": new_faculty.year,
                "token": create_jwt_token(new_faculty.email, "faculty")
            },
            "message": "Faculty account registered successfully!"
        }


# ─── Placement Cell Authentication Endpoints ─────────────────────────────────────

@router.post("/placement_cell/login")
@router.post("/placement/login")
def login_placement(payload: PlacementCellLoginRequest):
    email_clean = payload.email.strip().lower()
    password_clean = payload.password.strip()

    with get_db_session() as db:
        seed_unified_users_if_needed(db)
        u_match = db.query(User).filter(User.email == email_clean).first()
        if not u_match:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Placement coordinator account not found. Please verify details."
            )

        if u_match.role != "placement_cell":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role Access Denied: '{email_clean}' is registered as a {u_match.role.replace('_', ' ')} account. Switch tabs to sign in."
            )

        if u_match.password != password_clean:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect placement password. Please verify credentials."
            )

        # Ensure they have a record in FacultyAccount as well (designation="Placement Coordinator")
        faculty_match = db.query(FacultyAccount).filter(FacultyAccount.email == email_clean).first()
        if not faculty_match:
            faculty_match = FacultyAccount(
                name=u_match.name,
                email=u_match.email,
                password=u_match.password,
                designation="Placement Coordinator",
                section="All Sections",
                year="All Years"
            )
            db.add(faculty_match)
            db.commit()
            db.refresh(faculty_match)

        return {
            "status": "success",
            "role": "placement_cell",
            "user": {
                "id": u_match.id,
                "name": u_match.name,
                "email": u_match.email,
                "designation": u_match.designation,
                "section": u_match.section,
                "year": u_match.year,
                "token": create_jwt_token(u_match.email, "placement_cell")
            },
            "message": f"Welcome back, {u_match.name}! Redirecting to Placement Cell Command Center..."
        }


@router.post("/placement_cell/register")
@router.post("/placement/register")
def register_placement(payload: PlacementCellRegisterRequest):
    email_clean = payload.email.strip().lower()

    with get_db_session() as db:
        seed_unified_users_if_needed(db)
        u_match = db.query(User).filter(User.email == email_clean).first()
        if u_match:
            return {
                "status": "account_exists",
                "message": f"Account for '{u_match.name}' is already registered as a {u_match.role.replace('_', ' ')}! Please log in.",
                "user": {
                    "id": u_match.id,
                    "name": u_match.name,
                    "email": u_match.email,
                    "role": u_match.role,
                    "section": u_match.section,
                    "year": u_match.year
                }
            }

        # Create central unified user
        new_user = sync_to_unified_user(
            db,
            name=payload.name.strip(),
            email=email_clean,
            password=payload.password.strip(),
            role="placement_cell",
            designation=payload.designation or "Placement Officer",
            section=payload.section or "All Sections",
            year=payload.year or "All Years"
        )

        # Sync to FacultyAccount too (for other legacy modules)
        new_faculty = FacultyAccount(
            name=new_user.name,
            email=new_user.email,
            password=new_user.password,
            designation=new_user.designation,
            section=new_user.section,
            year=new_user.year
        )
        db.add(new_faculty)
        db.commit()

        # Seed local SQLite calendar
        try:
            from services.academic_calendar_parser import seed_user_academic_calendar
            seed_user_academic_calendar(email_clean)
        except Exception as seed_err:
            print(f"[Registration Calendar Seed Error] Placement: {seed_err}")

        return {
            "status": "success",
            "role": "placement_cell",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "designation": new_user.designation,
                "section": new_user.section,
                "year": new_user.year,
                "token": create_jwt_token(new_user.email, "placement_cell")
            },
            "message": "Placement Cell account registered successfully!"
        }
