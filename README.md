# Shopware API Server

This repository contains a small Express server written in TypeScript. It serves as a lightweight wrapper around the Shopware API and exposes routes for fetching and updating product data.

## Features
- Retrieve latest products and manufacturers
- Search and fetch single products
- Generate order CSV files
- API key authentication for mutation endpoints

## Getting Started
1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd swapi-server
   ```
2. **Install dependencies** (requires Node.js 22.11.0 or newer)
   ```bash
   npm install
   ```
3. **Environment variables**
   Copy the example file and fill in your values:
   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |----------|-------------|
   | `REDIS_URL` | Redis connection URL for caching |
   | `PORT` | Server port (default: 5000) |
   | `SHOPWARE_API_URL` | Shopware API base URL |
   | `SHOPWARE_CLIENT_ID` | Shopware API client ID |
   | `SHOPWARE_CLIENT_SECRET` | Shopware API client secret |
   | `API_BASE_URL` | Base URL for API requests |
   | `API_KEY` | API key for authenticating mutation requests |

   Generate a secure API key:
   ```bash
   openssl rand -hex 32
   ```

4. **API Credentials**
   Create a new file `src/utils/authCredentials.ts`:
   ```typescript
   const credentials = {
     username: 'YOUR-API-USERNAME',
     password: 'YOUR-API-PASSWORD'
   };

   export default credentials;
   ```

5. **Build the project**
   ```bash
   npm run build
   ```
6. **Run the server**
   ```bash
   npm start
   ```

The server will start on the configured port and expose the API routes under `/api`.

## Authentication

Mutation endpoints (POST, PUT, PATCH, DELETE) require the `X-API-Key` header. GET requests do not require authentication.

Example:
```bash
curl -X PATCH http://localhost:5000/api/products/123 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "Updated Product"}'
```
