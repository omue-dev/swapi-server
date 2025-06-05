# Shopware API Server

This repository contains a small Express server written in TypeScript. It serves as a lightweight wrapper around the Shopware API and exposes routes for fetching and updating product data.

## Features
- Retrieve latest products and manufacturers
- Search and fetch single products
- Generate order CSV files

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
   Create a `.env` file in the project root. Example:
   ```env
   API_BASE_URL=https://your-shop-domain/api
   PORT=5000
   ```
4. **Build the project**
   ```bash
   npm run build
   ```
5. **Run the server**
   ```bash
   npm start
   ```

The server will start on the configured port and expose the API routes under `/api`.
