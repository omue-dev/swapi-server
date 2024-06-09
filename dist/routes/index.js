"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productManufacturer_1 = __importDefault(require("./productManufacturer"));
const latestProducts_1 = __importDefault(require("./latestProducts")); // Import der neuen Produkt-Routen
const sameProduct_1 = __importDefault(require("./sameProduct"));
const router = (0, express_1.Router)();
router.use(productManufacturer_1.default);
router.use(latestProducts_1.default); // Verwenden der neuen Produkt-Routen
router.use(sameProduct_1.default); // Verwenden der neuen Produkt-Routen
exports.default = router;
