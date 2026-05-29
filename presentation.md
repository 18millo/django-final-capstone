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

---

## API Reference — Complete Endpoint Catalog

**Base URL:** `http://localhost:8000/api`  
**Auth:** Most require `Authorization: Bearer <token>` (JWT access token, 1-hour expiry)  
**Tokens:** Login returns `access` + `refresh`; refresh token lives 7 days with rotation

---

### Accounts / Auth (`/api/auth/`)

These handle user registration, authentication, 2FA, and account management.

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 1 | POST | `/auth/register/` | — | Create account. Required: `email`, `username`, `password`, `role`, `accepted_terms`. Role-specific fields: `business_name`/`location` (vendor), `specialization`/`certifications` (coach). Coach/gym_owner get auto-generated access code emailed. Returns user + tokens. |
| 2 | POST | `/auth/login/` | — | Login with `login` (email or username) + `password`. Coach/gym_owner login returns `requires_access_code: true`. TOTP users return `requires_2fa: true`. Sends "new login" email with device/IP. |
| 3 | POST | `/auth/verify-access-code/` | — | Complete login for coach/gym_owner: validate 8-char code, rotate it, return tokens. |
| 4 | POST | `/auth/verify-login/` | — | Complete login for TOTP users: validate 6-digit authenticator code, return tokens. Body: `{email, code}`. |
| 5 | POST | `/auth/refresh/` | — | Exchange refresh token for new access+refresh pair. Refresh token rotation enabled. |
| 6 | POST | `/auth/google/` | — | Sign in with Google: verify `credential` (ID token), auto-create user if new, return tokens. |
| 7 | POST | `/auth/set-username/` | Bearer | Set username for accounts created via Google (no username). `{username}` must be unique. |
| 8 | POST | `/auth/password-reset/` | — | Send password reset email. Body: `{email}`. |
| 9 | POST | `/auth/password-reset/confirm/` | — | Confirm reset: `{token, password}`. |
| 10 | POST | `/auth/retrieve-access-code/` | — | Email the user's current access code. Body: `{email}`. |
| 11 | POST | `/auth/regenerate-access-code/` | — | Generate new 8-char access code and email it. Body: `{email}`. |
| 12 | POST | `/auth/2fa/setup/` | Bearer | Generate TOTP secret + provisioning URI for authenticator app. Returns `{secret, uri}`. |
| 13 | POST | `/auth/2fa/verify/` | Bearer | Verify TOTP code from authenticator to enable 2FA. Body: `{code}`. |
| 14 | POST | `/auth/2fa/disable/` | Bearer | Disable 2FA with TOTP confirmation. Body: `{code}`. |
| 15 | POST | `/auth/email/send-code/` | Bearer | Send 6-digit email verification code (10 min expiry). Invalidates old codes. |
| 16 | POST | `/auth/email/verify/` | Bearer | Confirm email with 6-digit code. Body: `{code}`. Sets `email_verified=True`. |
| 17 | POST | `/auth/email/change/` | Bearer | Change email address. Checks uniqueness, sets `email_verified=False`, auto-sends verification. |
| 18 | POST | `/auth/phone/send-code/` | Bearer | Send SMS verification code. Body: `{phone}`. |
| 19 | POST | `/auth/phone/verify/` | Bearer | Verify phone with SMS code. Body: `{phone, code}`. |

---

