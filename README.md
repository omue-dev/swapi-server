# Shopware API Server

Express.js/TypeScript Server als Wrapper für die Shopware 6 API. Stellt vereinfachte Endpunkte für Produktdaten, Kategorien und Hersteller bereit.

## Features

- Produkte abrufen mit Pagination, Filterung und Sortierung
- Produktsuche nach Name
- Einzelprodukt-Details mit Eigenschaften (Gender, Farben)
- Verwandte Produkte finden
- Hersteller und Kategorien abrufen
- Produkte aktualisieren (mit API-Key-Authentifizierung)
- Rate Limiting (100 Requests / 15 Min)
- OAuth 2.0 Token-Management mit Auto-Refresh

## Tech Stack

- **Runtime:** Node.js >= 22.11.0
- **Framework:** Express.js 4.17
- **Sprache:** TypeScript 5.4
- **HTTP Client:** Axios
- **Security:** express-rate-limit, CORS, CSP Headers

## Getting Started

### 1. Repository klonen

```bash
git clone <repo-url>
cd swapi-server
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Environment konfigurieren

```bash
cp .env.example .env
```

Dann `.env` mit den Werten befüllen:

| Variable | Beschreibung |
|----------|--------------|
| `PORT` | Server Port (default: 5000) |
| `SHOPWARE_API_URL` | Shopware API Base URL (z.B. `https://shop.de/api`) |
| `SHOPWARE_CLIENT_ID` | Shopware OAuth Client ID |
| `SHOPWARE_CLIENT_SECRET` | Shopware OAuth Client Secret |
| `API_KEY` | API Key für Mutations-Endpunkte |
| `REDIS_URL` | Redis URL (optional, für zukünftiges Caching) |
| `API_BASE_URL` | Basis-URL der API (informativ) |

**API Key generieren:**

```bash
openssl rand -hex 32
```

### 4. Build & Start

**Development (mit Hot-Reload):**

```bash
npm run dev
```

**Production:**

```bash
npm run build
npm start
```

Der Server startet auf dem konfigurierten Port und stellt die API unter `/api` bereit.

## API Endpunkte

Alle Endpunkte unter dem Prefix `/api`.

### Produkte lesen (ohne Authentifizierung)

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/products` | POST | Neueste Produkte mit Pagination und Sortierung |
| `/search-products` | POST | Produkte nach Name suchen |
| `/single-product/:id` | GET | Einzelnes Produkt mit Details |
| `/related-products` | POST | Verwandte Produkte nach Namens-Prefix |
| `/product-manufacturer` | POST | Alle Hersteller mit Produktanzahl |
| `/categories-with-products` | POST | Aktive Kategorien mit Produktanzahl |

### Produkte schreiben (API Key erforderlich)

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/update-main-product` | POST | Einzelnes Produkt aktualisieren |
| `/update-related-products` | POST | Mehrere Produkte batch-aktualisieren |

### Request-Parameter

**`/products` und `/search-products`:**

```json
{
  "page": 1,
  "limit": 24,
  "sortField": "releaseDate",
  "sortDirection": "DESC",
  "searchTerm": "Sneaker"
}
```

**Erlaubte Sortierfelder:** `name`, `productNumber`, `releaseDate`, `stock`, `price`

**Sortierrichtungen:** `ASC`, `DESC`

### Response-Format

Alle Endpunkte liefern ein einheitliches Format:

```json
{
  "success": true,
  "log": "Beschreibung der Aktion",
  "data": { ... },
  "totalProducts": 123
}
```

## Authentifizierung

Mutations-Endpunkte erfordern den `X-API-Key` Header:

```bash
curl -X POST http://localhost:5000/api/update-main-product \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "productId": "abc123",
    "name": "Neuer Produktname",
    "description": "Beschreibung",
    "gender": "Herren"
  }'
```

**Unterstützte Gender-Werte:** `Herren`, `Damen`, `Unisex`, `Kids`

## Projektstruktur

```
src/
├── server.ts              # Express App Entry Point
├── routes/
│   ├── index.ts           # Route-Aggregator
│   ├── latestProducts.ts
│   ├── searchProducts.ts
│   ├── singleProduct.ts
│   ├── relatedProducts.ts
│   ├── productManufacturer.ts
│   ├── categoriesWithProducts.ts
│   ├── updateMainProduct.ts
│   └── updateRelatedProducts.ts
└── utils/
    ├── getAuthToken.ts    # OAuth Token Management
    ├── authMiddleware.ts  # API Key Validierung
    ├── cacheMiddleware.ts # Cache (Redis-ready)
    ├── mapProductResponse.ts
    ├── errorHandler.ts
    ├── validation.ts
    └── headers.ts
```

## Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run dev` | Development mit nodemon |
| `npm run build` | TypeScript kompilieren |
| `npm start` | Production Server starten |

## Security

- **Rate Limiting:** 100 Requests pro 15 Minuten pro IP
- **CSP Headers:** Content-Security-Policy auf `'self'`
- **API Key:** Pflicht für alle schreibenden Operationen
- **Input Validation:** Whitelist für Sortierfelder
- **OAuth 2.0:** Token-Caching mit automatischem Refresh
