"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const authenticate_1 = __importDefault(require("../middleware/authenticate"));
const redis_1 = require("redis");
const router = (0, express_1.Router)();
const SHOPWARE_API_URL = 'https://www.weltenbummler-erkelenz.de/api';
const redisClient = (0, redis_1.createClient)({
    url: 'redis://127.0.0.1:6379'
});
redisClient.on('error', (err) => console.error('Redis Client Error', err));
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield redisClient.connect();
}))();
// Middleware zur Überprüfung des Caches
const checkCache = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 20 } = req.query;
    const cacheKey = `products:${page}:${limit}`;
    try {
        const data = yield redisClient.get(cacheKey);
        if (data) {
            res.send(JSON.parse(data));
        }
        else {
            next();
        }
    }
    catch (err) {
        console.error('Redis GET Error:', err);
        next();
    }
});
// Endpunkt für das Abrufen der Artikel
router.post('/search/product', [authenticate_1.default, checkCache], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { page = 1, limit = 20 } = req.query;
    const cacheKey = `products:${page}:${limit}`;
    try {
        const response = yield axios_1.default.post(`${SHOPWARE_API_URL}/search/product`, {
            limit: Number(limit),
            page: Number(page),
            filter: [
                {
                    type: 'range',
                    field: 'stock',
                    parameters: {
                        gte: 1
                    }
                },
                {
                    type: 'equals',
                    field: 'active',
                    value: false
                },
                {
                    type: 'equals',
                    field: 'description',
                    value: null
                }
            ],
            sort: [
                {
                    field: 'updatedAt',
                    order: 'desc'
                }
            ]
        }, {
            headers: {
                'Accept': 'application/vnd.api+json, application/json',
                'Content-Type': 'application/json',
                'Authorization': req.headers['Authorization']
            }
        });
        const data = response.data;
        yield redisClient.setEx(cacheKey, 3600, JSON.stringify(data)); // Cache für 1 Stunde
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching products:', error);
        if (axios_1.default.isAxiosError(error)) {
            res.status(500).send(((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        }
        else {
            res.status(500).send('An unknown error occurred');
        }
    }
}));
// Endpunkt für das Abrufen von Artikeln nach Name
router.post('/search/product-by-name', authenticate_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { name } = req.body;
    try {
        const response = yield axios_1.default.post(`${SHOPWARE_API_URL}/search/product`, {
            filter: [
                {
                    type: 'equals',
                    field: 'name',
                    value: name
                }
            ]
        }, {
            headers: {
                'Accept': 'application/vnd.api+json, application/json',
                'Content-Type': 'application/json',
                'Authorization': req.headers['Authorization']
            }
        });
        res.json(response.data.data);
    }
    catch (error) {
        console.error('Error fetching products by name:', error);
        if (axios_1.default.isAxiosError(error)) {
            res.status(500).send(((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
        }
        else {
            res.status(500).send('An unknown error occurred');
        }
    }
}));
exports.default = router;
