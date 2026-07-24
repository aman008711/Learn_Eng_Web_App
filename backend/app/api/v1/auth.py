from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import jwt
from sqlalchemy.orm import Session

from app.api import deps
from app.config import settings
from app.db.models.user import User
from app.db.repository.user_repo import user_repo
from app.schemas.user import UserCreate, UserOut, ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.token import Token, TokenRefreshRequest, TokenPayload
from app.core import security

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate
) -> Any:
    """
    Create a new user account.
    """
    user = user_repo.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    user = user_repo.create(db, email=user_in.email, password=user_in.password)
    return user

@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, retrieve access and refresh tokens.
    """
    user = user_repo.get_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        refresh_token=security.create_refresh_token(user.id),
        token_type="bearer"
    )

@router.post("/refresh", response_model=Token)
def refresh_token(
    *,
    db: Session = Depends(deps.get_db),
    refresh_in: TokenRefreshRequest
) -> Any:
    """
    Refresh access token using a valid refresh token.
    """
    try:
        payload = jwt.decode(
            refresh_in.refresh_token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.type != "refresh" or not token_data.sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token type"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token or token expired"
        )
        
    user = user_repo.get_by_id(db, user_id=token_data.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        refresh_token=security.create_refresh_token(user.id),
        token_type="bearer"
    )

@router.post("/forgot-password")
def forgot_password(
    *,
    db: Session = Depends(deps.get_db),
    req: ForgotPasswordRequest
) -> Any:
    """
    Initiate account recovery. Generates a reset token and returns a mock link.
    """
    user = user_repo.get_by_email(db, email=req.email)
    if not user:
        # Avoid user enumeration attacks: return success anyway
        return {"message": "Recovery email sent if the address exists."}
        
    # Generate a secure reset token valid for 30 minutes
    reset_expire = timedelta(minutes=30)
    reset_token = security.create_access_token(
        subject=str(user.id), expires_delta=reset_expire
    )
    
    # In a real SaaS, send an email. For demo/development, we output a mock URL:
    recovery_link = f"http://localhost:5173/reset-password?token={reset_token}"
    print(f"\n[RECOVERY LINK FOR USER {user.email}]: {recovery_link}\n")
    
    return {
        "message": "Recovery email sent if the address exists.",
        "dev_recovery_link": recovery_link  # Included to facilitate easy front-to-back manual testing
    }

@router.post("/reset-password")
def reset_password(
    *,
    db: Session = Depends(deps.get_db),
    req: ResetPasswordRequest
) -> Any:
    """
    Complete account recovery by providing the reset token and a new password.
    """
    try:
        payload = jwt.decode(
            req.token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if not token_data.sub:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid password reset token payload"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is invalid or expired"
        )
        
    user = user_repo.get_by_id(db, user_id=token_data.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    user_repo.update(db, db_obj=user, update_data={"password": req.new_password})
    return {"message": "Password updated successfully."}

@router.get("/test-token", response_model=UserOut)
def test_token(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Check if the access token is valid and return current user profile info.
    """
    return current_user
