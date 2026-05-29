# CombatHub & Combat Shop — Project Proposal

## 1. Executive Summary

CombatHub is a full-stack combat sports ecosystem that unifies social networking, e-commerce, content sharing, event management, and gym discovery into a single platform. The project consists of two interconnected single-page applications — CombatHub (social platform) and Combat Shop (marketplace) — served by a common Django REST Framework backend. It is a capstone project by Levi Mwangi.

---

## 2. The Problem
The combat sports community (fighters, coaches, gym owners, equipment vendors, and fans) is poorly served by existing digital platforms. The ecosystem is fragmented across multiple disconnected services:

- **Gear and equipment** — purchased on generic e-commerce sites with no combat-specific filtering (weight class, stance, sport discipline)
- **Coaching and gym discovery** — handled through separate directories or word-of-mouth
- **Community interaction** — dispersed across generic social media platforms with no role-based identity or combat-sport context
- **Event promotion** — scattered across social media event pages, flyers, and niche forums
- **Vendor management** — combat sports equipment vendors have no purpose-built platform to manage products, orders, and brand presence alongside their community engagement
- **Content moderation** — combat sports content (sparring footage, technique discussions) is often mis-flagged on generic platforms that don't understand the context

There is **no single platform** that:

1. Recognizes the distinct **roles** in combat sports (athlete, coach, gym owner, vendor) and provides appropriate tools for each
2. Combines a **social network** with a **purpose-built marketplace** for combat sports products
3. Offers **premium monetization** tailored to combat sports vendors (tiered plans based on product limits and features)
4. Provides **SSO integration** allowing social platform users to seamlessly shop at the marketplace without creating separate accounts
5. Includes **real-time messaging**, **gym profiles**, **event management**, and **content moderation** designed for the combat sports context

---

## 3. The Problem Solved

CombatHub solves this fragmentation by delivering an all-in-one ecosystem that serves every stakeholder in the combat sports community:

### For Athletes / Fighters
- **Social networking** — Post content (text, images, video), follow other athletes/coaches/gyms, like and comment on posts, bookmark content
- **Gear shopping** — Browse a marketplace with combat-specific filters (sport: boxing/BJJ/Muay Thai/MMA/fitness, weight class, stance), add to cart, checkout with card or M-Pesa
- **Gym discovery** — Find and browse gym profiles with location, facilities, and contact information
- **Event participation** — Discover and register for competitions, workshops, seminars, and tournaments
- **Messaging** — Real-time direct messaging with other platform users via WebSockets, including view-once images
- **Content discovery** — Search across users, posts, gallery, and products from a single search endpoint

### For Coaches
- **Professional profile** — Showcase specialties, certifications, experience, and hourly rates
- **Content creation** — Create posts and share techniques, training footage, and educational content
- **Athlete discovery** — Find and follow athletes, view their profiles and activity
- **Event management** — Create and manage events (workshops, seminars) with participant registration
- **Group creation** — Create public or private groups for team/club management (premium feature)

### For Gym Owners
- **Gym profile** — List gym with name, description, location, contact details, logo, and cover image
- **Facility promotion** — Feature gym listings for visibility
- **Event hosting** — Create and manage gym-hosted events
- **Member engagement** — Connect with members through the social platform

### For Equipment Vendors
- **Product management** — Full CRUD for products with images, variants (size/color/material/weight), pricing, discounts, and stock tracking
- **Brand registration** — Register brands with admin approval workflow for credibility
- **Order management** — View and fulfill customer orders with confirmation workflow
- **Dashboard analytics** — Track product counts, order volumes, revenue, and follower counts
- **Premium subscription plans** — Scale from Free (5 products) to Basic ($19/mo, 50 products) to Pro ($49/mo, unlimited) with feature gating
- **Limited edition drops** — Create time-limited product drops with countdowns and notification systems

### For Platform Administrators
- **User management** — View all users, change roles, block messaging, manage user accounts
- **Brand approval** — Review and approve/revoke brand registrations
- **Content moderation** — Auto-flagging of profanity, hate speech, violence, and spam with review workflow
- **Reporting system** — User-submitted content reports with status tracking (pending/reviewed/dismissed/actioned)

---

## 4. Architecture

### Platform Overview

```
CombatHub (React, port 5173)     Combat Shop (React, port 5174)
         │                                │
         │        JWT Token Exchange       │
         └────────────────────────────────┘
                        │
              Django REST Framework API
              (Port 8000/api)
              ┌────────┴────────┐
           PostgreSQL          Redis
         (Primary DB)    (Cache, Sessions,
                          WebSocket broker)
```

