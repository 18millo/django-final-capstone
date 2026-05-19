# CombatHub — Capstone Presentation Guide

## Project Overview

CombatHub is a full-stack combat sports ecosystem where athletes, coaches, gym owners, and vendors connect. It combines a social network (posts, gallery, messaging) with an e-commerce marketplace, premium subscriptions, and content moderation — all behind role-based access control.

**Stack:** Django REST Framework (backend) + React + Vite (frontend), PostgreSQL, Redis, WebSockets (Django Channels)

---

## Suggested Presentation Outline (5-7 min)

### 1. Problem Statement (30s)
- Combat sports community is fragmented — gear on one site, coaching on another, community on a third
- No unified platform that serves all roles (athlete, coach, gym owner, vendor)
- Existing platforms lack premium gating, content moderation, combat-specific features

### 2. Solution Architecture (1 min)

```
Frontend (React + Vite)  ←→  REST API (DRF)  ←→  PostgreSQL
     ↕ WebSockets                    ↕ Celery
  Real-time chat                 Emails, notifications
     ↕ Redis cache
  Session + API caching
```

- **Backend:** Django REST Framework with JWT auth, role-based permissions, throttling
- **Frontend:** React with Framer Motion animations, Tailwind CSS, GSAP
- **Real-time:** Django Channels for DM notifications
- **Database:** PostgreSQL with proper indexes, select_related/prefetch_related

### 3. Key Features (1.5 min)

| Feature | Implementation |
|---------|---------------|
| Role-based auth (5 roles) | Custom User model with `role` field + Django Groups |
| E-commerce (shop/cart/checkout) | Product model with variants, Cart, Order, Stripe-ready |
| Social (posts, gallery, likes, comments) | Post/GalleryItem models, follower system, favorites |
| Direct messaging | WebSocket consumer with view-once image support |
| Premium subscriptions | 30-day trial → 7-day grace → automatic removal |
| Content moderation | Regex-based flagging (profanity, violence, spam) |
| IP tracking | SHA-256 hashed IP logs on every request |
| Email verification | 6-digit code + Gmail SMTP |
| Phone verification | Africa's Talking sandbox (ready for production) |

### 4. Premium System Deep Dive (1 min)

The premium flow:
1. User registers → `Profile` created with `is_premium = False`
2. User sets up payment (M-Pesa or card) → `PaymentInfo` saved → `is_premium = True`, 30-day trial starts
3. Every permission check calls `is_premium_active()` on Profile
4. When trial expires, the next check auto-grants a 7-day grace period and creates `PREMIUM_EXPIRING` notification
5. When grace ends, premium is removed and `PREMIUM_EXPIRED` notification fires
6. `IsSeller` permission blocks vendor/coach/gym_owner dashboards if premium expired

### 5. Security (1 min)

- **Authentication:** JWT (SimpleJWT), access + refresh tokens, auto-rotation
- **Authorization:** `IsAuthenticated`, `IsAuthenticatedOrReadOnly`, custom `IsSeller`, `IsPremium`
- **Rate limiting:** 1000/day authenticated, 30/hr anonymous, 5/hr for newsletter
- **CORS:** Whitelisted frontend origins only
- **Input validation:** DRF serializers + custom validators (email domain check, profanity filter)
- **IP hashing:** SHA-256, never stored plain text
- **Throttle scopes:** Per-view custom rates for sensitive endpoints

### 6. Signals & Caching (1 min)

**Signals pattern (from Django docs best practices):**
```python
# accounts/signals.py — every app gets its own signals module
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=Post)
def auto_flag_and_notify_post(sender, instance, created, **kwargs):
    flag_content(...)
    notify_followers(...)
    cache.delete('recent_posts')
```

**Why signals instead of putting code in views?**
- Single Responsibility — views handle HTTP, signals handle side effects
- Decoupled — multiple apps can react to one event independently
- Reusable — same signal fires whether the model is saved via API, admin, or shell

**Cache strategy:**
- Redis auto-detected (falls back to local memory)
- Session engine uses cache for speed
- Category/Brand lists cached 30 min
- Cache invalidated on every post_save/post_delete via signals

### 7. Challenges & Solutions (30s)

