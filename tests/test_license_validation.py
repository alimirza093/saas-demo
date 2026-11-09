import uuid
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.main import app
from backend.database import SessionLocal
from backend.models import Subscription, User
from backend.seed import seed_demo_data

client = TestClient(app)


def setup_demo_user(email='license-demo@example.com', password='secret123'):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            from backend.seed import pwd_context
            user = User(name='License Demo', email=email, password_hash=pwd_context.hash(password), role='customer', is_active=True)
            db.add(user)
            db.commit(); db.refresh(user)
        return user
    finally:
        db.close()


def test_license_validation_accepts_active_subscription():
    seed_demo_data(SessionLocal())
    user = setup_demo_user()
    unique_email = f'active-{uuid.uuid4().hex[:8]}@example.com'
    register = client.post('/api/auth/register', json={'name':'License Demo','email':unique_email,'password':'secret123'})
    token = register.json()['access_token']
    product = client.get('/api/products').json()[0]
    plan = client.get('/api/plans').json()[0]
    purchase = client.post('/api/customer/purchase', json={'product_id': product['id'], 'plan_id': plan['id']}, headers={'Authorization': f'Bearer {token}'})
    license_key = purchase.json()['subscription']['license_key']
    response = client.post('/api/license/validate', json={'license_key': license_key, 'os': 'windows'})
    assert response.status_code == 200
    assert response.json()['valid'] is True


def test_license_validation_rejects_expired_subscription():
    unique_email = f'expire-{uuid.uuid4().hex[:8]}@example.com'
    register = client.post('/api/auth/register', json={'name':'Expire Demo','email':unique_email,'password':'secret123'})
    token = register.json()['access_token']
    product = client.get('/api/products').json()[0]
    plan = client.get('/api/plans').json()[0]
    purchase = client.post('/api/customer/purchase', json={'product_id': product['id'], 'plan_id': plan['id']}, headers={'Authorization': f'Bearer {token}'})
    license_key = purchase.json()['subscription']['license_key']
    db = SessionLocal()
    sub = db.query(Subscription).filter(Subscription.license_key == license_key).first()
    sub.status = 'expired'
    sub.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit(); db.close()
    response = client.post('/api/license/validate', json={'license_key': license_key, 'os': 'ubuntu'})
    assert response.status_code == 200
    assert response.json()['valid'] is False


def test_license_validation_recovers_from_stale_expired_status_when_time_remains():
    unique_email = f'recovered-{uuid.uuid4().hex[:8]}@example.com'
    register = client.post('/api/auth/register', json={'name':'Recovered Demo','email':unique_email,'password':'secret123'})
    token = register.json()['access_token']
    product = client.get('/api/products').json()[0]
    plan = client.get('/api/plans').json()[0]
    purchase = client.post('/api/customer/purchase', json={'product_id': product['id'], 'plan_id': plan['id']}, headers={'Authorization': f'Bearer {token}'})
    license_key = purchase.json()['subscription']['license_key']

    db = SessionLocal()
    sub = db.query(Subscription).filter(Subscription.license_key == license_key).first()
    sub.status = 'expired'
    sub.expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    db.commit(); db.close()

    response = client.post('/api/license/validate', json={'license_key': license_key, 'os': 'windows'})
    assert response.status_code == 200
    assert response.json()['valid'] is True
    assert response.json()['status'] == 'active'
