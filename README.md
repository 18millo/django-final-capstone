# CombatHub — Combat Sports Ecosystem

A full-stack combat sports platform where athletes, coaches, gym owners, and vendors connect. Includes a standalone **Combat Shop** — a Nike-inspired marketplace with vendor management, premium subscriptions, and SSO integration.

**Stack:** Django REST Framework (backend) + React + Vite (frontend) + PostgreSQL + Redis + WebSockets (Django Channels)

## Features

### CombatHub (Main App)
- **Role-based platform** — 5 user roles: athlete, coach, gym_owner, vendor, admin
- **Social network** — Posts, gallery, likes, comments, follower system, bookmarks
- **Marketplace** — Products with variants, cart (athletes only), checkout with M-Pesa/Visa
- **Messaging** — Real-time DMs via WebSockets with view-once image support
- **Community** — User discovery with search, filter, and role tabs
- **Groups** — Private/public groups with invite system and messaging
- **Premium subscriptions** — 30-day trial → 7-day grace → auto-removal
- **Content moderation** — Regex-based flagging for profanity, violence, spam
- **Security** — JWT auth, role-based permissions, rate limiting, CORS, IP hashing

### Combat Shop (Standalone Storefront)
- **Customer storefront** — Product browsing, category filtering, image cycling, light/dark mode
- **Vendor dashboard** — Product/order management, analytics, brand registration
- **Vendor premium** — Free/Basic ($19/mo)/Pro ($49/mo) plans with 14-day free trial, feature gating
- **SSO integration** — Seamless login from CombatHub via JWT token exchange
- **Multi-role auth** — Vendors login via password form; athletes auto-authenticate via SSO from CombatHub
- **Role-based routing** — Customer routes at `/shop/*`, vendor routes at `/vendor/*`
- **Sync logout** — Cross-origin session management via `shop_active` cookie
- **Brand system** — Vendors register brands used across products
- **Combat Shop design** — Liquid-glass cards, Nike red (#e5101d), dark-first with CSS variable-based light mode

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Set up .env (see .env.example)
python manage.py migrate
python manage.py seed_plans  # Seed vendor premium plans
python manage.py runserver
```

### CombatHub Frontend
```bash
cd frontend
npm install
npm run dev   # Port 5173
```

### Combat Shop Frontend
```bash
cd shop
npm install
npm run dev   # Port 5174
```

### Docker (alternative)
```bash
docker compose up --build -d
```

## Architecture

```
                     ┌──────────────────────┐
                     │    CombatHub (5173)   │
                     │  React + Vite         │
                     └──────┬───────────────┘
                            │ JWT + SSO
                     ┌──────▼───────────────┐
                     │    Combat Shop (5174) │
                     │  React + Vite         │
                     └──────┬───────────────┘
                            │ REST API
                     ┌──────▼───────────────┐
                     │  Django REST Framework│
                     │  Port 8000/api        │
                     └──────┬───────────────┘
                     ┌──────▼──────┬────────┐
                     │ PostgreSQL  │  Redis │
                     └─────────────┴────────┘
```

## Environment Variables

Create `backend/.env` with the following (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | Set to `True` for development |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts |
| `FRONTEND_URL` | Comma-separated frontend origins |
| `DB_NAME` | PostgreSQL database name |
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `EMAIL_HOST` | SMTP server |
| `EMAIL_HOST_USER` | SMTP user |
| `EMAIL_HOST_PASSWORD` | SMTP password |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |

## Project Structure
```
backend/
├── accounts/    # Users, auth, profiles, social features
├── products/    # Marketplace, cart, checkout, orders
├── shop/        # Vendor management, premium plans, brand system, SSO
├── chat/        # WebSocket consumers for messaging
├── gyms/        # Gym management
├── events/      # Event management
├── reviews/     # Product/gym reviews
├── payments/    # Payment processing
├── subscriptions/  # Premium tiers
├── common/      # Shared permissions, throttling
└── config/      # Django settings, URLs, ASGI

frontend/ (CombatHub)
├── src/
│   ├── pages/        # Route pages
│   ├── components/   # Reusable UI components
│   ├── layouts/      # Main/Auth layouts
│   ├── providers/    # React context providers
│   └── utils/        # API client, sounds, helpers
└── public/           # Static assets

shop/ (Combat Shop)
├── src/
│   ├── pages/        # Route pages (Landing, Shop, Products, Orders, etc.)
│   ├── layouts/      # ShopLayout (vendor sidebar), CustomerLayout
│   ├── providers/    # AuthProvider, CartProvider, ThemeProvider
│   └── images/       # Logo, icons
├── songs/            # Background music (auto-play, shuffled)
├── videos/           # Hero video assets
└── public/           # Static assets
```