The platform uses a **dual-frontend, single-backend** architecture:
- **CombatHub** (port 5173) — Social networking SPA for the combat sports community
- **Combat Shop** (port 5174) — Standalone marketplace SPA with customer storefront and vendor dashboard
- **Django REST Framework** (port 8000) — Shared backend serving both frontends via REST APIs and WebSocket connections

### SSO Integration

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
- Sync logout via `shop_active` cookie (`domain=localhost`) — checked on tab focus via `visibilitychange` event
- Cookie is set after login/SSO with 24h max-age, cleared on CombatHub logout

---

## 5. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Django 6.x, Django REST Framework 3.17+, Python 3.12+ |
| **Frontend (CombatHub)** | React 19, Vite 8, Tailwind CSS 4, Framer Motion 12, GSAP 3 |
| **Frontend (Combat Shop)** | React 19, Vite 8, Tailwind CSS 4, Recharts |
| **Database** | PostgreSQL 16+ |
| **Cache & Session Store** | Redis 7+ (falls back to local memory) |
| **Real-time** | Django Channels 4.3+ (WebSockets), Daphne 4.2+ (ASGI server) |
| **Auth** | SimpleJWT (access + refresh tokens with rotation), Google OAuth |
| **Task Queue** | Celery 5.6+ (with Redis broker) |
| **Payments** | Stripe 15.1, Africa's Talking 2.0 (SMS) |
| **Email** | SMTP (Gmail), SendGrid |
| **Media** | Cloudinary, Pillow |
| **Maps** | Leaflet + react-leaflet |
| **Containerization** | Docker + Docker Compose (multi-stage builds) |
| **Deployment** | Railway, Render, DigitalOcean, AWS, Fly.io |

---

## 6. App Structure & Code Organization

### 6.1 Backend Django Apps (13 apps)

```
backend/
├── accounts/          # Core: users, auth, social features
├── products/          # E-commerce: products, cart, orders
├── shop/              # Vendor management, premium, brands
├── events/            # Event management
├── gyms/              # Gym profiles
├── reviews/           # Product and gym reviews
├── subscriptions/     # Newsletter subscriptions
├── coaches/           # Coach profiles
├── exercises/         # Exercise library
├── chat/              # WebSocket consumers
├── comments/          # Generic commenting system
├── common/            # Shared permissions, pagination
├── payments/          # Payment processing (stub)
└── config/           # Django project configuration
```

### 6.2 Data Models (40+ models)

**accounts app** — Core user system:
- `User` — Custom user model with email auth, 5 roles (athlete/coach/gym_owner/vendor/admin), Google OAuth, TOTP 2FA, email verification
- `Profile` — One-to-one with User: bio, avatar, phone, weight_class, height, reach, stance, business info, premium tracking, last_seen
- `Post` / `PostLike` / `PostComment` / `PostCommentLike` — Social posts with like/dislike voting and threaded comments
- `GalleryItem` / `GalleryLike` / `GalleryComment` — Image gallery with likes and threaded comments
- `Follow` — Follower/following relationships
- `Message` — Direct messages with view-once image support
- `Group` / `GroupMember` / `GroupMessage` — Public/private groups with invite system
- `Notification` — 12 notification types (follow, profile update, new post, premium events, etc.)
- `Bookmark` — Save posts, gallery items, and products
- `Report` — Content reporting with status workflow
- `ContentFlag` — Auto-moderation flagging with regex-based detection
- `BlockedUser` — User blocking
- `IPLog` — SHA-256 hashed IP tracking on every request
- `EmailVerificationCode` / `PhoneVerificationCode` — Verification code storage
- `VendorAccessCode` — Access codes for coach/gym_owner registration
- `PaymentInfo` — Stored payment methods (M-Pesa, card)
- `SiteContent` — Dynamic site content pages
- `UsernameChange` — Username change history (max 2/month)

**products app** — Marketplace:
- `Product` — Full product model: name, description, brand, category, sport_tags (JSON), images (JSON), price, stock, limited edition, serial number, drop date, featured, vendor, is_visible, discount_active, discount_percent; has `effective_price` computed property
- `Category` — Hierarchical categories with sport_tag and ordering
- `ProductVariant` — Size, color, material, weight_oz, stock, price_override
- `Drop` — Limited edition drops with launch_time, max_quantity, countdown
- `DropNotification` — User drop notifications
- `Cart` / `CartItem` — Shopping cart with quantity management
- `Order` — Full order tracking: items (JSON), subtotal, total, status (pending/confirmed/paid/shipped/delivered/cancelled), payment method, shipping address, payment intent
- `Favorite` — User product favorites
- `ProductComment` — Product reviews with threaded replies

