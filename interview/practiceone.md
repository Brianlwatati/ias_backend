# Interview Practice Questions and Answers

This guide contains 100+ interview questions and answers based on the concepts used in this backend auth-service project. The questions cover API design, authentication, JWT, MySQL, TypeScript, Express middleware, validation, and security.

---

## 1. Architecture and Design

1. **Q:** What is the primary purpose of this project?
   **A:** It is an authentication and authorization backend service that manages login, refresh, session invalidation, and role-based access, using Express, MySQL, JWT, and TypeScript.

2. **Q:** Which folder contains the application entrypoint?
   **A:** `src/server.ts` contains bootstrap logic, while `src/app.ts` configures Express middleware and routes.

3. **Q:** How does this project separate concerns?
   **A:** It uses controllers for HTTP handling, services for business logic, repositories for database interaction, middleware for request processing, and config files for environment and database setup.

4. **Q:** Why is dependency injection used in `auth.routes.ts`?
   **A:** To instantiate repository, service, and controller in order and pass shared dependencies cleanly, improving testability and modularity.

5. **Q:** What is the purpose of `src/database/migrate.ts`?
   **A:** It executes SQL migration files in order, tracks applied migrations, and ensures database schema updates are applied safely.

6. **Q:** Why is `src/database/transaction.ts` needed?
   **A:** It wraps multiple database operations in a transaction so changes are committed only when all steps succeed.

7. **Q:** What is the `src/config/env.ts` module used for?
   **A:** To load environment variables and provide typed configuration values to the application.

8. **Q:** Why does the project have both `src/modules/auth/auth.utils.ts` and `src/utils/jwt.ts`?
   **A:** One is specific to the auth module while the other is a general JWT utility used elsewhere, though they overlap conceptually.

9. **Q:** What benefit does the `middleware/errorHandler.ts` provide?
   **A:** It converts thrown errors into HTTP responses and centralizes error handling for routes.

10. **Q:** Why use `express.json({ limit: "1mb" })`?
    **A:** To parse JSON bodies and protect against excessively large requests.

11. **Q:** What does `app.disable("x-powered-by")` do?
    **A:** It removes the `X-Powered-By` response header to reduce information disclosure.

12. **Q:** How are routes mounted in this service?
    **A:** `app.use(env.API_PREFIX, routes(db));` mounts auth routes under the configured API prefix.

13. **Q:** What is the role of `CORS` configuration in `src/app.ts`?
    **A:** It controls which origins can call the API and blocks unauthorized cross-origin requests.

14. **Q:** Why does the project use `helmet()` middleware?
    **A:** To add security headers that mitigate common web vulnerabilities.

15. **Q:** What does the `rateLimit` middleware protect against?
    **A:** It limits request frequency to reduce brute force, DoS, or abusive traffic.

16. **Q:** Why is `cookie-parser` included if auth tokens are returned in JSON?
    **A:** It may support future cookie-based session handling or existing routes that depend on cookies.

17. **Q:** What is the `health` route for?
    **A:** Basic service availability check used by monitoring or deployment health checks.

18. **Q:** How does the project avoid exposing internal error details?
    **A:** Through the centralized error handler and with standardized error messages.

19. **Q:** Why are SQL migrations versioned by filename?
    **A:** To ensure deterministic execution order and track schema changes.

20. **Q:** What design pattern does `AuthRepository` follow?
    **A:** Repository pattern, abstracting database storage operations from business logic.

21. **Q:** What is the difference between `auth.controller.ts` and `auth.service.ts`?
    **A:** Controller handles HTTP request/response, while service contains authentication business logic.

22. **Q:** Why are request validation schemas separated into `auth.validation.ts`?
    **A:** To decouple validation logic from controllers and improve reusability.

23. **Q:** How does the code enforce strong typing for payloads?
    **A:** It uses TypeScript interfaces and strict compiler options, including `exactOptionalPropertyTypes`.

24. **Q:** Why does `server.ts` call `initializeDatabase()` before starting the app?
    **A:** To ensure the database exists before application routes attempt database connections.

25. **Q:** What is the security implication of `env.JWT_ACCESS_SECRET`?
    **A:** It is the secret key used to sign access tokens; if compromised, attackers can forge valid JWTs.

---

## 2. Authentication Concepts

26. **Q:** What is an access token in this project?
    **A:** A short-lived JWT issued after login, used to authenticate requests.

27. **Q:** What is a refresh token in this project?
    **A:** A long-lived random token used to obtain new access tokens after the previous one expires.