### Accounts / Profile (`/api/auth/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 20 | GET | `/auth/me/` | Bearer | Get current user profile. |
| 21 | PUT | `/auth/me/` | Bearer | Full update of user profile. |
| 22 | PATCH | `/auth/me/` | Bearer | Partial update. Fields: `display_name`, `bio`, `avatar`, `phone`, `weight_class`, `height_ft`, `height_in`, `reach_in`, `stance`. |
| 23 | GET | `/auth/me/following/` | Bearer | List users the current user follows. |
| 24 | GET | `/auth/me/followers/` | Bearer | List users following the current user. |
| 25 | GET | `/auth/users/` | Bearer | List/search all platform users. Supports `?search=` param. |
| 26 | GET | `/auth/users/{id}/` | Bearer | Public profile of a specific user. |
| 27 | GET | `/auth/coaches/` | Bearer | List all coach-role users. |
| 28 | GET | `/auth/vendors/` | Bearer | List all vendor-role users. |
| 29 | GET | `/auth/vendors/{id}/` | Bearer | Detailed vendor profile (products count, followers). |
| 30 | POST | `/auth/users/{id}/follow/` | Bearer | Follow a user. |
| 31 | POST | `/auth/users/{id}/unfollow/` | Bearer | Unfollow a user. |
| 32 | POST | `/auth/users/{id}/remove-follower/` | Bearer | Remove a follower. |
| 33 | POST | `/auth/users/{id}/block/` | Bearer | Block a user. |
| 34 | GET | `/auth/blocks/` | Bearer | List blocked users. |
| 35 | GET | `/auth/site-content/{key}/` | — | Public site content (about, FAQ, etc.) by slug key. |

---

### Accounts / Social — Posts (`/api/auth/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 36 | GET | `/auth/posts/` | Bearer | List posts (feed). |
| 37 | POST | `/auth/posts/` | Bearer | Create post. Body: `{content, visibility(public/followers/private), image?}`. |
| 38 | GET | `/auth/posts/{id}/` | Bearer | Post detail with like/comment counts. |
| 39 | POST | `/auth/posts/{id}/like/` | Bearer | Toggle like on a post. |
| 40 | POST | `/auth/posts/{id}/comments/` | Bearer | Comment on post. Body: `{content}`. |
| 41 | GET | `/auth/posts/{id}/comments/list/` | Bearer | List comments for a post. |

---

### Accounts / Social — Gallery (`/api/auth/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 42 | GET | `/auth/gallery/` | Bearer | List gallery images (paginated). |
| 43 | POST | `/auth/gallery/` | Bearer | Upload image. Form-data: `image` (file) + `caption` (text). |
| 44 | GET | `/auth/gallery/{id}/` | Bearer | Gallery item detail with like/comment counts. |
| 45 | POST | `/auth/gallery/{id}/like/` | Bearer | Toggle like on gallery image. |
| 46 | POST | `/auth/gallery/{id}/comments/` | Bearer | Comment on gallery image. Body: `{content}`. |
| 47 | GET | `/auth/gallery/{id}/comments/list/` | Bearer | List comments for a gallery image. |

---

### Accounts / Search, Bookmarks, Reports (`/api/auth/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 48 | GET | `/auth/search/` | Bearer | Global search. Params: `?q=` (query) + `?type=` (users/posts/gyms). |
| 49 | POST | `/auth/bookmarks/toggle/` | Bearer | Bookmark/unbookmark content. Body: `{content_type, object_id}`. |
| 50 | GET | `/auth/bookmarks/` | Bearer | List bookmarked content. |
| 51 | POST | `/auth/reports/` | Bearer | Report inappropriate content. Body: `{content_type, object_id, reason}`. |

---

### Accounts / Messaging — Conversations (`/api/auth/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 52 | GET | `/auth/conversations/` | Bearer | List DM conversations with last message, unread count. |
| 53 | GET | `/auth/conversations/{user_id}/` | Bearer | Get conversation with a specific user (messages paginated). |
| 54 | POST | `/auth/conversations/{user_id}/send/` | Bearer | Send a message. Body: `{content, message_type(text/image/view_once)}`. |
| 55 | PATCH | `/auth/messages/{id}/edit/` | Bearer | Edit a sent message. Only within edit window. |
| 56 | DELETE | `/auth/messages/{id}/delete/` | Bearer | Delete a message. |
| 57 | POST | `/auth/messages/{id}/view-once/` | Bearer | Mark view-once message as viewed. |

---

