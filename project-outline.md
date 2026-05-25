# CombatHub & Combat Shop — Project Outline

## What It Is

A full-stack combat sports ecosystem with two apps:

| App | URL | Purpose |
|-----|-----|---------|
| **CombatHub** | `localhost:5173` | Social network for fighters, coaches, gym owners |
| **Combat Shop** | `localhost:5174` | Nike-inspired standalone marketplace |

Single Django backend (`localhost:8000/api`) serves both frontends.

---

## CombatHub (Social Platform)

**Who uses it:**
- **Athletes** — Post content, follow users, browse marketplace, message others
- **Coaches** — Create profiles, advertise services, follow athletes
- **Gym Owners** — Manage gym profiles, list facilities
- **Vendors** — Sign up via invitation only, manage products through the Shop

**Key features:**
- Posts with images, likes, comments, bookmarks
- Real-time messaging via WebSockets
- Groups (public/private) with invites
- Product marketplace with cart + checkout
- Professional profiles with certifications
- Premium subscription system
- Google OAuth login

---

## Combat Shop (Marketplace)

**Two entrance paths:**
| User type | How they enter | What they see |
|-----------|---------------|---------------|
| Athlete | Click Shop link from CombatHub → SSO auto-login | Customer storefront `/shop/*` |
| Vendor | Navigate directly to `/login` → password login | Vendor dashboard `/vendor/*` |

**Customer side (`/shop/*`):**
- Landing page with hero video, product carousel, categories
- Browse products by sport category
- Image cycling on hover
- Cart + checkout
- Light/dark mode toggle
- Background music (auto-shuffled)

**Vendor side (`/vendor/*`):**
- Dashboard with stats
- Product CRUD with image upload
- Brand registration (auto-populated dropdown in product form)
- Order management
- Profile settings with avatar upload
- Premium subscription plans

**Vendor Premium Plans:**
| Plan | Price | Products | Discounts | Analytics |
|------|-------|----------|-----------|-----------|
| Free | $0 | 5 | No | No |
| Basic | $19/mo | 50 | Yes | No |
| Pro | $49/mo | Unlimited | Yes | Yes |

14-day free trial on paid plans. `HasVendorPremium` gates product creation, image upload, and discount features.

---

## Auth Flow

```
CombatHub                                 Combat Shop
   │                                          │
   ├── User clicks "Shop" ─────────────────► ?token=<JWT>
   │                                          │
   │                                     AuthProvider checks
   │                                     URL for ?token=
   │                                          │
   │                                   ┌──────┴──────┐
   │                                   │  POST /shop/ │
   │                                   │ auth/sso/    │
   │                                   └──────┬──────┘
   │                                          │
   │                                   Shop JWT stored
   │                                   in localStorage
   │                                          │
   │                                   ┌──────┴──────┐
   │                                   │ Vendor?      │
   │                                   ├── Yes → /vendor/dashboard
   │                                   └── No  → Landing page
```

- SSO processes **before** any existing token check — no stale vendor session race
- Sync logout via `shop_active` cookie (`domain=localhost`) — checked on tab focus

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django REST Framework, Python |
| Frontends | React 19, Vite, React Router |
| Database | PostgreSQL |
| Cache | Redis |
| Auth | SimpleJWT (access + refresh tokens) |
| SSO | JWT token exchange between apps |

---

## File Structure

```
backend/
├── accounts/     # Users, auth, social features
├── products/     # Marketplace, cart, orders
├── shop/         # Vendor management, premium, brands, SSO
├── chat/         # WebSocket messaging
├── gyms/         # Gym profiles
├── common/       # Shared permissions
└── config/       # Django settings

frontend/ (CombatHub — port 5173)
├── src/pages/     # Route pages
├── src/layouts/   # Main navigation
└── src/utils/     # API client, helpers

shop/ (Combat Shop — port 5174)
├── src/pages/     # Landing, Shop, Products, Orders, etc.
├── src/layouts/   # Vendor sidebar, customer layout
├── src/providers/ # Auth, Cart, Theme
├── songs/         # Background music (.mp3)
└── videos/        # Hero section videos
```

---

## Running Locally

```bash
# Terminal 1: Backend
cd backend && python manage.py runserver

# Terminal 2: CombatHub
cd frontend && npm run dev

# Terminal 3: Combat Shop
cd shop && npm run dev
```

Visit `http://localhost:5173` (CombatHub) or `http://localhost:5174` (Combat Shop).