28. **Q:** Why store refresh token hashes instead of raw refresh tokens?
    **A:** To protect token secrecy if the database is compromised.

29. **Q:** How are refresh tokens generated?
    **A:** Using `crypto.randomBytes(64).toString("hex")` in `generateRefreshToken()`.

30. **Q:** What hashing algorithm is used for refresh tokens?
    **A:** SHA-256 via `crypto.createHash("sha256")`.

31. **Q:** What does `comparePassword` do?
    **A:** It verifies a plaintext password against a bcrypt hash.

32. **Q:** Why is bcrypt used for passwords and not refresh tokens?
    **A:** Passwords require slow hashing to resist brute force, while refresh tokens are random and can use a fast hash for storage.

33. **Q:** What fields are included in the JWT payload?
    **A:** `sub`, optionally `type`, `role`, and `companyId`.

34. **Q:** What does `sub` represent in a JWT payload?
    **A:** The subject or user identifier.

35. **Q:** How does this service enforce user status before login?
    **A:** It checks if `user.status === "ACTIVE"`.

36. **Q:** Why is `companyId` normalized to a string in the JWT payload?
    **A:** JWT payload values are typically strings and JSON-friendly.

37. **Q:** Why is `role` optional in `AccessTokenPayload`?
    **A:** Not all users may have a role assigned, so the token can still be issued.

38. **Q:** What is token rotation and why is it used?
    **A:** Replacing refresh tokens on each refresh to reduce the risk of token reuse.

39. **Q:** What does `revokeRefreshToken` do?
    **A:** Marks a refresh token as revoked in the database so it cannot be reused.

40. **Q:** Why is the refresh flow wrapped in a transaction?
    **A:** To ensure revocation and replacement happen atomically.

41. **Q:** What does `findRefreshTokenForUpdate` likely do?
    **A:** Fetches a refresh token row with a database lock to prevent concurrent reuse.

42. **Q:** What is the purpose of `storedToken.revokedAt` check?
    **A:** To reject previously revoked refresh tokens.

43. **Q:** Why compare `expiresAt` to `Date.now()`?
    **A:** To reject expired refresh tokens before issuing a new access token.

44. **Q:** Why is a separate `/logout` endpoint useful?
    **A:** To revoke a single refresh token after logout.

45. **Q:** Why is `/logout-all` provided?
    **A:** To revoke all of a user's refresh tokens from all devices.

46. **Q:** What is the benefit of `accessToken` as JWT instead of session ID?
    **A:** Statelesness for request auth, easier scaling and distributed services.

47. **Q:** Why use `JWT_ISSUER` when signing tokens?
    **A:** It identifies the token issuer and helps validate token origin.

48. **Q:** How does the app likely verify access tokens for protected routes?
    **A:** Middleware `authenticate` likely uses `jwt.verify()`.

49. **Q:** What is the likely difference between access token expiration and refresh token expiration?
    **A:** Access tokens are short-lived, refresh tokens last longer (e.g. 7 days).

50. **Q:** Why is `companyId` included in JWT payload?
    **A:** To use tenant or organization context in downstream authorization.

---

## 3. Express and Middleware

51. **Q:** How does `validateRequest` middleware help the project?
    **A:** It ensures incoming request bodies match expected Zod schemas before controller execution.

52. **Q:** What happens when validation fails in a request?
    **A:** The middleware should throw or respond with a 400 error before the controller runs.

53. **Q:** Why use `Router()` in auth routes?
    **A:** To group auth endpoints and mount them under a common prefix.

54. **Q:** What does `authenticate` middleware likely attach to the request?
    **A:** An `auth` object containing user ID, role, and company context.

55. **Q:** Why is `authenticate` not applied to `/login` and `/refresh`?
    **A:** Those endpoints are used before the user has a valid access token.

56. **Q:** Why is error-handling middleware registered after routes?
    **A:** So it can catch and process errors thrown by route handlers.

57. **Q:** What is the benefit of using `express.urlencoded({ extended: false })`?
    **A:** To parse URL-encoded data without exposing the app to nested object parsing.

58. **Q:** What does the `standardHeaders: "draft-8"` option do in rate limiting?
    **A:** It returns rate limit info using standardized response headers.

59. **Q:** Why set `legacyHeaders: false` in rate limiting?
    **A:** To disable older header names and use modern standard headers only.

60. **Q:** What is the role of `errorHandler` in API response consistency?
    **A:** It centralizes error responses and prevents raw stack traces from leaking.

61. **Q:** Why is `cors` configured with an origin callback instead of a simple string?
    **A:** To allow dynamic origin checking against an allow list.

