"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.fetchx = void 0;
__exportStar(require("./constants"), exports);
__exportStar(require("./utils"), exports);
__exportStar(require("./types"), exports);
__exportStar(require("./validation-shema.interface"), exports);
__exportStar(require("./api.exception"), exports);
__exportStar(require("./api-request"), exports);
__exportStar(require("./api"), exports);
var api_1 = require("./api");
Object.defineProperty(exports, "fetchx", { enumerable: true, get: function () { return api_1.api; } });
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return api_1.api; } });