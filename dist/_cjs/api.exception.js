"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiException = void 0;
class ApiException extends Error {
    status;
    response;
    url;
    text;
    json;
    constructor(status, response, url, text, json, message) {
        super(message);
        this.status = status;
        this.response = response;
        this.url = url;
        this.text = text;
        this.json = json;
        this.name = 'ApiException';
    }
}
exports.ApiException = ApiException;
