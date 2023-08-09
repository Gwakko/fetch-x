"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidURL = exports.isFunction = void 0;
const isFunction = (fn) => !!fn && typeof fn === 'function';
exports.isFunction = isFunction;
const isValidURL = (urlString) => {
    try {
        new URL(urlString);
        return true;
    }
    catch (_) {
        return false;
    }
};
exports.isValidURL = isValidURL;
