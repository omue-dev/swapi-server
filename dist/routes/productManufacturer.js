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
const router = (0, express_1.Router)();
const SHOPWARE_API_URL = 'https://www.weltenbummler-erkelenz.de/api';
router.post('/search/product-manufacturer', authenticate_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const response = yield axios_1.default.post(`${SHOPWARE_API_URL}/search/product-manufacturer`, {
            limit: 5000,
            filter: [
                {
                    type: 'not',
                    field: 'products.id',
                    value: null
                },
                {
                    type: 'not',
                    field: 'media.id',
                    value: null
                }
            ]
        }, {
            headers: {
                'Accept': 'application/vnd.api+json, application/json',
                'Content-Type': 'application/json',
                'Authorization': req.headers['Authorization']
            }
        });
        const manufacturersWithMedia = response.data.data.filter((item) => item.attributes.mediaId);
        //console.log('Manufacturers with Products and Media:', manufacturersWithMedia); // Protokolliere die Hersteller mit Media
        res.json({ data: manufacturersWithMedia });
    }
    catch (error) {
        console.error('Error fetching manufacturers:', error);
        if (axios_1.default.isAxiosError(error)) {
            res.status(500).send(((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        }
        else {
            res.status(500).send('An unknown error occurred');
        }
    }
}));
exports.default = router;