### Accounts / Notifications (`/api/auth/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 58 | GET | `/auth/notifications/` | Bearer | List notifications (likes, follows, comments, etc.). |
| 59 | GET | `/auth/notifications/unread-count/` | Bearer | Get count of unread notifications. |
| 60 | POST | `/auth/notifications/{id}/read/` | Bearer | Mark a single notification as read. |
| 61 | POST | `/auth/notifications/read-all/` | Bearer | Mark all notifications as read. |

---

### Accounts / Groups (`/api/auth/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 62 | GET | `/auth/groups/` | Bearer | List groups (public + joined private). |
| 63 | POST | `/auth/groups/` | Bearer | Create group. Body: `{name, description, group_type(public/private)}`. |
| 64 | GET | `/auth/groups/{id}/` | Bearer | Group detail with member count. |
| 65 | PUT | `/auth/groups/{id}/` | Bearer | Full update (owner/admin only). |
| 66 | PATCH | `/auth/groups/{id}/` | Bearer | Partial update (owner/admin only). |
| 67 | DELETE | `/auth/groups/{id}/` | Bearer | Delete group (owner only). |
| 68 | POST | `/auth/groups/{id}/join/` | Bearer | Join a public group or request to join private. |
| 69 | POST | `/auth/groups/{id}/leave/` | Bearer | Leave a group. |
| 70 | GET | `/auth/groups/{id}/members/` | Bearer | List group members. |
| 71 | GET | `/auth/groups/{id}/requests/` | Bearer | List pending join requests (admin only). |
| 72 | POST | `/auth/groups/{id}/requests/{user_id}/approve/` | Bearer | Approve join request (admin only). |
| 73 | POST | `/auth/groups/{id}/requests/{user_id}/reject/` | Bearer | Reject join request (admin only). |
| 74 | POST | `/auth/groups/{id}/invite/` | Bearer | Invite user to group. Body: `{user_id}`. |
| 75 | DELETE | `/auth/groups/{id}/members/{user_id}/` | Bearer | Remove member (admin only). |
| 76 | GET | `/auth/groups/{id}/messages/` | Bearer | List group chat messages. |
| 77 | POST | `/auth/groups/{id}/messages/send/` | Bearer | Send group message. Body: `{content, message_type}`. |

---

### Accounts / Dashboards (`/api/auth/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 78 | GET | `/auth/dashboard/coach/stats/` | Bearer | Coach stats: athlete count, upcoming sessions. |
| 79 | GET | `/auth/dashboard/vendor/stats/` | Bearer | Vendor stats: product count, orders, revenue. |
| 80 | GET | `/auth/dashboard/gym/stats/` | Bearer | Gym owner stats: members, events. |

---

### Accounts / Premium (CombatHub) (`/api/auth/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 81 | GET | `/auth/premium/check/` | Bearer | Check premium status + expiry date. |
| 82 | POST | `/auth/premium/start-trial/` | Bearer | Start 30-day premium trial. |
| 83 | POST | `/auth/premium/setup-payment/` | Bearer | Save payment method. Body: `{payment_method}`. |
| 84 | POST | `/auth/premium/cancel/` | Bearer | Cancel premium subscription (grace period applies). |
| 85 | POST | `/auth/premium/toggle-insights/` | Bearer | Toggle profile insights visibility. |

---

### Accounts / Admin (`/api/auth/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 86 | GET | `/auth/admin/users/` | Bearer | List all users with filters. Admin only. |
| 87 | POST | `/auth/admin/users/{id}/role/` | Bearer | Change user role. Body: `{role}`. Admin only. |
| 88 | POST | `/auth/admin/users/{id}/toggle-messaging-block/` | Bearer | Block/unblock user from messaging. Admin only. |

---

### Products — Public (`/api/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 89 | GET | `/products/` | — | List visible products. Filters: `?sport=`, `?search=`, `?vendor=`, `?category=`, `?min_price=`, `?max_price=`. |
| 90 | GET | `/products/{id}/` | — | Product detail with images, reviews, vendor info. |
| 91 | GET | `/categories/` | — | List product categories/sports. |
| 92 | GET | `/brands/` | — | List approved product brands. |
| 93 | GET | `/drops/active/` | — | List active product drops (limited releases). |
| 94 | POST | `/drops/{id}/notify/` | — | Sign up for drop notification. Body: `{email}`. |

