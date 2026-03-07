# Detailed Backend Guide (Beginner-Friendly)

This guide explains the backend architecture, setup, APIs, and deployment basics for the NAGP ecommerce assignment. It is written for beginners and includes practical steps and notes you can refer to later.

## 1) What you are building
You are building a Node.js backend using a microservice architecture. Each service owns a specific feature area and exposes HTTP endpoints. The services are:

- API Gateway: single entry point for the frontend
- Auth service: login/register/refresh/logout
- User service: user profile (secured)
- Catalog service: product categories, products, and search

The API Gateway proxies requests to the right service, so the frontend only talks to one base URL.

## 2) High-level architecture

```mermaid
flowchart LR
  FE[Frontend (Vite React)] --> GW[API Gateway :4000]
  GW --> AUTH[Auth Service :4001]
  GW --> USER[User Service :4002]
  GW --> CAT[Catalog Service :4003]

  AUTH --> MYSQL[(MySQL: users + refresh tokens)]
  USER --> MYSQL
  CAT --> MONGO[(MongoDB: products + categories)]
```

### Why microservices?
- Clear separation of concerns
- Easier to scale parts independently
- Different databases per service (polyglot persistence)

## 3) Folder structure overview

- Backend/
  - services/
    - api-gateway/
    - auth-service/
    - user-service/
    - catalog-service/
  - sql/mysql_schema.sql
  - package.json (workspace scripts)

## 4) Prerequisites

Install these tools before running locally:
- Node.js 18+ and npm
- MySQL 8+ (for auth/user)
- MongoDB 6+ (for catalog)
- A REST client (Postman or curl)

## 5) Environment files (.env)
Each service has a .env file. You already copied them from .env.example.

### Auth service .env
- MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
- JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
- JWT_ACCESS_TTL, JWT_REFRESH_TTL

### User service .env
- MYSQL_* values must match auth service
- JWT_ACCESS_SECRET must be identical to auth service

### Catalog service .env
- MONGO_URI for MongoDB connection

### API Gateway .env
- AUTH_SERVICE_URL, USER_SERVICE_URL, CATALOG_SERVICE_URL
- CORS_ORIGIN to allow your frontend origin (e.g., http://localhost:5173)

## 6) Database setup

### MySQL
Run the schema file:

```sql
-- From Backend/sql/mysql_schema.sql
CREATE DATABASE IF NOT EXISTS ecommerce_users;
USE ecommerce_users;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_users_email (email)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_refresh_tokens_user (user_id),
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
```

### MongoDB
Create a database for catalog, for example:
- ecommerce_catalog

Collections will be created automatically when you insert data.

## 7) Install dependencies
From the Backend folder:

```bash
npm install -ws
```

This installs dependencies for all services using npm workspaces.

## 8) Start services locally
Open four terminals and run:

```bash
npm run dev:gateway
npm run dev:auth
npm run dev:user
npm run dev:catalog
```

### Health checks
- http://localhost:4000/health
- http://localhost:4001/health
- http://localhost:4002/health
- http://localhost:4003/health

## 9) API Gateway routes
The frontend calls only the gateway:

- /auth -> Auth service
- /users -> User service
- /catalog -> Catalog service

Example base URL:
- http://localhost:4000

## 10) Auth flow (JWT)

1. Register or login to get tokens.
2. Store access token in client (memory or local storage).
3. Send access token on protected routes using Authorization header.
4. When access token expires, call /auth/refresh with refresh token.

### Token headers

```http
Authorization: Bearer <access_token>
```

## 11) API reference (core endpoints)

### Auth service (via gateway)

#### Register
POST /auth/register

Request body:
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "Pass@1234"
}
```

Response:
```json
{
  "user": { "id": 1, "name": "Alice", "email": "alice@example.com" },
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

#### Login
POST /auth/login

Request body:
```json
{
  "email": "alice@example.com",
  "password": "Pass@1234"
}
```

#### Refresh tokens
POST /auth/refresh

Request body:
```json
{
  "refreshToken": "..."
}
```

#### Logout
POST /auth/logout

Request body:
```json
{
  "refreshToken": "..."
}
```

### User service (via gateway)

#### Current user profile
GET /users/me

Headers:
```http
Authorization: Bearer <access_token>
```

Response:
```json
{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "created_at": "2026-02-09T12:00:00.000Z"
}
```

### Catalog service (via gateway)

#### List categories
GET /catalog/categories

Response:
```json
[
  { "_id": "...", "name": "Electronics", "slug": "electronics" },
  { "_id": "...", "name": "Fashion", "slug": "fashion" }
]
```

#### List products
GET /catalog/products?category=electronics&search=phone&page=1&limit=20

Response:
```json
{
  "items": [
    {
      "_id": "...",
      "name": "Smart Phone",
      "price": 399,
      "category": { "name": "Electronics", "slug": "electronics" }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### Product detail
GET /catalog/products/:id

#### Quick search (first 20 items)
GET /catalog/search?q=phone

## 12) Seed catalog data (optional)

The catalog uses MongoDB. To load some starter categories and products:

```bash
cd Backend/services/catalog-service
npm run seed
```

To reset and re-seed data:

```bash
SEED_RESET=true npm run seed
```

This script inserts a few categories and products so the frontend shows real data.

## 13) Common troubleshooting

- MySQL connection refused
  - Check MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD
  - Ensure MySQL server is running

- MongoDB connection failed
  - Verify MONGO_URI
  - Ensure MongoDB is running and accessible

- Invalid access token
  - Ensure JWT_ACCESS_SECRET matches auth and user services
  - Check token expiration

- CORS issues in browser
  - Set CORS_ORIGIN in gateway to your frontend URL

## 14) Security best practices (starter list)

- Use strong secrets for JWTs
- Hash passwords with bcrypt (already done)
- Always validate input before database writes
- Do not store access tokens in local storage in production
- Use HTTPS in production

## 15) AWS deployment (high-level)
This is a high-level overview to get you oriented. We can add a step-by-step AWS guide later.

### Suggested AWS services
- ECS Fargate or Elastic Beanstalk for services
- RDS MySQL for users/auth
- DocumentDB or MongoDB Atlas for catalog
- ALB (Application Load Balancer) for gateway

### Basic deployment steps
1. Containerize each service with Docker.
2. Push images to ECR.
3. Create ECS services and task definitions.
4. Configure environment variables in ECS.
5. Attach ALB to API Gateway service.
6. Point frontend to the gateway ALB URL.

## 16) Learning roadmap (optional)

- Express basics: routing, middleware, error handling
- JWT basics: signing, verifying, expiration
- SQL basics: CREATE, SELECT, indexes
- MongoDB basics: documents, collections, indexes
- Microservice fundamentals: separation and API contracts

---
If you want, I can keep expanding this guide as you progress (data seeding, tests, Docker, CI/CD, AWS deployment details, and frontend integration).