| Challenge | Solution |
|-----------|----------|
| Circular imports in signals | Moved all signal handlers to dedicated `signals.py`, imported in `apps.py.ready()` |
| Grace period logic | Embedded in `is_premium_active()` model method so it fires regardless of entry point |
| WebSocket URL hardcoding | Moved to `import.meta.env.VITE_WS_URL` |
| View-once image privacy | `view_once` flag on Message model + backend validates `viewed` status + Instagram-style lightbox |

### 8. Future Improvements (30s)

- Switch from Africa's Talking sandbox to live SMS for phone verification
- Implement actual payment processing (Stripe/M-Pesa API)
- Add Redis-based channel layer for production WebSocket scaling
- Break frontend into code-split chunks (currently >500KB main bundle)
- Add Celery worker for async email/notification tasks

---

## Q&A — Likely Teacher Questions & Answers

### Q1: "Explain the premium grace period — how does it work automatically without a cron job?"

**A:** The grace period logic lives inside `Profile.is_premium_active()` — the model method that every permission check calls. It's not a separate endpoint or cron job. When the method detects that `premium_expires_at` has passed but `premium_grace_end` hasn't, it auto-sets the 7-day grace window and creates a `PREMIUM_EXPIRING` notification on the fly. This guarantees the grace logic always runs, regardless of how premium status is checked (permissions, API views, templates).

```python
def is_premium_active(self):
    now = timezone.now()
    if self.premium_expires_at and now > self.premium_expires_at:
        if not self.premium_grace_end:
            self.premium_grace_end = now + timedelta(days=7)
            self.save(update_fields=['premium_grace_end'])
            Notification.objects.create(...)
        if self.premium_grace_end and now > self.premium_grace_end:
            self.is_premium = False
            self.save(update_fields=['is_premium'])
            Notification.objects.create(...)
            return False
    return self.is_premium
```

### Q2: "How do you prevent the notification-follower loop from overwhelming the database?"

**A:** When a user creates a post, the signal queries followers and creates Notification objects in a loop. For production, this would be offloaded to a Celery task already defined in `config/tasks.py` (`create_notifications_async`). The signal currently runs synchronously, which is acceptable at this scale. The `bulk_create` pattern in the task would batch-create notifications in a single query.

### Q3: "Why did you move signals from models.py to separate files?"

**A:** Following the Django documentation's recommended pattern. When signals are in models.py, they can cause circular import issues (the models file imports from other modules, but signals also reference those models). A dedicated `signals.py` per app, imported in `apps.py.ready()`, ensures clean separation:
- `models.py` → only model definitions
- `signals.py` → only side effects
- `apps.py` → wires them together

### Q4: "What's the difference between authentication and authorization in your project?"

**A:** Authentication is handled by SimpleJWT — the user presents a token to prove identity. Authorization is handled by DRF permission classes:
- `IsAuthenticated` — checks that the user is logged in
- `AllowAny` — public access (shop, newsletter)
- Custom `IsSeller` — checks that the user has role `vendor`/`coach`/`gym_owner` AND has active premium
- Object-level — update/delete views check `if instance.owner != request.user` to prevent modifying others' data

### Q5: "How does your content moderation work?"

**A:** We have a `moderation.py` module with regex patterns for profanity, violence, hate speech, and spam. When content is created (post, comment, gallery, profile update), the `post_save` signal calls `flag_content()`, which checks the content against these patterns. If a match is found, a `ContentFlag` record is created with status `pending`. An admin can review these in the Django admin panel and approve or dismiss them. Auto-moderated flags trigger a `content_flagged` custom signal that logs the event.

### Q6: "Explain your caching strategy — why cache the category list but not the product list?"

**A:** Categories change rarely (admins add them), so a 30-minute cache is safe and eliminates a database query on every shop page load. The product list is harder to cache because it's personalized — authenticated users see their favorite status on each product, and unauthenticated users don't. Caching the full product list would serve stale or wrong data. A better approach would be to cache only the unauthenticated version or use fragment-level caching.

### Q7: "How do you handle file uploads and where are media files stored?"

**A:** Currently, media files (avatars, gallery images, product images) are stored locally in a `media/` directory served by Django in development. The deployment plan is to switch to Cloudinary (credentials already in `.env`) so files are served via CDN and don't burden the application server. Images use the `ImageField` with `upload_to` organized by content type (`avatars/`, `gallery/`, `product_images/`, `gym_logos/`).

