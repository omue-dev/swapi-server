"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const port = 5000;
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; style-src 'self' 'unsafe-inline';");
    res.removeHeader("X-Content-Security-Policy");
    res.removeHeader("X-WebKit-CSP");
    next();
});
// Verwende die Routen
app.use('/api', routes_1.default);
// Statische Dateien aus dem dist-Ordner bereitstellen
app.use(express_1.default.static(path_1.default.join(__dirname, 'dist')));
// Für alle anderen Routen die index.html zurückgeben
app.get('*', (req, res) => {
    if (req.url.startsWith('/api')) {
        res.status(404).send('API endpoint not found');
    }
    else {
        res.sendFile(path_1.default.join(__dirname, 'dist', 'index.html')); // Korrekte Pfadangabe
    }
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