62. **Q:** What is the significance of `credentials: true` in CORS?
    **A:** It allows cookies and authorization headers in cross-origin requests.

63. **Q:** Why should health checks avoid heavy logic?
    **A:** To keep health endpoint fast and reliable for monitoring.

64. **Q:** Why should route-specific validation be implemented at the middleware layer?
    **A:** It keeps controller logic focused on business behavior.

65. **Q:** How can you unit test `auth.controller.ts`?
    **A:** Mock `AuthService`, create fake request/response objects, and assert JSON responses.

66. **Q:** How can you integration test `src/app.ts`?
    **A:** Start the Express app in memory and make HTTP requests against routes.

67. **Q:** Why is `router.post("/refresh", validateRequest(refreshSchema), controller.refresh);` useful?
    **A:** It validates input before the controller handles token refresh.

68. **Q:** What is the benefit of using `async` controller methods with arrow functions?
    **A:** It preserves `this` when passing methods as route handlers.

69. **Q:** Why does `AuthController.logout` read `refreshToken` from `req.body`?
    **A:** To revoke the token the client wants to invalidate.

70. **Q:** What is the purpose of `validateRequest` returning a function?
    **A:** To create route-specific middleware that can be reused with different schemas.

---

## 4. Database and SQL

71. **Q:** What database system does the project use?
    **A:** MySQL via `mysql2/promise`.

72. **Q:** What does `createPool` provide?
    **A:** Connection pooling for efficient database reuse.

73. **Q:** Why does `initializeDatabase()` create the database if it doesn't exist?
    **A:** So the service can start on a fresh environment without a separate manual DB setup step.

74. **Q:** What is the purpose of `checkDatabaseConnection()`?
    **A:** To verify the pool can connect before starting the server.

75. **Q:** Why track executed migrations in a `migrations` table?
    **A:** To avoid re-running completed migrations.

76. **Q:** How does `migrate.ts` execute SQL scripts?
    **A:** It reads `.sql` files, splits statements by `;`, and runs them sequentially.

77. **Q:** What is a possible issue with splitting SQL by `;`?
    **A:** It may break if SQL code contains semicolons inside strings or procedures.

78. **Q:** Why does `migrate.ts` start a transaction for each migration?
    **A:** To rollback on failure and keep schema changes consistent.

79. **Q:** What is the difference between `schema` and `data` migrations?
    **A:** Schema migrations update table structures, while seed files insert initial data.

80. **Q:** Why does `013_fix_roles_uniqueness.sql` use `INFORMATION_SCHEMA` checks?
    **A:** To make the migration idempotent and avoid duplicate column/index errors.

81. **Q:** Why is `role_scope_key` added to the roles table?
    **A:** To enforce uniqueness across role scope and code.

82. **Q:** What is the purpose of `001_system_roles.sql`?
    **A:** To seed default system-level roles into the database.

83. **Q:** How can you make migrations safer for production?
    **A:** Use explicit transactional scripts, avoid destructive operations, and test in staging.

84. **Q:** What does `ENCODING utf8mb4` support in MySQL?
    **A:** It supports full Unicode including emoji.

85. **Q:** Why might `ALTER TABLE` be problematic on large tables?
    **A:** It can lock the table and cause downtime.

86. **Q:** Why use `UNIQUE KEY` instead of a normal index?
    **A:** It enforces uniqueness on the indexed columns.

87. **Q:** What is the benefit of normalizing `companyId` and `role_scope_key` in JWTs?
    **A:** It helps maintain consistent authorization context.

88. **Q:** What is likely stored in the `roles` table?
    **A:** Role definitions, role codes, and permissions scope.

89. **Q:** Why is `product_id IS NULL` used in the migration?
    **A:** To identify system-level roles vs product-level roles.

90. **Q:** How can you avoid SQL injection in this project?
    **A:** Use parameterized queries and avoid string interpolation with user input.

---

## 5. TypeScript and Types

91. **Q:** What does `strict: true` enable in tsconfig?
    **A:** A group of strict type checking options for safer code.

92. **Q:** What is `exactOptionalPropertyTypes` for?
    **A:** To distinguish `prop?: string` from `prop: string | undefined`.

93. **Q:** How does the project handle JWT payload typing?
    **A:** It defines `AccessTokenPayload` interfaces and uses them in `generateAccessToken`.

94. **Q:** Why does `AuthService` use `String(user.id)` for the JWT `sub`?
    **A:** JWT claims are usually strings.

95. **Q:** What is the advantage of typed request bodies in Express?
    **A:** It prevents misusing request data and improves developer confidence.

