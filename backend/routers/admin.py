from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_admin
from ..models import DownloadHistory, LicenseKey, Plan, Product, RenewalHistory, Subscription, User
from ..schemas import AdminPlanUpdate
from ..services.subscription_service import renew_subscription, sync_subscription_state

router = APIRouter(prefix="/api/admin")


@router.get("/overview")
def get_overview(db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    total_customers = db.query(User).filter(User.role == "customer").count()
    active_subscriptions = db.query(Subscription).filter(Subscription.status == "active").count()
    expired_subscriptions = db.query(Subscription).filter(Subscription.status == "expired").count()
    total_downloads = db.query(DownloadHistory).count()

    recent_subscriptions = (
        db.query(Subscription)
        .order_by(desc(Subscription.created_at))
        .limit(5)
        .all()
    )

    recent_payload = []
    for row in recent_subscriptions:
        user = db.query(User).filter(User.id == row.user_id).first()
        plan = db.query(Plan).filter(Plan.id == row.plan_id).first()
        latest_download = (
            db.query(DownloadHistory)
            .filter(DownloadHistory.subscription_id == row.id)
            .order_by(desc(DownloadHistory.downloaded_at))
            .first()
        )
        recent_payload.append(
            {
                "id": row.id,
                "customer": user.email if user else "Unknown",
                "plan": plan.name if plan else "Unknown",
                "status": row.status,
                "expires_at": row.expires_at.isoformat() if row.expires_at else None,
                "operating_system": latest_download.operating_system if latest_download else None,
                "installer_file": latest_download.file_name if latest_download else None,
                "downloaded_at": latest_download.downloaded_at.isoformat() if latest_download else None,
            }
        )

    return {
        "total_customers": total_customers,
        "active_subscriptions": active_subscriptions,
        "expired_subscriptions": expired_subscriptions,
        "total_downloads": total_downloads,
        "recent_purchases": recent_payload,
    }


@router.get("/customers")
def list_customers(
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    query = db.query(User).filter(User.role == "customer")
    if search:
        like = f"%{search.lower()}%"
        query = query.filter((User.email.ilike(like)) | (User.name.ilike(like)))
    rows = query.order_by(User.created_at.desc()).all()
    return [
        {
            "id": row.id,
            "name": row.name,
            "email": row.email,
            "role": row.role,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]


@router.get("/customers/{customer_id}")
def get_customer_details(customer_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    customer = db.query(User).filter(User.id == customer_id, User.role == "customer").first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    subscriptions = (
        db.query(Subscription)
        .filter(Subscription.user_id == customer_id)
        .order_by(desc(Subscription.created_at))
        .all()
    )

    return {
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "email": customer.email,
            "role": customer.role,
            "created_at": customer.created_at.isoformat() if customer.created_at else None,
        },
        "subscriptions": [
            {
                "id": row.id,
                "status": row.status,
                "license_key": row.license_key,
                "started_at": row.started_at.isoformat() if row.started_at else None,
                "expires_at": row.expires_at.isoformat() if row.expires_at else None,
            }
            for row in subscriptions
        ],
    }


@router.get("/subscriptions")
def list_subscriptions(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    query = db.query(Subscription)
    if status:
        query = query.filter(Subscription.status == status)

    rows = query.order_by(desc(Subscription.created_at)).all()
    result = []
    for row in rows:
        user = db.query(User).filter(User.id == row.user_id).first()
        plan = db.query(Plan).filter(Plan.id == row.plan_id).first()
        latest_download = (
            db.query(DownloadHistory)
            .filter(DownloadHistory.subscription_id == row.id)
            .order_by(desc(DownloadHistory.downloaded_at))
            .first()
        )
        result.append(
            {
                "id": row.id,
                "customer": user.email if user else "Unknown",
                "plan": plan.name if plan else "Unknown",
                "license_key": row.license_key,
                "status": row.status,
                "started_at": row.started_at.isoformat() if row.started_at else None,
                "expires_at": row.expires_at.isoformat() if row.expires_at else None,
                "operating_system": latest_download.operating_system if latest_download else None,
                "installer_file": latest_download.file_name if latest_download else None,
                "downloaded_at": latest_download.downloaded_at.isoformat() if latest_download else None,
            }
        )
    return result


@router.post("/subscriptions/{subscription_id}/renew")
def renew_subscription_by_admin(subscription_id: int, payload: AdminPlanUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    updated = renew_subscription(db, subscription, payload.plan_id)
    return {"message": "Subscription renewed successfully", "subscription": {"id": updated.id, "status": updated.status, "license_key": updated.license_key}}


@router.post("/subscriptions/{subscription_id}/change-plan")
def change_subscription_plan(subscription_id: int, payload: AdminPlanUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    plan = db.query(Plan).filter(Plan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    subscription.plan_id = plan.id
    if subscription.status == "expired":
        subscription.status = "active"
    now = datetime.now(timezone.utc)
    subscription.started_at = now
    subscription.expires_at = now
    db.add(subscription)
    db.commit()
    return {"message": "Plan updated successfully", "subscription_id": subscription.id, "new_plan": plan.name}


@router.post("/subscriptions/{subscription_id}/toggle")
def toggle_subscription_status(subscription_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    subscription.status = "active" if subscription.status != "active" else "inactive"
    db.add(subscription)
    db.commit()
    return {"message": "Subscription status updated", "status": subscription.status}


@router.get("/license-keys")
def list_license_keys(db: Session = Depends(get_db), current_user=Depends(get_current_admin)):
    rows = db.query(LicenseKey).order_by(desc(LicenseKey.issued_at)).all()
    return [
        {
            "id": row.id,
            "key": row.key,
            "status": row.status,
            "issued_at": row.issued_at.isoformat() if row.issued_at else None,
            "subscription_id": row.subscription_id,
        }
        for row in rows
    ]
