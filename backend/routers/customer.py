from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import DownloadHistory, Payment, Plan, Product, Subscription, User
from ..schemas import QuickPurchase, RenewRequest
from ..services.subscription_service import as_utc, create_subscription_for_user, ensure_subscription_active, record_download, renew_subscription, utc_now

router = APIRouter(prefix="/api/customer")


@router.get("/dashboard")
def get_customer_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.slug == "restaurant-management-software-demo").first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    subscription = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id, Subscription.product_id == product.id)
        .order_by(desc(Subscription.created_at))
        .first()
    )

    if subscription:
        expires_at = as_utc(subscription.expires_at)
        started_at = as_utc(subscription.started_at)

        if subscription.status == "active" and expires_at and expires_at <= utc_now():
            subscription.status = "expired"
            db.commit()
            db.refresh(subscription)
        elif subscription.status == "expired" and expires_at and expires_at > utc_now():
            subscription.status = "active"
            db.commit()
            db.refresh(subscription)

        expires_at = as_utc(subscription.expires_at)
        started_at = as_utc(subscription.started_at)
        remaining_seconds = max((expires_at - utc_now()).total_seconds(), 0) if expires_at else 0
        plan = db.query(Plan).filter(Plan.id == subscription.plan_id).first()
        download_history = (
            db.query(DownloadHistory)
            .filter(DownloadHistory.user_id == current_user.id, DownloadHistory.product_id == product.id)
            .order_by(desc(DownloadHistory.downloaded_at))
            .all()
        )
    else:
        remaining_seconds = 0
        plan = None
        download_history = []
        subscription = None

    return {
        "subscription": {
            "id": subscription.id if subscription else None,
            "status": subscription.status if subscription else "inactive",
            "plan_name": plan.name if plan else None,
            "license_key": subscription.license_key if subscription else None,
            "started_at": started_at.isoformat() if subscription and started_at else None,
            "expires_at": expires_at.isoformat() if subscription and expires_at else None,
            "remaining_seconds": round(remaining_seconds),
            "product_id": product.id,
            "product_name": product.name,
        } if subscription else None,
        "download_history": [
            {
                "id": item.id,
                "file_name": item.file_name,
                "operating_system": item.operating_system,
                "downloaded_at": (as_utc(item.downloaded_at).isoformat() if as_utc(item.downloaded_at) else None),
            }
            for item in download_history
        ],
    }


@router.post("/purchase")
def purchase_product(payload: QuickPurchase, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    plan = db.query(Plan).filter(Plan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    subscription = create_subscription_for_user(db, current_user.id, product.id, plan.id)
    payment = Payment(
        user_id=current_user.id,
        subscription_id=subscription.id,
        amount=plan.price,
        currency="PKR",
        status="simulated_paid",
        provider="demo_gateway",
        transaction_ref=f"DEMO-{current_user.id}-{subscription.id}-{int(utc_now().timestamp())}",
    )
    db.add(payment)
    db.commit()

    started_at = as_utc(subscription.started_at)
    expires_at = as_utc(subscription.expires_at)

    return {
        "message": "Demo purchase successful",
        "subscription": {
            "id": subscription.id,
            "status": subscription.status,
            "plan_name": plan.name,
            "license_key": subscription.license_key,
            "started_at": started_at.isoformat() if started_at else None,
            "expires_at": expires_at.isoformat() if expires_at else None,
        },
    }


@router.post("/renew")
def renew_subscription_for_customer(payload: RenewRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.slug == "restaurant-management-software-demo").first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    subscription = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id, Subscription.product_id == product.id)
        .order_by(desc(Subscription.created_at))
        .first()
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="No subscription to renew")

    updated = renew_subscription(db, subscription, payload.plan_id)
    started_at = as_utc(updated.started_at)
    expires_at = as_utc(updated.expires_at)
    return {
        "message": "Subscription renewed successfully",
        "subscription": {
            "id": updated.id,
            "status": updated.status,
            "license_key": updated.license_key,
            "started_at": started_at.isoformat() if started_at else None,
            "expires_at": expires_at.isoformat() if expires_at else None,
        },
    }


@router.get("/download")
def download_product(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    platform: str = Query("windows"),
    os: str | None = Query(None),
):
    product = db.query(Product).filter(Product.slug == "restaurant-management-software-demo").first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    subscription = ensure_subscription_active(db, current_user.id, product.id)
    requested_platform = (os or platform or "windows").lower()
    selected_platform = requested_platform.replace(" ", "")
    if selected_platform in {"ubuntu", "linux"}:
        file_name = "RestaurantSoftware.AppImage"
        file_path = "backend/static/RestaurantSoftware.AppImage"
    else:
        file_name = "RestaurantSoftware-Setup.exe"
        file_path = "backend/static/RestaurantSoftware-Setup.exe"

    if not __import__('os').path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Installer not available for the selected platform: {selected_platform}")

    record_download(db, current_user.id, subscription.id, product.id, file_name, selected_platform)
    return FileResponse(path=file_path, media_type="application/octet-stream", filename=file_name)


@router.get("/history")
def get_download_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    history = (
        db.query(DownloadHistory)
        .filter(DownloadHistory.user_id == current_user.id)
        .order_by(desc(DownloadHistory.downloaded_at))
        .all()
    )
    return [
        {
            "id": item.id,
            "file_name": item.file_name,
            "operating_system": item.operating_system,
            "status": item.status,
            "downloaded_at": (as_utc(item.downloaded_at).isoformat() if as_utc(item.downloaded_at) else None),
        }
        for item in history
    ]