### Q8: "What would you do differently if you were to rebuild this from scratch?"

**A:** Three things:
1. **Start with Celery from day one** — Several signal handlers (email, bulk notifications) run synchronously and block the response. Building with Celery baked in from the start would avoid the migration cost.
2. **Use a proper task queue for notifications** — The current follower notification loop creates notifications one by one inside a Python for-loop. Using `bulk_create` with a Celery task would be far more efficient at scale.
3. **Code-split the frontend earlier** — The main JS bundle is over 500KB because everything is eagerly imported. With React.lazy() and dynamic imports, each page could load independently.

### Q9: "Why did you choose JWT over session authentication?"

**A:** JWT's token-based approach is better suited for this architecture because:
- The API serves both a React SPA and potential mobile apps
- No CSRF token needed (token is in Authorization header, not a cookie)
- Stateless — no server-side session storage required
- Refresh token rotation reduces the window for token theft
- SimpleJWT provides built-in token blacklisting for logout

### Q10: "How is the WebSocket connection established and secured?"

**A:** When a user logs in, the frontend stores the JWT access token. The MainLayout component establishes a WebSocket connection to `ws://localhost:8000/ws/notifications/?token=...`, passing the token as a query parameter. The Django Channels consumer (`NotificationConsumer`) validates the token on connect, authenticates the user, and adds them to a notification group. If the connection drops, it auto-reconnects after 5 seconds. The WebSocket URL is configurable via `VITE_WS_URL` in `.env`.

### Q11: "How do you prevent users from accessing other users' private data?"

**A:** Every view that handles user-specific data enforces ownership checks:
- **Object-level permissions:** Update/delete views for events, gyms, products check `if instance.owner != request.user` before allowing mutation
- **QuerySet filtering:** List views for orders, messages filter by `user=request.user`
- **DRF permissions:** `IsAuthenticated` ensures unauthenticated users can't access private endpoints
- **Role gating:** `SellerRoute` and `CoachRoute` on the frontend redirect unauthorized users

### Q12: "Tell me about a difficult bug you fixed and how you solved it."

**A:** A 500 error on the Home page was caused by mixing string concatenation with JSX — something like `{user.name + <span>badge</span>}`. React can't render a string + JSX element as a single expression. The fix was wrapping the mixed content in a `<></>` fragment. This was subtle because the error message pointed to the wrong line in the bundle, and the dev server didn't show it initially due to Hot Module Replacement masking the refresh. I traced it by checking the browser network tab, found the 500, and inspected the backend logs to confirm it was a template rendering error, not an API failure.

### Q13: "How would you monetize this app? What's missing?"

**A:** The architecture is ready — premium gating, payment info collection, trial/grace/expiry cycle. To actually collect money:

**Payment processing — the main blocker:**
- Stripe keys exist but no actual charge call — need to build a subscription flow that calls Stripe's API to create a recurring payment, not just save card details
- M-Pesa (Daraja API) for the Kenyan market — phone numbers are collected, but the STK Push integration isn't built yet. Requires a Safaricom developer account, business shortcode, and passkey
- Recurring billing is manual (30-day trial expiry) — Stripe subscription objects or M-Pesa recurring payments would automate it

**Pricing structure:**
```
Athlete Premium:   $5/mo   — early access, no ads, priority support
Seller Premium:    $15/mo  — product listings, analytics dashboard
Gym Premium:       $25/mo  — unlimited coaches, event management
```

**Marketplace commission (alternative model):**
Rather than (or in addition to) flat premiums, take a percentage cut on vendor sales — calculated on order completion and stored as platform revenue.

**Go-live checklist:**
- Switch Africa's Talking sandbox → live account for real SMS delivery
- HTTPS + SSL certificate + `SECURE_SSL_REDIRECT`
- Custom email domain (not Gmail) via SendGrid or SES
- Cloudinary for production media hosting (already configured)
- Redis on the production server for caching + channel layers

**Legal (Kenya):**
- ToS must cover paid subscriptions, refunds (Consumer Protection Act), auto-renewal
- Privacy Policy — payment data retention, third-party processors
- KRA compliance — VAT registration if earning >5M KES/yr, 1.5% digital services tax
- Data Protection Act — register with ODPC if processing >1,500 data subjects
- 14-day cooling-off period for digital services under Kenyan consumer law

