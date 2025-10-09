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
   REDIS_URL=redis://127.0.0.1:6379
   PORT=5000
   ```
4. **Rich-text payloads (Editor.js)**
   The server now expects product description updates in the [Editor.js](https://editorjs.io) block format. Send the editor output in the field `descriptionEditorJs` when calling the update endpoints. The server will convert the blocks to HTML for Shopware and will also expose `descriptionEditorJs` alongside the legacy HTML in read operations.

5. **API Credentials**
   Create a new file `src/utils/authCredentials.ts`:
   ```env
   const credentials = {
     username: 'YOUR-API-USERNAME', 
    password: 'YOUR-API-PASSWORD'  
   };

   export default credentials;
   ```

6. **Build the project**
   ```bash
   npm run build
   ```
7. **Run the server**
   ```bash
   npm start
   ```

The server will start on the configured port and expose the API routes under `/api`.
