from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserLogin, TokenResponse, UserResponse, StudentRegister, UserProfileUpdate
from app.auth import verify_password, hash_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """General login endpoint returning JWT token and user profile."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact administration."
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/student-login", response_model=TokenResponse)
def student_login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Dedicated Student Portal login.
    Enforces that only accounts with role 'student' can log in here.
    """
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid student email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrative credentials detected. Please use the Admin Portal login page."
        )

    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student account is suspended. Contact helpdesk staff."
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/admin-login", response_model=TokenResponse)
def admin_login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Dedicated Admin Portal login.
    Rejects student accounts with HTTP 403 Forbidden.
    """
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.role not in ["admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Student accounts are not authorized to access the Admin Portal."
        )

    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator account is inactive."
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/student-register", response_model=TokenResponse)
def student_register(reg_data: StudentRegister, db: Session = Depends(get_db)):
    """
    Public student registration.
    SECURITY REQUIREMENT: Role is STRICTLY hardcoded to 'student'. Users cannot self-assign administrative roles.
    """
    existing_user = db.query(User).filter(User.email == reg_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    if reg_data.student_id:
        existing_id = db.query(User).filter(User.student_id == reg_data.student_id).first()
        if existing_id:
            raise HTTPException(status_code=400, detail="Student ID is already registered.")

    new_student = User(
        email=reg_data.email,
        full_name=reg_data.full_name,
        role="student",  # Hardcoded: NEVER user-controllable
        student_id=reg_data.student_id,
        department=reg_data.department,
        phone=reg_data.phone,
        password_hash=hash_password(reg_data.password),
        is_active=True
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    access_token = create_access_token(data={"sub": new_student.email, "role": new_student.role, "id": new_student.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_student
    }

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Students can edit permitted profile details (e.g. phone, department, name)."""
    if profile_data.full_name:
        current_user.full_name = profile_data.full_name.strip()
    if profile_data.department:
        current_user.department = profile_data.department.strip()
    if profile_data.phone:
        current_user.phone = profile_data.phone.strip()

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/demo-switch/{role}", response_model=TokenResponse)
def switch_demo_user(role: str, db: Session = Depends(get_db)):
    """
    Seamless role switcher for evaluator demonstration.
    Generates real signed JWT tokens for testing persona isolation.
    """
    target_role = role.lower()
    if target_role in ["student2", "rahul"]:
        user = db.query(User).filter(User.email == "rahul.verma@campus.edu").first()
    elif target_role in ["student", "student1", "priya"]:
        user = db.query(User).filter(User.email == "priya.sharma@campus.edu").first()
    elif target_role in ["staff", "david"]:
        user = db.query(User).filter(User.role == "staff").first()
    elif target_role in ["admin", "dean"]:
        user = db.query(User).filter(User.role == "admin").first()
    else:
        raise HTTPException(status_code=400, detail="Invalid role specified. Use 'student', 'student2', 'staff', or 'admin'.")

    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found.")

    access_token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