**shop app** — Vendor management:
- `VendorPremiumPlan` — Tiered plans: Free ($0/5 products/no discounts), Basic ($19/mo/50 products/discounts), Pro ($49/mo/unlimited/discounts+analytics)
- `VendorProfile` — Business name, location, description, lat/lng, avatar
- `VendorSubscription` — Tracks plan subscription with status (active/trialing/canceled/expired), 14-day trial period
- `VendorInvitation` — Invitation system with UUID tokens
- `Brand` — Brand catalogue with admin approval workflow

**events app**:
- `Event` — Events with type (competition/workshop/seminar/tournament/other), location, dates, max participants, entry fee, poster
- `EventParticipant` — Registration tracking

**gyms app**:
- `Gym` — Gym profiles with owner, contact details, location, logo, cover image, featured flag

**reviews app**:
- `ProductReview` — Product ratings and reviews

**subscriptions app**:
- `NewsletterSubscriber` — Email newsletter subscriptions

### 6.3 API Endpoints (100+ endpoints)

**Authentication** (`/api/auth/`):
- `register/` — User registration with email validation (DNS MX check)
- `login/` — Email or username login; blocks username login for vendor/coach/gym_owner
- `verify-login/` — TOTP 2FA verification step
- `google/` — Google OAuth sign-in/sign-up
- `verify-access-code/` — Access code verification for coach/gym_owner
- `password-reset/` / `password-reset/confirm/` — Password reset flow
- `refresh/` — JWT token refresh (rotation + blacklist)
- `2fa/setup/` / `2fa/verify/` / `2fa/disable/` — TOTP management

**Users** (`/api/auth/`):
- `me/` — Current user profile (GET, PATCH)
- `users/` — User listing with search, filter by role
- `users/<id>/` — Public profile view
- `users/<id>/follow/` / `unfollow/` — Follow/unfollow
- `users/<id>/block/` — Block user
- `users/<id>/remove-follower/` — Remove follower

**Social** (`/api/auth/`):
- `posts/` — Post CRUD with like/dislike, comments
- `gallery/` — Gallery CRUD with likes, comments
- `search/` — Cross-resource search (users, posts, gallery, products)
- `bookmarks/` / `bookmarks/toggle/` — Bookmark management
- `notifications/` — Notification listing, unread count, mark read
- `reports/` — Content reporting
- `conversations/` — Message conversations
- `conversations/<id>/send/` — Send message
- `messages/<id>/edit/` / `delete/` / `view-once/` — Message management

**Groups** (`/api/auth/`):
- `groups/` — CRUD with join/leave, invite, member management
- `groups/<id>/messages/` / `messages/send/` — Group messaging

**Premium** (`/api/auth/`):
- `premium/start-trial/` — 30-day CombatHub premium trial
- `premium/check/` — Premium status check
- `premium/setup-payment/` — Payment setup
- `premium/cancel/` — Cancel premium

**Admin** (`/api/auth/`):
- `admin/users/` — List all users
- `admin/users/<id>/role/` — Change user role
- `admin/users/<id>/toggle-messaging-block/` — Block/unblock messaging

**Products** (`/api/`):
- `products/` — Product listing with filters (category, brand, sport, price, featured, limited)
- `products/<id>/` — Product detail
- `products/<id>/favorite/` — Toggle favorite
- `categories/` — Category listing
- `drops/active/` — Active limited drops
- `drops/<id>/notify/` — Drop notification signup
- `cart/` / `cart/add/` / `cart/items/<id>/` — Cart management
- `checkout/` — Order creation
- `orders/` / `orders/<id>/` — Order history

**Shop** (`/api/shop/`):
- `shop/auth/login/` — Vendor-only login
- `shop/auth/sso/` — SSO token exchange
- `shop/auth/activate/` — Vendor invitation activation
- `shop/dashboard/` — Vendor dashboard stats
- `shop/products/` — Vendor product CRUD
- `shop/products/<id>/toggle-discount/` — Discount toggle
- `shop/products/<id>/toggle-visibility/` — Visibility toggle
- `shop/upload/` — Product image upload
- `shop/orders/` — Vendor order listing
- `shop/orders/<id>/confirm/` — Order confirmation
- `shop/premium/plans/` — Premium plan listing
- `shop/premium/subscription/` — Current subscription
- `shop/premium/subscribe/` — Subscribe to plan
- `shop/premium/cancel/` — Cancel subscription
- `shop/brands/` — Brand CRUD
- `shop/admin/brands/` — Admin brand listing
- `shop/admin/brands/<id>/toggle-approval/` — Brand approval toggle