---

### Products — Auth Required (`/api/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 95 | GET | `/cart/` | Bearer | Get current cart with items and totals. |
| 96 | POST | `/cart/add/` | Bearer | Add item to cart. Body: `{product_id, quantity, variant_id?}`. |
| 97 | PATCH | `/cart/items/{id}/` | Bearer | Update cart item quantity. Body: `{quantity}`. |
| 98 | DELETE | `/cart/items/{id}/` | Bearer | Remove item from cart. |
| 99 | POST | `/checkout/` | Bearer | Create order from cart. Body: `{card_last_four, shipping_address}`. |
| 100 | GET | `/orders/` | Bearer | List current user's orders. |
| 101 | GET | `/orders/{id}/` | Bearer | Order detail with items and status. |
| 102 | GET | `/favorites/` | Bearer | List favorited products. |
| 103 | POST | `/products/{id}/favorite/` | Bearer | Toggle favorite on product. |
| 104 | GET | `/products/followed-vendors/` | Bearer | Products from vendors the user follows. |
| 105 | POST | `/products/{id}/comments/` | Bearer | Comment on product. Body: `{content}`. |

---

### Reviews (`/api/reviews/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 106 | GET | `/reviews/{product_id}/` | — | List reviews for a product. |
| 107 | POST | `/reviews/{product_id}/create/` | Bearer | Create review. Body: `{rating(1-5), content}`. |

---

### Gyms (`/api/gyms/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 108 | GET | `/gyms/` | — | List gyms with search/filter. |
| 109 | POST | `/gyms/` | Bearer | Create gym (gym_owner role). Body: `{name, description, city, ...}`. |
| 110 | GET | `/gyms/{id}/` | — | Gym detail. |
| 111 | PUT | `/gyms/{id}/` | Bearer | Full update (owner only). |
| 112 | PATCH | `/gyms/{id}/` | Bearer | Partial update (owner only). |
| 113 | DELETE | `/gyms/{id}/` | Bearer | Delete gym (owner only). |

---

### Events (`/api/events/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 114 | GET | `/events/` | — | List events. Filters: `?type=`, `?upcoming=true`. |
| 115 | POST | `/events/` | Bearer | Create event (vendor/coach/gym_owner). Body: `{title, event_type, start_date, end_date, location}`. |
| 116 | GET | `/events/{id}/` | — | Event detail with registrations count. |
| 117 | PUT | `/events/{id}/` | Bearer | Full update (creator only). |
| 118 | PATCH | `/events/{id}/` | Bearer | Partial update (creator only). |
| 119 | DELETE | `/events/{id}/` | Bearer | Delete event (creator only). |
| 120 | POST | `/events/{id}/register/` | Bearer | Register for event. |
| 121 | DELETE | `/events/{id}/unregister/` | Bearer | Unregister from event. |

---

### Subscriptions (`/api/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 122 | POST | `/subscribe/` | Bearer | Follow/subscribe to user or gym updates. Body: `{target_type, target_id}`. |
| 123 | POST | `/unsubscribe/` | Bearer | Unfollow/unsubscribe. Body: `{target_type, target_id}`. |

---

### Shop — Auth (`/api/shop/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 124 | POST | `/shop/auth/login/` | — | Vendor password login. Body: `{email, password}`. Returns `access` + `refresh` tokens. |
| 125 | POST | `/shop/auth/sso/` | — | Exchange CombatHub JWT for Shop JWT. Body: `{token}` (CombatHub access token). Returns shop-specific access + refresh + user. |
| 126 | POST | `/shop/auth/activate/` | — | Activate vendor invitation. Body: `{token(uuid), password, username?}`. |
| 127 | GET | `/shop/auth/me/` | Bearer | Current vendor user info + `vendor_premium` boolean. |

---