96. **Q:** Why is `AuthenticatedRequest` useful?
    **A:** It extends Express request with auth context for protected routes.

97. **Q:** What does `z.infer<typeof loginSchema>` do?
    **A:** It derives a TypeScript type from a Zod schema.

98. **Q:** Why import `type { Request } from "express"`?
    **A:** To use type-only imports and avoid runtime dependencies.

99. **Q:** Why is `auth.controller.ts` using `async` methods?
    **A:** To await promises from service methods and handle asynchronous flows cleanly.

100.  **Q:** What is a practical way to avoid `undefined` in optional JWT claims when `exactOptionalPropertyTypes` is enabled?
      **A:** Omit the property entirely when it is not present, using conditional object spread.

101.  **Q:** Why should interface declarations be consistent across modules?
      **A:** To prevent mismatched expectations and runtime errors.

102.  **Q:** Why use `import type` instead of regular import for interfaces?
      **A:** It keeps TypeScript type imports separate and may improve compile performance.

103.  **Q:** What is the purpose of `noUncheckedIndexedAccess`?
      **A:** It forces existence checks for index access on arrays or objects.

104.  **Q:** How can `withTransaction` improve code safety?
      **A:** It makes sure related DB operations succeed or fail together.

105.  **Q:** What is the tradeoff of using `skipLibCheck: true`?
      **A:** Faster compile time at the cost of skipping type checking for external library declarations.

---

## 6. Security and Best Practices

106. **Q:** What is the point of `rateLimit` in an auth service?
     **A:** To slow down repeated login attempts and help prevent brute-force attacks.

107. **Q:** Why should secrets never be checked into Git?
     **A:** Because they can be leaked and compromise the application.

108. **Q:** Why is `POST /login` preferred over `GET` for credentials?
     **A:** Because POST keeps credentials out of URLs and logs.

109. **Q:** Why would the app use HTTPS in production?
     **A:** To encrypt tokens and user credentials in transit.

110. **Q:** What is CSRF and is this service vulnerable?
     **A:** CSRF is cross-site request forgery; if cookies are used for auth, CSRF protections are needed, but if bearer tokens are used, it is less of a concern.

111. **Q:** Why is it important to handle token expiration correctly?
     **A:** To prevent unauthorized access with stale tokens.

112. **Q:** What are the risks of not revoking refresh tokens?
     **A:** A stolen refresh token could be used indefinitely if not expired or revoked.

113. **Q:** How can you secure the refresh token storage in clients?
     **A:** Store them in secure HTTP-only cookies or encrypted storage.

114. **Q:** Why should errors not reveal whether an email exists?
     **A:** To prevent user enumeration attacks.

115. **Q:** What does `validateRequest` help prevent beyond malformed data?
     **A:** It helps prevent invalid payloads and potential injection attempts.

116. **Q:** Why is `helmet()` a recommended default for Express apps?
     **A:** It applies secure HTTP headers that protect against many attacks.

117. **Q:** How can you harden an auth API beyond the current implementation?
     **A:** Add MFA, account lockouts, stricter password rules, and audit logging.

118. **Q:** What should be logged when a refresh token is revoked?
     **A:** The user ID and timestamp, not the raw token.

119. **Q:** Why is it useful to keep refresh token hashes only?
     **A:** So stolen DB records can't directly yield usable tokens.

120. **Q:** What is a safe strategy for rolling JWT signing keys?
     **A:** Support key rotation with both old and new keys during transition.

---

## 7. Practical Scenario Questions

121. **Q:** If a user logs in from two devices, how does the refresh strategy support both sessions?
     **A:** Each device gets its own refresh token record, allowing independent refresh and revocation.

122. **Q:** Why might the app use `companyId` claim in multi-tenant systems?
     **A:** To scope access and authorization to the correct tenant.

123. **Q:** How would you handle a missing role in the access token?
     **A:** Treat the user as unprivileged or assign default permissions.

124. **Q:** Why is the `me` endpoint useful?
     **A:** It lets the client confirm the authenticated user's current profile.

125. **Q:** Why should `logoutAll` require authentication?
     **A:** Because it operates on the current authenticated user's sessions.

126. **Q:** How can you test that `authenticate` middleware works?
     **A:** Send a request with a valid token and one without, asserting success and failure respectively.

127. **Q:** What would happen if access tokens were not signed?
     **A:** Clients could forge tokens and bypass authentication.

128. **Q:** How would you implement role-based authorization in this service?
     **A:** Add middleware that checks `req.auth.role` against allowed roles for the route.