**Events** (`/api/events/`):
- Event CRUD with register/unregister

**Gyms** (`/api/gyms/`):
- Gym CRUD

**Reviews** (`/api/reviews/`):
- Product review create/list

### 6.4 Permission System

```
common/permissions.py:
  IsAdmin        — role == 'admin'
  IsCoach        — role == 'coach'
  IsVendor       — role == 'vendor'
  IsSeller       — role in (vendor, coach, gym_owner)
  IsVendorOrReadOnly — read: anyone; write: vendor
  IsPremium      — authenticated + is_premium_active()
  IsPremiumOrHigher — same as IsPremium

shop/views.py:
  HasVendorPremium — authenticated + vendor + active VendorSubscription
```

### 6.5 WebSocket Consumers

- **ChatConsumer** (`ws/chat/<user_id>/`) — Real-time direct messaging with typing indicators, read/delivered receipts, view-once images
- **NotificationConsumer** (`ws/notifications/`) — Real-time notification stream (new messages, follows)
- Rooms: `chat_{sorted_ids}` for DMs, `user_{id}_notifications` for notifications

### 6.6 Celery Tasks

- `send_email_async` — Generic async email sending
- `send_welcome_email_async` — Welcome email on registration
- `send_access_code_email_async` — Access code email
- `create_notifications_async` — Bulk notification creation
- `log_event_async` — Async logging

### 6.7 Signal System

- **accounts/signals.py**: Profile creation on user signup, welcome email, content auto-flagging (profanity/hate speech/violence/spam), follower notifications for new posts/gallery, cache invalidation, custom signals (`content_flagged`, `premium_activated`, `premium_expired`, `order_completed`, `user_registered`)
- **products/signals.py**: Cache invalidation on product save/delete
- **gyms/signals.py**: Cache invalidation on gym save/delete
- **events/signals.py**: Cache invalidation on event/participant save/delete
- **reviews/signals.py**: Cache invalidation on review save/delete
- **subscriptions/signals.py**: Cache invalidation on subscribe/unsubscribe

### 6.8 Frontend Structure

**CombatHub** (`frontend/src/`):
- **Pages** (45+): Home, Login, Register, VerifyLogin, VerifyAccessCode, TotpSetup, UsernameSetup, EmailVerify, ForgotPassword, ResetPassword, Settings, ProfileEdit, PublicProfile, Forum, PostDetail, CreatePost, Gallery, GalleryDetail, Community, Messages, Groups, GroupDetail, Events, EventDetail, EventForm, MyEvents, Shop, ProductDetail, Cart, Checkout, OrderHistory, OrderDetail, VendorDashboard, VendorProductForm, VendorAbout, SellerOrders, PaymentSetup, Premium, GymOwnerDashboard, CoachDashboard, AdminPage, About, ContactUs, Help, Terms, CommunityGuidelines, Newsletter
- **Layouts**: MainLayout (header + sidebar), AuthLayout
- **Providers**: AuthProvider (JWT + user state), CartProvider, ThemeProvider
- **Components**: Button, Input, Spinner, Skeleton, Toast, Modal, EventCard, GoogleLoginWrapper, Reveal, ReportModal, EmojiPicker, PremiumBadge, MapPicker

**Combat Shop** (`shop/src/`):
- **Pages** (30): Landing, Login, Activate, AccessGate, Shop, Products, ProductList, ProductView, ProductForm, Cart, Checkout, Orders, OrderDetail, OrderHistory, CustomerOrderDetail, Dashboard, Categories, Brands, Settings, CustomerSettings, VendorPremium, VendorEvents, Gallery, Contact
- **Layouts**: ShopLayout (vendor sidebar + header), CustomerLayout (customer nav)
- **Providers**: AuthProvider (SSO + vendor login), CartProvider, ThemeProvider
- **Components**: Icons.jsx (30+ SVG icon components)

---

## 7. Key Features in Detail

### 7.1 Role-Based Access Control
Five user roles with distinct capabilities enforced at both API (permission classes) and UI (route guards, conditional rendering) levels:
- **Athlete**: Browse marketplace, cart, checkout, social posting, messaging
- **Coach**: Create posts (premium), groups (premium), events, coach profile
- **Gym Owner**: Gym management, events, groups, vendor access
- **Vendor**: Product CRUD, order management, brand registration, premium plans
- **Admin**: User management, brand approval, content moderation

