from typing import Optional
import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field

# Shared properties
class UserBase(BaseModel):
    email: EmailStr

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")

# Properties to receive via API on update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None

# Properties to receive via login endpoint
class UserLogin(UserBase):
    password: str

# Properties to receive for forgot password request
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# Properties to receive for reset password completion
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

# Properties returned to client via API (outbound schemas)
class UserOut(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