**Minimum viable monetization path (2-3 weeks of work):**
1. Build actual Stripe charge flow in `PaymentSetupView`
2. Launch single `athlete` tier at $5/mo
3. Add email receipts (SendGrid is already in requirements)
4. Add M-Pesa after Stripe works (higher adoption in Kenya)

---

## Deployment — Docker Setup

### Project Structure

```
combathub/
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh       # Runs migrations, collectstatic, starts Daphne
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile          # Multi-stage build (npm build → nginx)
│   └── nginx.conf          # Reverse proxy to backend
├── docker-compose.yml      # All services orchestrated
└── PRESENTATION.md
```

### Docker Compose Services

| Service | Image | Purpose |
|---------|-------|---------|
| `backend` | Python 3.12 + Daphne | Django ASGI app, serves API, admin, WebSockets |
| `frontend` | Nginx | Serves React SPA, reverse-proxies API/WS to backend |
| `db` | PostgreSQL 16 | Persistent database |
| `redis` | Redis 7 | Cache backend, session store, Celery broker |

### How to Run

```bash
# Build and start everything
docker compose up --build -d

# Run migrations manually (if needed)
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser

# View logs
docker compose logs -f
```

### What Each Dockerfile Does

**Backend** (`backend/Dockerfile`):
1. Starts from `python:3.12-slim`
2. Installs system deps (`libpq-dev` for psycopg2)
3. Installs Python packages from `requirements.txt`
4. Copies all source code
5. Runs `entrypoint.sh` on container start (migrate → collectstatic → daphne)

**Frontend** (`frontend/Dockerfile`):
1. **Build stage:** Uses `node:20-alpine`, runs `npm ci && npm run build`
2. **Serve stage:** Copies built files to `nginx:alpine`
3. Nginx serves static files and proxies `/api/`, `/admin/`, `/media/`, `/ws/` to the backend

### Nginx Config Highlights

```nginx
# /api/*  →  backend:8000/api/*    # REST API
# /admin/* →  backend:8000/admin/*  # Django Admin
# /ws/*   →  backend:8000/ws/*      # WebSockets (with Upgrade headers)
# /*      →  index.html              # SPA fallback
```

### Hosting Options

| Provider | Cost | Best for | Notes |
|----------|------|----------|-------|
| **Railway** | Free–$5/mo | Quick launch | Built-in PostgreSQL + Redis, easy Docker deploy, free credits |
| **Render** | Free–$7/mo | Prototyping | Free PostgreSQL, auto HTTPS, simple Docker deploy |
| **DigitalOcean App Platform** | $12/mo | Production | Managed DB + Redis, static IP, good Kenyan latency |
| **AWS (ECS + RDS)** | $30+/mo | Scale | Full control, auto-scaling, complex setup |
| **Vercel (frontend)** | Free | Frontend only | Auto HTTPS, CDN, but backend must be separate |
| **Fly.io** | Free–$5/mo | Good balance | Global regions, PostgreSQL, Docker-native, cheap |

### Environment Variables for Production

```bash
# backend/.env (production)
DEBUG=False
SECRET_KEY=<generate-a-new-random-key>
ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
DB_HOST=db                          # Docker service name, or managed DB host
DB_NAME=capstone
DB_USER=levi
DB_PASSWORD=<strong-password>
REDIS_HOST=redis                    # Docker service name, or Redis Cloud host
EMAIL_HOST=smtp.sendgrid.net        # Custom domain email
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=<sendgrid-key>
```

### Deploy Steps (Railway — simplest)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create project and database
railway init
railway add postgres
railway add redis

# 4. Set environment variables
railway env set DEBUG=False
railway env set SECRET_KEY=...
railway env set ALLOWED_HOSTS=combathub.up.railway.app

# 5. Deploy
railway up
```

Railway auto-detects the `docker-compose.yml` and deploys all services. It provides a public URL with auto-HTTPS.

### Deploy Steps (DigitalOcean — production)

1. Create a Droplet (Ubuntu 22.04, $12/mo)
2. Install Docker + Docker Compose
3. Clone the repo
4. Create `.env` with production values
5. `docker compose up -d`
6. Set up Nginx/Caddy on the host as a reverse proxy with Let's Encrypt SSL
7. Point your domain to the droplet IP


