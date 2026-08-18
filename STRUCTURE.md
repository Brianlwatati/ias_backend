# Project structure

Tree of files and folders in the repository (excluding node_modules).

```
./
├─ .env.example
├─ .gitignore
├─ package.json
├─ tsconfig.json
├─ STRUCTURE.md
├─ interview
│  └─ practiceone.md
├─ src
│  ├─ app.ts
│  ├─ server.ts
│  ├─ middleware
│  │  ├─ authenticate.ts
│  │  ├─ authorize.ts
│  │  ├─ errorHandler.ts
│  │  └─ validateRequest.ts
│  ├─ config
│  │  ├─ database.ts
│  │  └─ env.ts
│  ├─ database
│  │  ├─ migrate.ts
│  │  ├─ seed.ts
│  │  ├─ transaction.ts
│  │  ├─ migrations
│  │  │  ├─ 001_create_migrations_table.sql
│  │  │  ├─ 002_create_companies_table.sql
│  │  │  ├─ 003_create_products_table.sql
│  │  │  ├─ 004_create_company_products_table.sql
│  │  │  ├─ 005_create_roles_table.sql
│  │  │  ├─ 006_create_permissions_table.sql
│  │  │  ├─ 007_create_role_permissions_table.sql
│  │  │  ├─ 008_create_users_table.sql
│  │  │  ├─ 009_create_user_products_table.sql
│  │  │  ├─ 010_create_refresh_tokens_table.sql
│  │  │  ├─ 011_create_audit_logs_table.sql
│  │  │  └─ 013_fix_roles_uniqueness.sql
│  │  └─ seeds
│  │     └─ 001_system_roles.sql
│  ├─ modules
│  │  └─ auth
│  │     ├─ auth.controller.ts
│  │     ├─ auth.repository.ts
│  │     ├─ auth.service.ts
│  │     ├─ auth.types.ts
│  │     ├─ auth.validation.ts
│  │     ├─ auth.utils.ts
│  │     └─ auth.routes.ts
│  ├─ routes
│  │  └─ routes.ts
│  ├─ errors
│  │  ├─ AppError.ts
│  │  ├─ BadRequestError.ts
│  │  ├─ ConflictError.ts
│  │  ├─ ForbiddenError.ts
│  │  ├─ NotFoundError.ts
│  │  └─ UnauthorizedError.ts
│  └─ utils
│     ├─ refresh-token.ts
│     ├─ password.ts
│     ├─ jwt.ts
│     └─ date.ts
```


> Database backend: PostgreSQL (the original MySQL driver and MySQL-specific SQL have been removed).