129. **Q:** Why might the service store `lastLoginAt`?
     **A:** For auditing, security checks, and user activity tracking.

130. **Q:** What is the benefit of returning standardized response objects?
     **A:** Clients can reliably parse success, message, and data fields.

131. **Q:** How should failed authentication be reported?
     **A:** With a generic error message and proper HTTP status code, such as 401 or 400.

132. **Q:** What is a common mistake when building JWT refresh flows?
     **A:** Allowing refresh tokens to be reused after rotation.

133. **Q:** How can audit logs improve security?
     **A:** By recording key actions like login, logout, and token revocation.

134. **Q:** If a refresh token is compromised, what is the best response?
     **A:** Revoke all tokens and require re-login or rotation.

135. **Q:** Why is it important to set `expiresIn` for JWTs?
     **A:** To limit the lifetime of access tokens and reduce risk from leaked tokens.

136. **Q:** How might you extend this service for password reset?
     **A:** Add a secure, expiring reset token flow with email verification.

137. **Q:** What are the downsides of very long-lived access tokens?
     **A:** Greater risk if tokens are stolen.

138. **Q:** Why is schema migration important for team collaboration?
     **A:** It keeps database changes versioned and consistent across environments.

139. **Q:** What should you do if the DB migration fails mid-run?
     **A:** Roll back and inspect the failed SQL before retrying.

140. **Q:** How can the service detect a bad or expired database connection?
     **A:** By pinging the DB before starting and handling connection errors gracefully.

---

## 8. Testing and Quality

141. **Q:** What tests would you write for `auth.service.ts`?
     **A:** Unit tests for login, refresh, revoke session, and token generation logic.

142. **Q:** What tests belong in `auth.repository.ts`?
     **A:** DB interaction tests for find, insert, update, and revoke methods.

143. **Q:** How can you test the migration script safely?
     **A:** Run it against a disposable test database and verify schema changes.

144. **Q:** Why should you test schema migrations when adding a new field?
     **A:** To ensure the migration applies cleanly and doesn't break existing data.

145. **Q:** What is the benefit of using `tsc --noEmit`?
     **A:** It verifies TypeScript compilation without building output.

146. **Q:** Why is input validation part of defensive programming?
     **A:** It prevents invalid or malicious input from reaching business logic.

147. **Q:** Why would you add integration tests around `/login` and `/refresh`?
     **A:** To verify end-to-end token flows and middleware behavior.

148. **Q:** What would a good test for `withTransaction` verify?
     **A:** That operations rollback on failure and commit on success.

149. **Q:** Why is `skipLibCheck: true` acceptable in some projects?
     **A:** It speeds compilation when library type issues are not the team's focus.

150. **Q:** What metrics could you monitor for this auth service?
     **A:** Login success/failure, refresh rate, error rate, DB latency, and token revocation events.

---

## 9. Additional Concepts

151. **Q:** What is `NodeNext` module resolution used for?
     **A:** It enables ESM-style imports and package exports compatibility in Node.

152. **Q:** Why is `allowSyntheticDefaultImports` useful?
     **A:** It simplifies importing CommonJS modules with default syntax.

153. **Q:** What is the effect of `forceConsistentCasingInFileNames`?
     **A:** It prevents import path case mismatches across platforms.

154. **Q:** Why use `path.join(__dirname, "migrations")` in `migrate.ts`?
     **A:** To resolve the migrations directory reliably across OSes.

155. **Q:** What is the benefit of `await connection.end()` in `migrate.ts`?
     **A:** It closes the database connection cleanly when migration finishes.

156. **Q:** Why might `AUTH` or `TOKEN` be stored in environment variables?
     **A:** To separate secrets from code and permit environment-specific configuration.

157. **Q:** What role does `dotenv` play in this project?
     **A:** It loads environment variables from a `.env` file for local development.

158. **Q:** What is the security risk of `console.error(error)` in production?
     **A:** It may expose sensitive details if logs are not protected.

159. **Q:** How can you make this auth service multi-region?
     **A:** Use a shared database and stateless JWT access tokens across regions.

160. **Q:** Why is `expiry` of refresh tokens a good safety measure?
     **A:** It ensures old tokens cannot be used indefinitely.

---

## 10. Summary

This project demonstrates a production-inspired auth backend with:

- Express middleware and route handling
- JWT access and refresh flow
- Secure password and token hashing
- MySQL migrations and repository abstraction
- TypeScript strict typing and validation
- Security best practices like CORS, rate limiting, and error handling

Use these questions to prepare for interviews on backend authentication systems, Node.js security, and TypeScript API design.
