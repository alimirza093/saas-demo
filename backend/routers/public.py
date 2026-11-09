from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Plan, Product, Subscription
from ..schemas import LicenseValidationRequest
from ..services.subscription_service import as_utc, sync_subscription_state, utc_now

router = APIRouter(prefix="/api")


@router.get("/products")
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.is_active.is_(True)).all()
    return [
        {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "version": product.version,
            "price": product.price,
            "is_active": product.is_active,
        }
        for product in products
    ]


@router.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "version": product.version,
        "price": product.price,
        "is_active": product.is_active,
    }


@router.get("/plans")
def list_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).filter(Plan.is_active.is_(True)).all()
    return [
        {
            "id": plan.id,
            "name": plan.name,
            "description": plan.description,
            "price": plan.price,
            "duration_minutes": plan.duration_minutes,
            "is_active": plan.is_active,
        }
        for plan in plans
    ]


@router.get("/health")
def health_check():
    return {"status": "ok", "message": "SaaS demo backend is running"}


@router.post("/license/validate")
def validate_license(payload: LicenseValidationRequest, db: Session = Depends(get_db)):
    subscription = db.query(Subscription).filter(Subscription.license_key == payload.license_key).first()
    if not subscription:
        return {"valid": False, "error": "Unknown license key", "status": "unknown"}

    subscription = sync_subscription_state(db, subscription)
    expires_at = as_utc(subscription.expires_at)
    remaining_seconds = max((expires_at - utc_now()).total_seconds(), 0) if expires_at else 0

    if subscription.status != "active" or remaining_seconds <= 0:
        return {
            "valid": False,
            "status": subscription.status,
            "license_key": subscription.license_key,
            "expires_at": expires_at.isoformat() if expires_at else None,
            "remaining_seconds": 0,
            "message": "Your demo subscription has expired. Please contact the administrator to renew your subscription.",
        }

    return {
        "valid": True,
        "status": subscription.status,
        "license_key": subscription.license_key,
        "expires_at": expires_at.isoformat() if expires_at else None,
        "remaining_seconds": round(remaining_seconds),
        "message": "License active",
    }
