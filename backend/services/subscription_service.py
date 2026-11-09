import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..models import DownloadHistory, LicenseKey, Plan, Product, RenewalHistory, Subscription


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def generate_license_key() -> str:
    return f"RMS-{uuid.uuid4().hex[:12].upper()}"


def as_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def sync_subscription_state(db: Session, subscription: Subscription) -> Subscription:
    expires_at = as_utc(subscription.expires_at)
    now = utc_now()

    if subscription.status == "active" and expires_at and expires_at <= now:
        subscription.status = "expired"
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        return subscription

    if subscription.status == "expired" and expires_at and expires_at > now:
        subscription.status = "active"
        db.add(subscription)
        db.commit()
        db.refresh(subscription)

    return subscription


def ensure_subscription_active(db: Session, user_id: int, product_id: int) -> Subscription:
    subscription = (
        db.query(Subscription)
        .filter(Subscription.user_id == user_id, Subscription.product_id == product_id)
        .order_by(desc(Subscription.created_at))
        .first()
    )

    if not subscription:
        raise HTTPException(status_code=403, detail="No active subscription found for this product.")

    subscription = sync_subscription_state(db, subscription)
    if subscription.status != "active":
        raise HTTPException(status_code=403, detail="Your subscription has expired. Please renew to continue.")

    return subscription


def create_subscription_for_user(db: Session, user_id: int, product_id: int, plan_id: int) -> Subscription:
    product = db.query(Product).filter(Product.id == product_id).first()
    plan = db.query(Plan).filter(Plan.id == plan_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    start_time = utc_now()
    expires_at = start_time + timedelta(minutes=plan.duration_minutes)
    license_key = generate_license_key()

    subscription = Subscription(
        user_id=user_id,
        product_id=product_id,
        plan_id=plan_id,
        license_key=license_key,
        status="active",
        started_at=start_time,
        expires_at=expires_at,
        created_at=start_time,
    )

    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    db.add(LicenseKey(subscription_id=subscription.id, key=license_key, status="active", issued_at=start_time))
    db.commit()

    return subscription


def renew_subscription(db: Session, subscription: Subscription, plan_id: int | None = None) -> Subscription:
    old_status = subscription.status
    plan = db.query(Plan).filter(Plan.id == (plan_id or subscription.plan_id)).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    start_time = utc_now()
    expires_at = start_time + timedelta(minutes=plan.duration_minutes)
    subscription.plan_id = plan.id
    subscription.status = "active"
    subscription.started_at = start_time
    subscription.expires_at = expires_at
    subscription.license_key = subscription.license_key or generate_license_key()

    db.add(
        RenewalHistory(
            subscription_id=subscription.id,
            old_status=old_status,
            new_status="active",
            reason="manual_renewal",
            started_at=start_time,
            expires_at=expires_at,
            created_at=start_time,
        )
    )

    license_record = db.query(LicenseKey).filter(LicenseKey.subscription_id == subscription.id).order_by(desc(LicenseKey.issued_at)).first()
    if license_record:
        license_record.status = "active"
        license_record.revoked_at = None
        license_record.issued_at = start_time
    else:
        db.add(LicenseKey(subscription_id=subscription.id, key=subscription.license_key, status="active", issued_at=start_time))

    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


def record_download(db: Session, user_id: int, subscription_id: int, product_id: int, file_name: str, operating_system: str = "windows") -> DownloadHistory:
    download = DownloadHistory(
        user_id=user_id,
        subscription_id=subscription_id,
        product_id=product_id,
        file_name=file_name,
        operating_system=operating_system.lower() if operating_system else "windows",
        status="success",
        downloaded_at=utc_now(),
    )
    db.add(download)
    db.commit()
    db.refresh(download)
    return download
