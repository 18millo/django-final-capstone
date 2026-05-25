# CombatHub & Combat Shop — Capstone Project

## Overview

A full-stack combat sports ecosystem with two interconnected frontends:

- **CombatHub** — Social network for fighters, coaches, gym owners, and vendors
- **Combat Shop** — Nike-inspired standalone marketplace with vendor tools

---

## CombatHub (Main App)

### Core Features
| Feature | Details |
|---------|---------|
| Role system | Athlete, Coach, Gym Owner, Vendor, Admin — different dashboards per role |
| Social | Posts with images, likes, comments, bookmarks, follower system |
| Messaging | Real-time DMs via Django Channels WebSockets, view-once images |
| Groups | Private/public with invites and group chat |
| Marketplace | Product CRUD, variants, cart, checkout (M-Pesa/Visa) |
| Premium | 30-day trial → 7-day grace → auto-removal of non-subscribers |
| Content moderation | Regex flags for profanity, violence, spam |

### Tech
- Django REST Framework, PostgreSQL, Redis
- React + Vite, JWT auth

---

## Combat Shop (Standalone Storefront)

### Rationale
A separate Vite app on port 5174, sharing Django backend via REST + SSO token exchange.

### Architecture
```
CombatHub (5173) ──SSO JWT──▶ Shop Landing (5174)
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
            Customer routes               Vendor routes
            /shop/*                       /vendor/*
```

### Auth Flow
- **Vendors**: Login via password form at `/login`
- **Non-vendors (athletes)**: Click Shop link from CombatHub → `/?token=<jwt>` → SSO auto-login
- **Sync logout**: `shop_active` cookie (`domain=localhost`) — cleared on CombatHub logout, checked via `visibilitychange`
- **SSO before localStorage**: AuthProvider checks URL param first — no stale vendor token race

### Customer Features
| Feature | Details |
|---------|---------|
| Landing page | Hero video carousel, auto-scrolling products, categories grid, background music |
| Product browsing | Filter by sport, image hover-cycling, discount badges |
| Cart & checkout | CartProvider context, product variants |
| Light/dark mode | Persisted to `localStorage('shop_theme')`, `data-theme` on `<html>` |
| Access gate | External visitors see login prompt; SSO users bypass |

### Vendor Features
| Feature | Details |
|---------|---------|
| Dashboard | Product/order/revenue stats, quick-add products |
| Product management | CRUD with image upload via `/shop/upload/` |
| Orders | List, detail, confirm fulfillment |
| Brand system | Register brands in-product or via `/vendor/brands` — auto-populated dropdown |
| Settings | Profile update, avatar upload/remove |
| Premium | 3-tier subscription (Free/Basic $19/Pro $49), 14-day trial, feature gating |

### Vendor Premium Plans
| Plan | Price | Products | Discounts | Analytics |
|------|-------|----------|-----------|-----------|
| Free | $0 | 5 | No | No |
| Basic | $19/mo | 50 | Yes | No |
| Pro | $49/mo | Unlimited | Yes | Yes |

- Trial: 14 days with full premium access
- `HasVendorPremium` permission gates premium features
- `VendorSubscription.is_active` = True for `active` or `trialing` status
- Seed via `python manage.py seed_plans`

### Design System
- Liquid-glass cards with backdrop blur
- Nike red (#e5101d) accent
- Dark-first, CSS variable-based light mode toggle
- Desktop sidebar + mobile drawer for vendor navigation
- Animated transitions (slideUp, slowZoom, fadeIn)

### File Structure
```
shop/
├── src/
│   ├── pages/         # Landing, Shop, Products, Orders, Settings, Premium, Brands, etc.
│   ├── layouts/       # ShopLayout (vendor sidebar), CustomerLayout
│   ├── providers/     # AuthProvider, CartProvider, ThemeProvider
│   └── images/        # Logo, icons
├── songs/             # Background music (Vite glob auto-discovers .mp3)
├── videos/            # Hero section video assets
└── public/
```

### Key Backend Endpoints (shop app)
| Endpoint | Purpose |
|----------|---------|
| `POST /shop/auth/sso/` | Exchange CombatHub JWT for Shop JWT |
| `POST /shop/auth/login/` | Vendor password login |
| `GET /shop/auth/me/` | Current user info + `vendor_premium` status |
| `GET/PUT /shop/profile/` | Vendor profile + avatar upload |
| `GET/POST /shop/products/` | Vendor product CRUD |
| `POST /shop/upload/` | Product image upload (premium required) |
| `GET/POST /shop/brands/` | Brand list & create |
| `GET /shop/premium/plans/` | Available premium plans |
| `GET /shop/premium/subscription/` | Current vendor subscription |
| `POST /shop/premium/subscribe/` | Start trial / switch plan |
| `POST /shop/premium/cancel/` | Downgrade to Free |

---

## Key Technical Decisions

1. **Separate Shop frontend** — Isolates vendor/customer UI from social app, independent deploy + scaling
2. **SSO over iframe** — JWT token in URL param, processed by AuthProvider before any existing token check
3. **Cookie-based sync logout** — `shop_active` on `domain=localhost` bridges 5173 ↔ 5174 origins
4. **PATCH for avatar** — Partial update avoids 400 errors from missing fields on PUT
5. **Brand model** — Standalone model (not FK on Product) so `brand` stays CharField for simplicity
6. **SessionStorage consideration** — Auth currently uses `localStorage` (shared per-origin); `sessionStorage` would enable per-tab multi-identity

---

## Running Locally

```bash
# Backend
cd backend && python manage.py runserver

# CombatHub (port 5173)
cd frontend && npm run dev

# Combat Shop (port 5174)
cd shop && npm run dev
```

Visit `http://localhost:5173` for CombatHub, `http://localhost:5174` for Shop.

---

## Future Work

- Stripe/Visa payment integration for vendor premium
- Customer checkout payment processing
- Product search & filtering
- Order status webhooks
- More background songs/videos
