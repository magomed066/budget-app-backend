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

Send the refresh token returned by registration, login, or a previous refresh to
`POST /api/auth/refresh`:

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
curl http://localhost:3000/api/auth/me \
  -H 'authorization: Bearer YOUR_ACCESS_TOKEN'
```

The response contains the authenticated user's profile without the password
hash. A missing user returns HTTP 404. A missing, expired, or invalid access
token returns HTTP 401. Registration and login remain public endpoints.

## Update your profile

Send the profile fields you want to change to `PATCH /api/users/me`. The user is
identified by the access token, so a user ID is not accepted in the URL or body.

```sh
curl -X PATCH http://localhost:3000/api/auth/update \
  -H 'authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'content-type: application/json' \
  -d '{
    "firstName": "Janet",
    "phone": null
  }'
```

You can update `email`, `firstName`, `lastName`, and `phone`. Sending `null` for
`phone` clears it. An email already used by another account returns HTTP 409.

## Accounts

Apply migrations with `npm run migration:run` before using the account endpoints.
Accounts currently support `cash` and `bank` types and RUB currency. Opening
balances are integer kopecks: `100000` means 1,000 RUB. Negative balances are
allowed; the supported range is -2147483648 through 2147483647 kopecks.

Create an account with `POST /api/accounts`:

```sh
curl -X POST http://localhost:3000/api/accounts \
  -H 'authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'content-type: application/json' \
  -d '{"name":"Cash","type":"cash","currency":"RUB","openingBalanceMinor":100000}'
```

A successful request returns HTTP 201 and `{ "success": true, "data": {...} }`.
The account owner comes from the access token, never from the request body.
Names are trimmed and must contain a non-whitespace character.

List the authenticated user's accounts, newest first, with `GET /api/accounts`:

```sh
curl http://localhost:3000/api/accounts \
  -H 'authorization: Bearer YOUR_ACCESS_TOKEN'
```

This returns HTTP 200 and `{ "success": true, "data": [...] }`, with an empty
array when the user has no accounts. Both routes require an active session.

Run account route tests (using an in-memory repository substitute) with:

```sh
npm run build
node --test tests/accounts.test.cjs
```

### Get one account

Use `GET /api/accounts/:id` to retrieve an account owned by the authenticated user:

```sh
curl http://localhost:3000/api/accounts/1 \
  -H 'authorization: Bearer YOUR_ACCESS_TOKEN'
```

Returns HTTP 200 with `{ "success": true, "data": {...} }`, using the same
account fields as creation and listing. The ID must be a positive integer no
greater than 2147483647; invalid IDs return HTTP 400. Missing accounts and
accounts belonging to another user both return HTTP 404. A missing, invalid,
or revoked access token returns HTTP 401 for a valid account ID.

### Update an account

Use `PATCH /api/accounts/:id` with one or more of `name`, `type`, and
`openingBalanceMinor`. Omitted fields remain unchanged. Names are trimmed;
opening balances use integer kopecks and may be zero or negative within the
same range as account creation. Currency remains RUB.

```sh
curl -X PATCH http://localhost:3000/api/accounts/1 \
  -H 'authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'content-type: application/json' \
  -d '{"name":"Wallet","openingBalanceMinor":150000}'
```

Returns HTTP 200 with `{ "success": true, "data": {...} }` containing the updated
account. Invalid IDs, empty updates, and invalid field values return HTTP 400.
Missing accounts and other users' accounts return the same HTTP 404 response.
Authentication is required. Owner, ID, currency, and timestamps cannot be
changed through this endpoint; extra fields are ignored, and at least one
editable field must be supplied. Editing the opening balance corrects the
initial amount; it does not record income or an expense.

## Categories

Apply the new migration with `npm run migration:run` before using categories.
Each category belongs to the authenticated user and has a `name` (1–100
characters) and a `type` (`income` or `expense`). Names are trimmed and cannot
be blank. Duplicate names are allowed.

Create a category with `POST /api/categories`:

```sh
curl -X POST http://localhost:3000/api/categories \
  -H 'authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'content-type: application/json' \
  -d '{"name":"Groceries","type":"expense"}'
```

The response is HTTP 201 with `{ "success": true, "data": {...} }`. Public
category fields are `id`, `name`, `type`, `createdAt`, and `updatedAt`.

- `GET /api/categories` returns your categories, newest first, or an empty array.
- `GET /api/categories/:id` returns one of your categories.
- `PATCH /api/categories/:id` updates `name`, `type`, or both. Omitted fields
  remain unchanged.
- `DELETE /api/categories/:id` permanently deletes one of your categories and
  returns HTTP 204 with no response body. Deleting it again returns HTTP 404.

All endpoints require an active access token. Missing categories and categories
owned by another user both return HTTP 404. IDs must be positive integers up to
2147483647. Invalid input and empty updates return HTTP 400. Owner, ID, and
timestamps cannot be set through these endpoints; extra fields are ignored.
Categories are standalone for now; no transaction associations are created.

Run account and category route tests with an in-memory repository substitute:

```sh
npm run build
node --test tests/*.test.cjs
```
