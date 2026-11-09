from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2)
    email: str = Field(..., min_length=4)
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class QuickPurchase(BaseModel):
    product_id: int
    plan_id: int


class RenewRequest(BaseModel):
    plan_id: int


class AdminPlanUpdate(BaseModel):
    plan_id: int


class LicenseValidationRequest(BaseModel):
    license_key: str
    os: str | None = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str
    version: str
    price: float
    is_active: bool
    created_at: Optional[datetime] = None


class PlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    price: float
    duration_minutes: int
    is_active: bool
    created_at: Optional[datetime] = None
