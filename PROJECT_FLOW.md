# Auth Service — Project Flow

A reference map of how the pieces of this system fit together: setup order,
request lifecycle, module dependencies, and the data hierarchy they operate on.

---

## 1. Bootstrap flow (run once, in order)

```
.env
  │
  ▼
env.ts (Zod validates all required vars — fails fast if missing/invalid)
  │
  ▼
npm run migrate
  │  reads src/database/migrations/*.sql in filename order
  │  tracks applied files in the `migrations` table
  │  each file runs in its own transaction (DDL auto-commits in MySQL,
  │  so this only guarantees "mark as done" is atomic with "ran clean")
  ▼
Tables created: migrations → companies → products → company_products →
                roles → permissions → role_permissions → users →
                user_products → refresh_tokens → audit_logs
  │
  ▼
npm run seed
  │  1. Upserts SYSTEM roles: SUPER_ADMIN, COMPANY_ADMIN
  │  2. Upserts demo PRODUCT_SEEDS (HR, INVENTORY, FOOTBALL)
  │     + their PRODUCT-scoped roles (HR_ADMIN, HR_USER, ...)
  │  3. Creates the one Super Admin user (company_id = NULL),
  │     idempotent — skips if SUPER_ADMIN_EMAIL already exists
  ▼
npm run dev
  │  app.ts wires: helmet → cors → json/urlencoded → cookieParser →
  │  /health → generalRateLimiter → API_PREFIX routes → errorHandler
  ▼
Service is ready. Log in as Super Admin to get a token and proceed.
```

---

## 2. Data hierarchy (what depends on what)

```
companies                     products
    │                             │
    │                             ├── roles (scope = PRODUCT, product_id set)
    │                             │
    └── company_products ─────────┘
    │   (company owns a product entitlement)
    │
    └── users (company_id, or NULL for SUPER_ADMIN)
            │
            ├── system_role_id → roles (scope = SYSTEM: SUPER_ADMIN / COMPANY_ADMIN)
            │
            └── user_products (NOT YET BUILT)
                    │
                    ├── user_id            → must belong to the SAME company
                    ├── company_product_id │  as the company_product
                    └── role_id            → must belong to the SAME product
                                              as the company_product
```

**The rule that governs everything below `users`:** a `user_products` row is only
valid if the user's company, the company_product's company, and the role's
product all line up. MySQL foreign keys can't express that three-way check —
it has to be enforced in the service layer, at write time.

---

## 3. Module build order (what we've built, in sequence)

```
1. auth         → login, refresh (rotation + reuse detection), logout,
                   logout-all, /me
                   uses: users, roles (system_role_id)

2. companies    → create (+ atomic first COMPANY_ADMIN), list, get, update,
                   status, assign product
                   SUPER_ADMIN only

3. products     → create, list, get, update, status
                   mutating: SUPER_ADMIN only · reading: any authenticated user

4. roles        → create (PRODUCT-scoped only), list, get, update, status
                   mutating: SUPER_ADMIN only · reading: any authenticated user

5. users        → mounted at /companies/:id/users
                   create, list, get, update, status
                   SUPER_ADMIN (any company) OR COMPANY_ADMIN (own company only)
                   → introduces authorizeCompanyAccess middleware

6. product-access  ← NEXT
   (user_products) → grant/revoke a user's role on a company's product
                      SUPER_ADMIN or COMPANY_ADMIN (own company)
                      enforces: user.companyId === companyProduct.companyId
                                role.productId === companyProduct.productId
```

---

## 4. Request lifecycle (every authenticated request)

```
Client request
    │
    │  Authorization: Bearer <accessToken>
    ▼
helmet / cors / rate limiter          (app.ts, global)
    │
    ▼
authenticate                          (verifies JWT: signature, issuer,
    │                                  audience, expiry → req.auth)
    ▼
authorize([...roles])                 (checks req.auth.role is allowed)
    │
    ▼
validateParams / validateQuery        (Zod — shapes req.params / req.query)
    │
    ▼
authorizeCompanyAccess                (only on company-scoped routes —
    │                                  SUPER_ADMIN passes always;
    │                                  COMPANY_ADMIN must own :id)
    ▼
validateRequest                       (Zod — shapes + sanitizes req.body)
    │
    ▼
controller → service → repository → MySQL
    │
    ▼
                          ┌─ success → res.json({ success: true, data, ... })
    │                     │
    └── throw AppError ───┴─ errorHandler → res.json({ success: false,
                                              message, code, details? })
```

---

## 5. Auth token lifecycle

```
POST /auth/login
    │  find user → check status ACTIVE → verify password (Argon2id,
    │  always runs even for unknown email, to avoid timing leaks)
    ▼
Issue: accessToken (JWT, short-lived, signed RS256/HS256 w/ iss+aud+exp)
       refreshToken (random 512-bit hex, only its SHA-256 hash stored in DB)
    │
    ▼
Client uses accessToken on every request → authenticate middleware verifies
    │
    │  accessToken expires (e.g. 15m)
    ▼
POST /auth/refresh { refreshToken }
    │  BEGIN TRANSACTION
    │  SELECT ... FOR UPDATE  (locks the row — blocks concurrent rotation)
    │
    ├─ token not found / expired         → 401
    ├─ token already revoked (reused!)   → revoke ALL user's sessions,
    │                                       401 "all sessions logged out"
    │                                       (this is the theft-response path)
    └─ token valid                       → revoke old token,
                                            issue new access + refresh token
    │  COMMIT
    ▼
POST /auth/logout { refreshToken }      → revokes ONLY that one token
                                           (other devices stay logged in)

POST /auth/logout-all                   → revokes EVERY token for this user
                                           (all devices logged out)
```

---

## 6. What's tested vs. what's still open

```
✅ Tested end-to-end        auth (login/refresh/logout/logout-all/me)
                             companies (create+admin atomicity, 409/404/400
                               paths, cross-role 403 rejection)
                             products, roles (CRUD + status + scoping)
                             users (company-scoped CRUD +
                               authorizeCompanyAccess cross-tenant 403 test)

🔲 Not yet built             product-access (user_products) module
                             SYSTEM role management via API (seed-only for now)
                             email verification / password reset flow
                             audit_logs writing (table exists, unused)
                             JWKS / RS256 rotation (currently HS256 shared secret)
                             automated test suite (Vitest — manual curl only)
```

---

*Keep this file updated as new modules land — it's meant to answer "where does
this fit?" in under a minute, not to duplicate the detailed module docs.*