### 7.2 Vendor Premium Subscription System
Three-tier plan model:
| Plan | Price | Max Products | Discounts | Analytics |
|------|-------|-------------|-----------|-----------|
| Free | $0 | 5 | No | No |
| Basic | $19/mo | 50 | Yes | No |
| Pro | $49/mo | Unlimited | Yes | Yes |

- Auto-assigned to Free plan on first check
- 14-day free trial on paid plans (status='trialing')
- `HasVendorPremium` gates: product creation, editing, deletion, image upload, discount toggling
- Subscription lifecycle: trialing → active → canceled/expired

### 7.3 Content Moderation
- Auto-flagging via regex patterns for profanity, hate speech, violence, spam
- Flagged content status: pending → auto_moderated/approved/dismissed
- User reporting system with reason categories
- IP logging with SHA-256 hashing

### 7.4 Combat-Specific Taxonomies
- Sport tags: boxing, BJJ (Brazilian Jiu-Jitsu), Muay Thai, MMA (Mixed Martial Arts), fitness
- Weight classes, stances (orthodox/southpaw/switch), reach, height
- Products filterable by all combat-specific dimensions

### 7.5 Security
- JWT with access token (1h) + refresh token (7d) rotation and blacklisting
- TOTP two-factor authentication
- Email verification (6-digit codes)
- Phone verification via Africa's Talking
- Rate limiting: 100k/day authenticated, 120/hr anonymous, 3/hr register, 5/hr subscribe
- CORS whitelisting
- SHA-256 hashed IP tracking
- Access codes for coach/gym_owner registration
- Content flagging and reporting

### 7.6 Design System (Combat Shop)
- Liquid-glass cards with `backdrop-filter: blur()`
- Nike red (#e5101d) accent color on dark theme
- CSS variable-based light/dark mode toggling
- Desktop sidebar + mobile drawer for vendor navigation
- Animated transitions (slideUp, slowZoom, fadeIn, scaleIn)
- Background music auto-play from MP3 assets
- Hero video carousel with Pexels fallback

---

## 8. Target Audience

| User Role | Needs Served |
|-----------|-------------|
| **Athletes / Fighters** | Social networking, gear shopping, gym discovery, event participation, messaging |
| **Coaches** | Profile showcasing, athlete discovery, service promotion, event management |
| **Gym Owners** | Gym listing, facility promotion, member recruitment, event hosting |
| **Equipment Vendors** | Product sales, brand management, order fulfillment, premium scaling |
| **Combat Sports Fans** | Content discovery, community engagement, event attendance |
| **Platform Administrators** | User management, brand approval, content moderation |

---

## 9. Scope & Feasibility

The project is fully implemented and functional:

- **Backend**: 13 Django apps, 40+ database models, 100+ API endpoints, WebSocket consumers, Celery tasks, signal handlers, comprehensive permission system
- **CombatHub Frontend**: 45+ pages, full routing, auth flows, messaging, groups, marketplace, premium, admin tools
- **Combat Shop Frontend**: 24 pages, customer storefront, vendor dashboard, SSO integration, cart/checkout, premium plans, brand management, gallery
- **Testing**: Both frontends build successfully with zero errors

### Running Locally

```bash
# Terminal 1: Backend
cd backend && python manage.py runserver

# Terminal 2: CombatHub
cd frontend && npm run dev

# Terminal 3: Combat Shop
cd shop && npm run dev
```

Or with Docker: `docker compose up --build -d`

---

## 10. Deployment

The project includes Docker configuration for production deployment:
- **Backend**: Python 3.12 + Daphne (ASGI) with automated migrations, static collection, and server startup
- **Frontend**: Multi-stage Docker build (Node build → Nginx serve) with API reverse proxy
- **Supporting services**: PostgreSQL and Redis
- **Platform targets**: Railway, Render, DigitalOcean App Platform, AWS ECS, Fly.io

---

## 11. Conclusion

CombatHub addresses a genuine gap in the digital landscape for combat sports. By uniting social networking, e-commerce, event management, and professional profiles into a single ecosystem with role-based access, it provides the combat sports community with a purpose-built platform that no existing solution offers. The two-application architecture with SSO integration demonstrates sophisticated web development patterns while delivering practical value to a passionate and underserved user base. With a comprehensive backend API, two fully-featured frontend applications, real-time communication, content moderation, and a tiered premium monetization system, CombatHub is a complete, production-ready platform.
