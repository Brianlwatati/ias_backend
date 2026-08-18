# Auth Company Lookup Flow

This explains how the login flow loads the user's company from the database and sends it back in the auth response.

## 1. The service declares a dependency

In `src/modules/auth/auth.service.ts`, the service defines an interface called `CompanyLookup`:

```ts
export interface CompanyLookup {
  findById(id: number): Promise<CompanySummary | null>;
}
```

This is not the database query itself. It is only a contract that says:

- the injected object must have a method named `findById`
- it accepts a numeric company id
- it returns either a company object or `null`

This is a dependency-injection pattern. The auth service does not care where the data comes from as long as it supports this method.

## 2. The actual implementation is the company repository

In `src/modules/auth/auth.routes.ts`, the app wires up the dependencies:

```ts
const companyRepository = new CompanyRepository(db);
const service = new AuthService(repository, companyRepository, db);
```

That means the `companies` field inside `AuthService` is actually a `CompanyRepository` instance.

The repository implements the method in `src/modules/companies/company.repository.ts`:

```ts
async findById(
  id: number,
  connection: DbConnection = this.db,
): Promise<Company | null> {
  const [rows] = await connection.query<postgresql.RowDataPacket[]>(
    `
      SELECT
          id, name, code, email, phone, status,
          created_at AS createdAt, updated_at AS updatedAt
      FROM companies
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return rows.length ? (rows[0] as Company) : null;
}
```

This SQL query is the actual database fetch. It does:

- select the company row from the `companies` table
- filter by `id = ?`
- return one matching row only
- if no row exists, return `null`

## 3. How login uses it

In `AuthService.login()`, after verifying the user and their status, the code does:

```ts
const company =
  user.companyId !== null
    ? await this.companies.findById(user.companyId)
    : null;
```

This means:

- if the user has a company id, fetch that company
- otherwise, set `company` to `null`

Then the response is built with that company included:

```ts
return buildAuthResponse(user, company, accessToken, refreshToken);
```

## 4. Why this pattern is useful

This keeps the auth service focused on authentication logic while delegating data access to the company repository. It also keeps the code testable and clean because any object with `findById()` can be injected.

## 5. Final flow summary

The data flow is:

1. User logs in
2. Auth service loads the user record from `users`
3. User has a `companyId`
4. Auth service calls `companyRepository.findById(companyId)`
5. SQL runs against the `companies` table
6. The matching company is returned
7. The company is attached to the auth response as `user.company`

This is how the company data is fetched from the database and returned to the frontend as part of the login/auth response.
