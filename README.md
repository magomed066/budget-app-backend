# Fastify TypeScript server

This service uses PostgreSQL through TypeORM.

## Local setup

1. Create your environment file:

   ```sh
   cp .env.example .env
   ```

2. Start PostgreSQL:

   ```sh
   docker compose up -d postgres
   ```

3. Apply database migrations:

   ```sh
   npm run migration:run
   ```

4. Start the server:

   ```sh
   npm run dev
   ```

## Database commands

- `npm run migration:generate` generates a migration from entity changes.
- `npm run migration:run` applies pending migrations.
- `npm run migration:revert` reverts the most recently applied migration.

Use `app.db.getRepository(Entity)` inside Fastify routes and plugins to access a
TypeORM repository.

## Register a user

Send a `POST` request to `/api/auth/register`:

```sh
curl -X POST http://localhost:3000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{
    "email": "person@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "password": "a-secure-password",
    "phone": "+1234567890"
  }'
```

Passwords are salted and hashed with bcrypt before storage. The password hash is
never included in the API response. Duplicate email addresses return HTTP 409.

## Log in

Send a `POST` request to `/api/auth/login`:

```sh
curl -X POST http://localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{
    "email": "person@example.com",
    "password": "a-secure-password"
  }'
```

Successful login returns the user together with new access and refresh tokens.
Invalid credentials return HTTP 401 without revealing whether the email exists.

## Refresh tokens

Send the refresh token returned by registration, login, or a previous refresh
to `POST /api/auth/refresh`:

```sh
curl -X POST http://localhost:3000/api/auth/refresh \
  -H 'content-type: application/json' \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

A successful request returns a new access token and refresh token. Refresh
tokens are rotated, so the submitted token cannot be reused. Invalid, expired,
revoked, or already-used refresh tokens return HTTP 401.

## Log out

Send a `POST` request with the access token returned by the registration or
login endpoint:

```sh
curl -X POST http://localhost:3000/api/auth/logout \
  -H 'authorization: Bearer YOUR_ACCESS_TOKEN'
```

A successful logout revokes the token pair's database session and returns HTTP
204 with no response body. The client should also remove both tokens. Reusing
the logged-out access token, or a missing, expired, or invalid token, returns
HTTP 401. Other devices remain signed in because each token pair has its own
session.

## Get your profile

Send a `GET` request with the access token returned by the login endpoint:

```sh
curl http://localhost:3000/api/users/me \
  -H 'authorization: Bearer YOUR_ACCESS_TOKEN'
```

The response contains the authenticated user's profile without the password
hash. A missing user returns HTTP 404. A missing, expired, or invalid access
token returns HTTP 401. Registration and login remain public endpoints.
