from datetime import datetime, timezone

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .models import Plan, Product, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_demo_data(db: Session) -> None:
    admin_email = "admin@saasdemo.com"
    admin = db.query(User).filter(User.email == admin_email).first()
    if not admin:
        db.add(
            User(
                name="System Admin",
                email=admin_email,
                password_hash=pwd_context.hash("admin123"),
                role="admin",
                is_active=True,
                created_at=datetime.now(timezone.utc),
            )
        )

    product = db.query(Product).filter(Product.slug == "restaurant-management-software-demo").first()
    if not product:
        db.add(
            Product(
                name="Restaurant Management Software Demo",
                slug="restaurant-management-software-demo",
                description="A demo desktop application for restaurant management with inventory, billing, and staff controls.",
                version="1.0.0",
                price=4999.0,
                is_active=True,
                created_at=datetime.now(timezone.utc),
            )
        )

    plan_names = [
        ("Starter", "For solo operators and small teams", 2999.0, 5),
        ("Business", "Ideal for daily operations and fast-growing restaurants", 4999.0, 5),
        ("Premium", "Advanced insights and premium support", 6999.0, 5),
    ]

    for name, description, price, duration in plan_names:
        existing = db.query(Plan).filter(Plan.name == name).first()
        if not existing:
            db.add(
                Plan(
                    name=name,
                    description=description,
                    price=price,
                    duration_minutes=duration,
                    is_active=True,
                    created_at=datetime.now(timezone.utc),
                )
            )

    db.commit()
