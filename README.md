# Backend (Node.js microservices)

This backend is split into four services:
- Auth service (JWT login/register/refresh)
- User service (profile read)
- Catalog service (categories, products, search)
- API Gateway (single entry point)

For a step-by-step beginner guide, see [Backend/DETAILED_GUIDE.md](DETAILED_GUIDE.md).

## Ports
- API Gateway: 4000
- Auth service: 4001
- User service: 4002
- Catalog service: 4003

## Local setup
1. Copy each .env.example to .env in its service folder.
2. Create the MySQL schema using: sql/mysql_schema.sql
3. Start MongoDB for the catalog service.
4. Install dependencies from Backend:
   npm install -ws
5. Run services in separate terminals:
   npm run dev:auth
   npm run dev:user
   npm run dev:catalog
   npm run dev:gateway

## API Gateway routes
- /auth -> Auth service
- /users -> User service
- /catalog -> Catalog service

## Notes
- JWT access tokens are required for /users/me.
- Refresh tokens are stored in MySQL for rotation and logout.
