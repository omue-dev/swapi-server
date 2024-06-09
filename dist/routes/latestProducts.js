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
// Middleware to check the cache
const checkCache = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10 } = req.query;
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
// Endpoint to fetch products
router.post('/search/product', [authenticate_1.default, checkCache], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { page = 1, limit = 10 } = req.query;
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
        // Map response data to only include necessary fields
        const products = response.data.data.map((item) => {
            const attributes = item.attributes || {}; // Sicherstellen, dass attributes existiert
            return {
                id: item.id,
                manufacturerNumber: attributes.manufacturerNumber || '',
                name: attributes.name || '',
                stock: attributes.stock || 0,
                updatedAt: attributes.updatedAt ? new Date(attributes.updatedAt).toISOString() : ''
            };
        });
        console.log('Fetched and Mapped Products:', products);
        res.json(products);
        // Optionally cache the response
        yield redisClient.set(cacheKey, JSON.stringify(products), { EX: 3600 });
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
exports.default = router;
