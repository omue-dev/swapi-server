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
const axios_1 = __importDefault(require("axios"));
const SHOPWARE_API_URL = 'https://www.weltenbummler-erkelenz.de/api';
let cachedToken = null;
const getAuthToken = () => __awaiter(void 0, void 0, void 0, function* () {
    if (cachedToken) {
        return cachedToken;
    }
    try {
        const response = yield axios_1.default.post(`${SHOPWARE_API_URL}/oauth/token`, {
            client_id: 'administration',
            grant_type: 'password',
            scopes: 'read',
            username: 'omueller', // Ersetzen Sie diesen Wert durch Ihren tatsächlichen Benutzername
            password: '9UC&tj^1nHPef$' // Ersetzen Sie diesen Wert durch Ihr tatsächliches Passwort
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        cachedToken = response.data.access_token;
        setTimeout(() => {
            cachedToken = null;
        }, (response.data.expires_in - 60) * 1000); // Erneuern 1 Minute vor Ablauf
        return cachedToken;
    }
    catch (error) {
        console.error('Error fetching auth token:', error);
        throw error;
    }
});
exports.default = getAuthToken;
