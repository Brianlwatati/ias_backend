# IAS Backend - Central Authentication & Authorization Service

A robust, enterprise-grade **authentication and authorization service** built with Express.js and TypeScript. This service provides comprehensive user management, role-based access control (RBAC), and company management capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture & Project Flow](#architecture--project-flow)
- [Database Schema](#database-schema)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Middleware & Security](#middleware--security)
- [Error Handling](#error-handling)
- [Development](#development)
- [Contributing](#contributing)

---

## 🎯 Overview

The IAS (Identity & Access System) Backend is a centralized service designed to handle:

- **User Authentication**: Secure login/logout with JWT tokens
- **Authorization**: Fine-grained role-based and permission-based access control
- **Company Management**: Multi-tenant organization support
- **User Management**: User creation, profile updates, and company associations
- **Product Management**: Product catalog with company-specific associations
- **Role Management**: Custom role creation with permission assignment
- **Audit Logging**: Track all critical actions for compliance and debugging

This service follows a **clean architecture pattern** with clear separation of concerns and modular design principles.

---

## ✨ Features

### Authentication & Security

- ✅ JWT-based token authentication
- ✅ Refresh token mechanism for extended sessions
- ✅ Password hashing with Argon2
- ✅ Rate limiting on sensitive endpoints
- ✅ CORS protection with configurable origins
- ✅ Helmet.js for security headers
- ✅ Cookie-based token storage support

### Authorization

- ✅ Role-Based Access Control (RBAC)
- ✅ Fine-grained permission system
- ✅ Company-scoped access control
- ✅ Dynamic role assignment and management

### Data Management

- ✅ Multi-tenant company system
- ✅ User management with company associations
- ✅ Product catalog management
- ✅ User-product assignment tracking
- ✅ Audit logging for compliance

### Development Experience

- ✅ Full TypeScript support
- ✅ Type-safe validation with Zod
- ✅ Database migrations system
- ✅ Seed data for development
- ✅ Modular route organization

---

## 🛠️ Tech Stack

| Category             | Technology                     |
| -------------------- | ------------------------------ |
| **Runtime**          | Node.js                        |
| **Language**         | TypeScript                     |
| **Framework**        | Express.js v5.1.0              |
| **Database**         | MySQL 8.0+                     |
| **Authentication**   | JWT (jsonwebtoken)             |
| **Password Hashing** | Argon2                         |
| **Validation**       | Zod v4.0.0                     |
| **Security**         | Helmet.js, CORS, Rate Limiting |
| **Dev Tools**        | tsx, TypeScript Compiler       |

---

## 📁 Project Structure

```
ias_backend/
├── src/
│   ├── app.ts                    # Express app configuration
│   ├── server.ts                 # Server entry point
│   │
│   ├── config/
│   │   ├── database.ts           # Database connection & pool
│   │   └── env.ts                # Environment variables
│   │
│   ├── database/
│   │   ├── migrate.ts            # Migration runner
│   │   ├── seed.ts               # Database seeding
│   │   ├── transaction.ts        # Transaction utilities
│   │   ├── migrations/           # SQL migration files
│   │   └── seeds/                # SQL seed files
│   │
│   ├── modules/                  # Feature modules (RBAC pattern)
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.types.ts
│   │   │   ├── auth.validation.ts
│   │   │   └── auth_dumy.ts
│   │   ├── users/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── user.types.ts
│   │   │   └── user.validation.ts
│   │   ├── companies/
│   │   │   ├── company.controller.ts
│   │   │   ├── company.service.ts
│   │   │   ├── company.repository.ts
│   │   │   ├── company.routes.ts
│   │   │   ├── company.types.ts
│   │   │   └── company.validation.ts
│   │   ├── products/
│   │   │   ├── product.controller.ts
│   │   │   ├── product.service.ts
│   │   │   ├── product.repository.ts
│   │   │   ├── product.routes.ts
│   │   │   ├── product.types.ts
│   │   │   └── product.validation.ts
│   │   └── roles/
│   │       ├── role.controller.ts
│   │       ├── role.service.ts
│   │       ├── role.repository.ts
│   │       ├── role.routes.ts
│   │       ├── role.types.ts
│   │       └── role.validation.ts
│   │
│   ├── middleware/
│   │   ├── authenticate.ts       # JWT token validation
│   │   ├── authorize.ts          # Permission checking
│   │   ├── authorizeCompanyAccess.ts # Company scoping
│   │   ├── errorHandler.ts       # Global error handler
│   │   ├── rateLimiters.ts       # Rate limiting rules
│   │   ├── validateParams.ts     # Route param validation
│   │   ├── validateQuery.ts      # Query string validation
│   │   └── validateRequest.ts    # Body validation
│   │
│   ├── errors/                   # Custom error classes
│   │   ├── AppError.ts
│   │   ├── BadRequestError.ts
│   │   ├── ConflictError.ts
│   │   ├── ForbiddenError.ts
│   │   ├── NotFoundError.ts
│   │   └── UnauthorizedError.ts
│   │
│   ├── routes/
│   │   └── routes.ts             # Central route configuration
│   │
│   └── utils/
│       ├── jwt.ts                # JWT token generation/verification
│       ├── password.ts           # Password hashing utilities
│       ├── refresh-token.ts      # Refresh token management
│       └── date.ts               # Date utilities
│
├── package.json
├── tsconfig.json
├── STRUCTURE.md
└── README.md
```

---

## 🏗️ Architecture & Project Flow

### Request Flow Diagram

```
HTTP Request
    ↓
Express Middleware Stack:
  1. Helmet (Security headers)
  2. CORS (Cross-origin validation)
  3. Body Parser (JSON/URL-encoded)
  4. Cookie Parser
  5. General Rate Limiter
    ↓
Routes (Route-specific rate limiters)
    ↓
Authentication Middleware (if required)
  • Validates JWT token from headers/cookies
  • Attaches user context to request
    ↓
Authorization Middleware (if required)
  • Checks user permissions
  • Validates company access
    ↓
Request Validation Middleware
  • Body validation with Zod
  • Query/params validation
    ↓
Controller Layer
  • Parses request data
  • Calls service layer
  • Formats response
    ↓
Service Layer
  • Business logic execution
  • Data transformation
  • Transaction management
    ↓
Repository Layer
  • Database queries
  • Data access abstraction
    ↓
Database (MySQL)
    ↓
Response → Error Handler (if error) → Client
```

### Clean Architecture - Dependency Injection Pattern

Each module follows this dependency structure:

```
Router
  ↓
Controller (handles HTTP layer)
  ↓
Service (business logic)
  ↓
Repository (data access)
  ↓
Database
```

**Example: Authentication Flow**

```typescript
// 1. Router receives request
POST /auth/login
  ↓
// 2. Validation middleware validates body
validateRequest(loginSchema)
  ↓
// 3. Controller receives validated data
AuthController.login(email, password)
  ↓
// 4. Service handles authentication logic
AuthService.login()
  • Validates credentials
  • Generates tokens
  • Updates refresh token
  ↓
// 5. Repository executes database queries
AuthRepository.getUserByEmail()
AuthRepository.updateRefreshToken()
  ↓
// 6. Response sent back to client
{ accessToken, refreshToken, user }
```

---

## 🗄️ Database Schema

### Core Tables

#### 1. **migrations**

```sql
- id (PK)
- name
- executed_at
```

Tracks executed database migrations.

#### 2. **companies**

```sql
- id (PK)
- name
- email
- address
- phone
- website
- created_at
- updated_at
```

Multi-tenant organization support.

#### 3. **roles**

```sql
- id (PK)
- company_id (FK)
- name (UNIQUE per company)
- description
- created_at
- updated_at
```

Company-specific role definitions.

#### 4. **permissions**

```sql
- id (PK)
- name (UNIQUE)
- description
- resource
- action
- created_at
```

System-wide permission definitions.

#### 5. **role_permissions** (Junction Table)

```sql
- id (PK)
- role_id (FK)
- permission_id (FK)
- created_at
```

Maps permissions to roles.

#### 6. **users**

```sql
- id (PK)
- company_id (FK)
- email (UNIQUE)
- password_hash
- first_name
- last_name
- is_active
- last_login
- created_at
- updated_at
```

User accounts with company association.

#### 7. **user_roles** (Junction Table)

```sql
- id (PK)
- user_id (FK)
- role_id (FK)
- created_at
```

Maps roles to users.

#### 8. **products**

```sql
- id (PK)
- company_id (FK)
- name
- description
- price
- is_active
- created_at
- updated_at
```

Product catalog items.

#### 9. **company_products** (Junction Table)

```sql
- id (PK)
- company_id (FK)
- product_id (FK)
- created_at
```

Links products across companies.

#### 10. **user_products** (Junction Table)

```sql
- id (PK)
- user_id (FK)
- product_id (FK)
- assigned_at
- created_at
```

Tracks user access to products.

#### 11. **refresh_tokens**

```sql
- id (PK)
- user_id (FK)
- token_hash
- expires_at
- created_at
```

Stores refresh token data for session management.

#### 12. **audit_logs**

```sql
- id (PK)
- user_id (FK)
- action
- resource
- old_value
- new_value
- ip_address
- user_agent
- created_at
```

Comprehensive audit trail for compliance.

---

## 📦 Installation & Setup

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MySQL**: v8.0 or higher
- **Git**: For version control

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd ias_backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your database and application configuration (see [Environment Configuration](#environment-configuration)).

### Step 4: Setup Database

```bash
# Run migrations
npm run migrate

# Seed initial data (system roles)
npm run seed
```

### Step 5: Verify Setup

```bash
npm run typecheck
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ias_db
DB_CONNECTION_LIMIT=10

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRY=1h
REFRESH_TOKEN_SECRET=your_refresh_secret_min_32_chars
REFRESH_TOKEN_EXPIRY=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Auth Rate Limiting
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Environment
LOG_LEVEL=debug
```

### Configuration Details

| Variable               | Description                          | Default     |
| ---------------------- | ------------------------------------ | ----------- |
| `PORT`                 | Server port                          | 3000        |
| `NODE_ENV`             | Environment (development/production) | development |
| `DB_HOST`              | MySQL host                           | localhost   |
| `DB_PORT`              | MySQL port                           | 3306        |
| `JWT_SECRET`           | Secret key for JWT signing           | Required    |
| `JWT_EXPIRY`           | Token expiration time                | 1h          |
| `REFRESH_TOKEN_EXPIRY` | Refresh token validity               | 7d          |
| `CORS_ORIGIN`          | Allowed origins (comma-separated)    | \*          |

---

## 🚀 Running the Application

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000` and auto-reload on file changes.

### Production Build

Build the TypeScript code:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

### TypeScript Check

Verify type safety without building:

```bash
npm run typecheck
```

### Database Management

Run migrations:

```bash
npm run migrate
```

Seed initial data:

```bash
npm run seed
```

---

## 🔌 API Endpoints

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication Endpoints

| Method | Endpoint        | Description                   |
| ------ | --------------- | ----------------------------- |
| `POST` | `/auth/login`   | User login (email & password) |
| `POST` | `/auth/refresh` | Refresh access token          |
| `POST` | `/auth/logout`  | User logout                   |
| `GET`  | `/auth/me`      | Get current user profile      |

### User Management Endpoints

| Method   | Endpoint           | Description                |
| -------- | ------------------ | -------------------------- |
| `GET`    | `/users`           | List all users (paginated) |
| `GET`    | `/users/:id`       | Get user details           |
| `POST`   | `/users`           | Create new user            |
| `PUT`    | `/users/:id`       | Update user                |
| `DELETE` | `/users/:id`       | Delete user                |
| `POST`   | `/users/:id/roles` | Assign roles to user       |

### Company Management Endpoints

| Method   | Endpoint         | Description         |
| -------- | ---------------- | ------------------- |
| `GET`    | `/companies`     | List all companies  |
| `GET`    | `/companies/:id` | Get company details |
| `POST`   | `/companies`     | Create new company  |
| `PUT`    | `/companies/:id` | Update company      |
| `DELETE` | `/companies/:id` | Delete company      |

### Product Management Endpoints

| Method   | Endpoint        | Description         |
| -------- | --------------- | ------------------- |
| `GET`    | `/products`     | List all products   |
| `GET`    | `/products/:id` | Get product details |
| `POST`   | `/products`     | Create new product  |
| `PUT`    | `/products/:id` | Update product      |
| `DELETE` | `/products/:id` | Delete product      |

### Role Management Endpoints

| Method   | Endpoint                 | Description                |
| -------- | ------------------------ | -------------------------- |
| `GET`    | `/roles`                 | List all roles             |
| `GET`    | `/roles/:id`             | Get role details           |
| `POST`   | `/roles`                 | Create new role            |
| `PUT`    | `/roles/:id`             | Update role                |
| `DELETE` | `/roles/:id`             | Delete role                |
| `POST`   | `/roles/:id/permissions` | Assign permissions to role |

### Example Requests

#### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### Get Current User

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <access_token>"
```

#### Create Company

```bash
curl -X POST http://localhost:3000/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "name": "Tech Corp",
    "email": "info@techcorp.com",
    "address": "123 Tech St",
    "phone": "+1234567890"
  }'
```

---

## 🔒 Middleware & Security

### Helmet.js

Provides security headers:

- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

### CORS

- Configurable allowed origins
- Credentials support
- Origin validation before processing

### Rate Limiting

- **General Rate Limiter**: 100 requests per 15 minutes
- **Auth Rate Limiter**: 5 requests per 15 minutes on login/refresh
- Per-route customizable limits

### Authentication Middleware

- JWT token validation
- Automatic token extraction from headers/cookies
- Token expiry checking
- User context attachment

### Authorization Middleware

- Permission-based access control
- Role checking
- Company scope validation
- Fine-grained resource access

### Input Validation

- Zod schema validation
- Type-safe request bodies
- Query/params validation
- Custom error messages

---

## ❌ Error Handling

### Custom Error Classes

All errors extend from `AppError` base class:

```typescript
- AppError (base)
  ├── BadRequestError (400)
  ├── UnauthorizedError (401)
  ├── ForbiddenError (403)
  ├── NotFoundError (404)
  └── ConflictError (409)
```

### Global Error Handler

All errors are caught and formatted consistently:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Error Response Examples

#### Validation Error

```json
{
  "success": false,
  "error": {
    "message": "Invalid email format",
    "statusCode": 400
  }
}
```

#### Unauthorized Error

```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "statusCode": 401
  }
}
```

#### Not Found Error

```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "statusCode": 404
  }
}
```

---

## 👨‍💻 Development

### Project Scripts

```bash
# Start development server (with auto-reload)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Type checking without build
npm run typecheck

# Run database migrations
npm run migrate

# Seed database with initial data
npm run seed
```

### Adding a New Module

Follow this structure for new feature modules:

1. Create module folder: `src/modules/modulename/`
2. Create these files:
   - `modulename.types.ts` - TypeScript interfaces/types
   - `modulename.validation.ts` - Zod schemas
   - `modulename.repository.ts` - Database queries
   - `modulename.service.ts` - Business logic
   - `modulename.controller.ts` - HTTP handlers
   - `modulename.routes.ts` - Route definitions

3. Register in `src/routes/routes.ts`:

```typescript
router.use("/modulename", createModuleRouter(db));
```

### Database Migration

Add new migrations in `src/database/migrations/`:

```sql
-- 012_create_new_table.sql
CREATE TABLE new_table (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🤝 Contributing

### Guidelines

1. Follow the existing project structure
2. Maintain TypeScript type safety
3. Add validation with Zod for all inputs
4. Include error handling
5. Write descriptive commit messages
6. Test functionality manually before committing

### Pull Request Process

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Make your changes following the guidelines
3. Commit with clear messages: `git commit -m "feat: add feature name"`
4. Push to the branch: `git push origin feature/feature-name`
5. Create a Pull Request with description

### Code Style

- Use TypeScript for type safety
- Follow naming conventions:
  - **Files**: kebab-case (e.g., `auth.controller.ts`)
  - **Classes**: PascalCase (e.g., `AuthService`)
  - **Functions/Variables**: camelCase (e.g., `getUserById()`)
  - **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_USERS`)

---

## 📝 License

This project is licensed under the MIT License. See LICENSE file for details.

---

## 📞 Support & Questions

For issues, questions, or suggestions:

1. Check existing documentation
2. Review error messages and logs
3. Create an issue with detailed information
4. Contact the development team

---

## 🔄 System Workflow Summary

### User Registration Flow

```
User Request (POST /users)
  → Validation (email, password strength)
  → Hash Password (Argon2)
  → Store in Database
  → Return User (without password)
```

### Login Flow

```
User Request (POST /auth/login)
  → Validate Email Exists
  → Verify Password (Argon2)
  → Generate JWT Access Token (1h)
  → Generate Refresh Token (7d)
  → Store Refresh Token Hash
  → Return Tokens + User Info
  → Rate Limit Check
```

### Protected Request Flow

```
Client Request (with Access Token)
  → Validate Token Signature
  → Check Token Expiry
  → Extract User Info
  → Load User Permissions
  → Load Company Scope
  → Execute Business Logic
  → Return Authorized Response
```

### Permission Checking Flow

```
User Action Request
  → Load User's Roles
  → Load Role's Permissions
  → Check Required Permission
  → Verify Company Access
  → Allow/Deny Action
```

---

## 🚦 Status & Roadmap

- ✅ Core authentication system
- ✅ RBAC implementation
- ✅ Multi-tenant support
- ✅ User & company management
- 🔄 OAuth2 integration (planned)
- 🔄 Two-factor authentication (planned)
- 🔄 API documentation (Swagger/OpenAPI)
- 🔄 Unit & integration tests

---

**Built with ❤️ using Express.js and TypeScript**
