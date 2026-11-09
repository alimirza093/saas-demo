# Restaurant SaaS Demo

A full-stack SaaS demo for a downloadable restaurant management desktop application with subscription licensing, customer dashboard, and admin controls.

## Features

- Dark-themed marketing website
- Product and pricing pages
- JWT-authenticated customer registration/login
- Simulated subscription purchase flow
- 5-minute active subscription with backend validation
- Download protection based on subscription status
- Admin dashboard for customers, subscriptions, renewal, and plan changes
- SQLite persistence with SQLAlchemy models ready for future PostgreSQL migration

## Demo Admin Credentials

- Email: admin@saasdemo.com
- Password: admin123

## Default Product

- Restaurant Management Software Demo
- Version: 1.0.0
- Price: Rs. 4,999/month display value

## Local Setup

1. Install backend dependencies:
   pip install -r requirements.txt
2. Install frontend dependencies:
   npm --prefix frontend install
3. Start the backend:
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
4. Start the frontend:
   npm --prefix frontend run dev -- --host 0.0.0.0
5. Open the frontend in the browser, usually on:
   http://localhost:5173

For convenience, the root project also includes:

- npm run dev: runs both backend and frontend together
- npm run build: builds the frontend production bundle

## Demo Customer Flow

1. Register a customer account
2. Log in with the new account
3. Open the product page and click Buy Now
4. Select a plan and complete the simulated payment
5. Access the dashboard to view the active license, countdown, and download button
6. Download the dummy installer while the subscription is active
7. After 5 minutes, the backend marks the subscription as expired and blocks the download

## Admin Flow

1. Log in using the admin account above
2. Open the admin dashboard
3. View overview statistics, customers, and subscriptions
4. Renew or update customer subscriptions from the admin panel

## Notes

- Subscription expiry is enforced on the backend for protected downloads and API access.
- The frontend timer is only for display.
- The dummy installer is intentionally a text-based placeholder named RestaurantSoftware-Setup.exe and is not a real Windows executable.