### Shop — Vendor Management (`/api/shop/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 128 | GET | `/shop/profile/` | Bearer | Get vendor profile (bio, avatar, phone). |
| 129 | PUT | `/shop/profile/` | Bearer | Full update vendor profile. |
| 130 | PATCH | `/shop/profile/` | Bearer | Partial update. Body: `{bio, phone, avatar?}`. |
| 131 | POST | `/shop/profile/remove-avatar/` | Bearer | Remove vendor avatar. |
| 132 | GET | `/shop/dashboard/` | Bearer | Vendor dashboard stats: total/revenue product/order counts. |

---

### Shop — Products (`/api/shop/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 133 | GET | `/shop/products/` | Bearer | List vendor's own products. |
| 134 | POST | `/shop/products/` | Bearer | Create product. Body: `{name, description, price, category, stock, sport, brand?}`. Premium-gated. |
| 135 | GET | `/shop/products/{id}/` | Bearer | Vendor's product detail. |
| 136 | PUT | `/shop/products/{id}/` | Bearer | Full update product. |
| 137 | PATCH | `/shop/products/{id}/` | Bearer | Partial update. Premium-gated for some fields. |
| 138 | DELETE | `/shop/products/{id}/` | Bearer | Delete product. |
| 139 | POST | `/shop/products/{id}/toggle-discount/` | Bearer | Enable/disable discount. Body: `{discount_percent}`. Premium-gated. |
| 140 | POST | `/shop/products/{id}/toggle-visibility/` | Bearer | Show/hide product from customer listings. |
| 141 | POST | `/shop/upload/` | Bearer | Upload product image. Form-data: `image` (file) + `product_id`. Premium-gated. |

---

### Shop — Orders (`/api/shop/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 142 | GET | `/shop/orders/` | Bearer | List orders containing vendor's products. |
| 143 | POST | `/shop/orders/{id}/confirm/` | Bearer | Mark order as fulfilled (confirm). |

---

### Shop — Premium (`/api/shop/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 144 | GET | `/shop/premium/plans/` | — | List available tier plans: Free ($0), Basic ($19/mo), Pro ($49/mo). |
| 145 | GET | `/shop/premium/subscription/` | Bearer | Current vendor subscription status + plan. |
| 146 | POST | `/shop/premium/subscribe/` | Bearer | Subscribe to plan. Body: `{plan_id}`. Starts 14-day trial for paid plans. |
| 147 | POST | `/shop/premium/cancel/` | Bearer | Cancel subscription (downgrades to Free). |

---

### Shop — Brands (`/api/shop/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 148 | GET | `/shop/brands/` | Bearer | List approved + own brands. |
| 149 | POST | `/shop/brands/` | Bearer | Register a new brand. Body: `{name, description}`. Auto-pending approval. |
| 150 | GET | `/shop/admin/brands/` | Bearer | Admin list all brands (approved + pending). Admin only. |
| 151 | POST | `/shop/admin/brands/{id}/toggle-approval/` | Bearer | Approve/revoke brand. Admin only. |

---

### Documentation (`/`)

| # | Method | Endpoint | Auth | Purpose |
|---|--------|----------|------|---------|
| 152 | GET | `/swagger/` | — | Interactive Swagger UI — test every endpoint directly in the browser. |
| 153 | GET | `/redoc/` | — | ReDoc API documentation with request/response schemas. |
| 154 | GET | `/swagger.json` | — | Raw OpenAPI schema (JSON) — importable into Postman/Insomnia. |
| 155 | GET | `/swagger.yaml` | — | Raw OpenAPI schema (YAML). |
| 156 | GET | `/admin/` | Admin | Django admin interface (browser only). |

---

### Quick Stats

| Category | Count | Notes |
|----------|-------|-------|
| Public (no auth) | 16 | Register, login, product listing, categories, brands, events, gyms, swagger |
| User (Bearer token) | 117 | Profile, social, messaging, cart, orders, shop vendor tools |
| Admin only | 5 | User management, role changes, brand approval |
| Shop-specific | 24 | SSO, vendor auth, product CRUD, orders, premium, brands |
| **Total** | **156** | Including Swagger, admin, and media endpoints |

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
