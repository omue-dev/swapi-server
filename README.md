# Shopware API Server

Express.js/TypeScript server that wraps the Shopware 6 API. Provides simplified endpoints for product data, categories, and manufacturers.

## Features

- Fetch products with pagination, filtering, and sorting
- Search products by name
- Single product details with properties (gender, colors)
- Find related products
- Fetch manufacturers and categories
- Update products (with API key authentication)
- Rate limiting (100 requests / 15 min)
- OAuth 2.0 token management with auto-refresh

## Tech Stack

- **Runtime:** Node.js >= 22.11.0
- **Framework:** Express.js 4.17
- **Language:** TypeScript 5.4
- **HTTP Client:** Axios
- **Security:** express-rate-limit, CORS, CSP Headers

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd swapi-server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Then fill in your values in `.env`:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `SHOPWARE_API_URL` | Shopware API base URL (e.g., `https://shop.com/api`) |
| `SHOPWARE_CLIENT_ID` | Shopware OAuth Client ID |
| `SHOPWARE_CLIENT_SECRET` | Shopware OAuth Client Secret |
| `API_KEY` | API key for mutation endpoints |
| `REDIS_URL` | Redis URL (optional, for future caching) |
| `API_BASE_URL` | Base URL of the API (informational) |

**Generate API key:**

```bash
openssl rand -hex 32
```

### 4. Build & Start

**Development (with hot-reload):**

```bash
npm run dev
```

**Production:**

```bash
npm run build
npm start
```

The server starts on the configured port and exposes the API under `/api`.

## API Endpoints

All endpoints under the `/api` prefix.

### Read products (no authentication)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/products` | POST | Latest products with pagination and sorting |
| `/search-products` | POST | Search products by name |
| `/single-product/:id` | GET | Single product with details |
| `/related-products` | POST | Related products by name prefix |
| `/product-manufacturer` | POST | All manufacturers with product count |
| `/categories-with-products` | POST | Active categories with product count |

### Write products (API key required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/update-main-product` | POST | Update single product |
| `/update-related-products` | POST | Batch update multiple products |

### Request Parameters

**`/products` and `/search-products`:**

```json
{
  "page": 1,
  "limit": 24,
  "sortField": "releaseDate",
  "sortDirection": "DESC",
  "searchTerm": "Sneaker"
}
```

**Allowed sort fields:** `name`, `productNumber`, `releaseDate`, `stock`, `price`

**Sort directions:** `ASC`, `DESC`

### Response Format

All endpoints return a consistent format:

```json
{
  "success": true,
  "log": "Description of the action",
  "data": { ... },
  "totalProducts": 123
}
```

## Authentication

Mutation endpoints require the `X-API-Key` header:

```bash
curl -X POST http://localhost:5000/api/update-main-product \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "productId": "abc123",
    "name": "New Product Name",
    "description": "Description",
    "gender": "Herren"
  }'
```

**Supported gender values:** `Herren`, `Damen`, `Unisex`, `Kids`

## Project Structure

```
src/
├── server.ts              # Express app entry point
├── routes/
│   ├── index.ts           # Route aggregator
│   ├── latestProducts.ts
│   ├── searchProducts.ts
│   ├── singleProduct.ts
│   ├── relatedProducts.ts
│   ├── productManufacturer.ts
│   ├── categoriesWithProducts.ts
│   ├── updateMainProduct.ts
│   └── updateRelatedProducts.ts
└── utils/
    ├── getAuthToken.ts    # OAuth token management
    ├── authMiddleware.ts  # API key validation
    ├── cacheMiddleware.ts # Cache (Redis-ready)
    ├── mapProductResponse.ts
    ├── errorHandler.ts
    ├── validation.ts
    └── headers.ts
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development with nodemon |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |

## Security

- **Rate Limiting:** 100 requests per 15 minutes per IP
- **CSP Headers:** Content-Security-Policy set to `'self'`
- **API Key:** Required for all write operations
- **Input Validation:** Whitelist for sort fields
- **OAuth 2.0:** Token caching with automatic refresh
