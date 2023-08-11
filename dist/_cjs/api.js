"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.Api = void 0;
const constants_1 = require("./constants");
const exception_1 = require("./exception");
const api_request_1 = require("./api-request");
const utils_1 = require("./utils");
const defaultSchemaOptions = {
    safe: false,
};
const defaults = {
    ...(typeof window !== 'undefined' && { baseUrl: window.location.origin }),
    interceptors: {
        request: [],
        response: [],
        refreshToken: null,
    },
    headers: {},
    requestOptions: {},
    catches: new Map(),
};
class Api {
    baseUrl;
    _interceptors = {
        request: [],
        response: [],
        refreshToken: null,
    };
    _catches;
    _headers;
    _options;
    _baseOptions;
    _url = '';
    _method = 'GET';
    _searchParams = null;
    _body;
    _resolver;
    _resolverOptions;
    _abortController;
    _onAbortSignalFn;
    _replaceSearchParams = false;
    _contentType;
    _authorization;
    _onUnauthorizedFn;
    _retries = 0;
    _refreshRetries = 1;
    constructor(baseUrl, options) {
        this.baseUrl = baseUrl;
        if (this.baseUrl && !(0, utils_1.isValidURL)(this.baseUrl)) {
            throw new Error('Invalid base URL');
        }
        if (!this.baseUrl && defaults.baseUrl) {
            if (!(0, utils_1.isValidURL)(defaults.baseUrl)) {
                throw new Error('Invalid default base URL');
            }
            this.baseUrl = defaults.baseUrl;
        }
        this._catches = new Map(defaults.catches);
        this._baseOptions = {
            ...structuredClone(defaults.requestOptions),
            ...options,
        };
        this._headers = structuredClone(defaults.headers);
        this._resolverOptions = structuredClone(defaultSchemaOptions);
        this._interceptors = structuredClone(defaults.interceptors);
    }
    headers(headers) {
        if ((0, utils_1.isFunction)(headers)) {
            this._headers = headers(this._headers);
        }
        else {
            this._headers = headers;
        }
        return this;
    }
    contentType(type) {
        this._contentType = type;
        return this;
    }
    authorization(authorization) {
        this._authorization = authorization;
        return this;
    }
    options(options) {
        this._options = options;
        return this;
    }
    url(url) {
        this._url = url;
        return this;
    }
    searchParams(params, replace = false) {
        this._searchParams = params;
        this._replaceSearchParams = replace;
        return this;
    }
    abortController(controller) {
        this._abortController = controller;
        return this;
    }
    onAbort(onAbortFn) {
        this._onAbortSignalFn = onAbortFn;
        return this;
    }
    retries(retries) {
        if (retries < 0) {
            throw new Error(`Invalid retries(${retries}) value`);
        }
        this._retries = retries;
        return this;
    }
    get() {
        this.setRequestOptions('GET');
        return this.fetch();
    }
    post(body) {
        this.setRequestOptions('POST', body);
        return this.fetch();
    }
    put(body) {
        this.setRequestOptions('PUT', body);
        return this.fetch();
    }
    patch(body) {
        this.setRequestOptions('PATCH', body);
        return this.fetch();
    }
    delete(body) {
        this.setRequestOptions('DELETE', body);
        return this.fetch();
    }
    setRequestOptions(method, body) {
        this._method = method;
        this._body = body;
        return this;
    }
    resolver(schema, options) {
        this._resolver = schema;
        if (options) {
            this._resolverOptions = { ...this._resolverOptions, ...options };
        }
        return this;
    }
    error(statusCode, catchFn) {
        this._catches.set(statusCode, catchFn);
        return this;
    }
    badRequest(catchFn) {
        return this.error(constants_1.HttpStatusCode.BAD_REQUEST, catchFn);
    }
    unauthorized(catchFn) {
        return this.error(constants_1.HttpStatusCode.UNAUTHORIZED, catchFn);
    }
    forbidden(catchFn) {
        return this.error(constants_1.HttpStatusCode.FORBIDDEN, catchFn);
    }
    notFound(catchFn) {
        return this.error(constants_1.HttpStatusCode.NOT_FOUND, catchFn);
    }
    timeout(catchFn) {
        return this.error(constants_1.HttpStatusCode.REQUEST_TIMEOUT, catchFn);
    }
    internalError(catchFn) {
        return this.error(constants_1.HttpStatusCode.INTERNAL_SERVER_ERROR, catchFn);
    }
    fetchError(catchFn) {
        return this.error(constants_1.FETCH_ERROR, catchFn);
    }
    onUnauthorized(unauthorizedFn) {
        this._onUnauthorizedFn = unauthorizedFn;
        return this;
    }
    fetch() {
        return new api_request_1.ApiRequest(async (resolve, reject) => {
            if (this._onAbortSignalFn) {
                this._abortController?.signal?.addEventListener('abort', this._onAbortSignalFn);
            }
            const url = this.assembleRequestUrl();
            const request = this.assembleRequestInit();
            const response = await fetch(url, request);
            if (this._onAbortSignalFn) {
                this._abortController?.signal?.removeEventListener('abort', this._onAbortSignalFn);
            }
            this._interceptors.response.forEach((interceptor) => interceptor(response));
            if (response.status === constants_1.HttpStatusCode.UNAUTHORIZED) {
                const resolved = await this.processUnauthorized();
                if (resolved) {
                    resolve(this.fetch());
                }
            }
            if (!response.ok) {
                if (this._retries > 0) {
                    --this._retries;
                    resolve(this.fetch());
                }
                reject(this.processResponseError(response));
            }
            resolve(response);
        }, this._resolver, this._resolverOptions);
    }
    async processRefreshToken() {
        if (this._refreshRetries <= 0) {
            return Promise.resolve(false);
        }
        --this._refreshRetries;
        try {
            const authorization = await this._interceptors.refreshToken?.();
            if (authorization) {
                this.authorization(authorization);
                return Promise.resolve(true);
            }
        }
        catch (error) {
            console.log(error);
        }
        return Promise.resolve(false);
    }
    async processUnauthorized() {
        try {
            if (this._onUnauthorizedFn) {
                await this._onUnauthorizedFn(this);
                return Promise.resolve(true);
            }
            if (this._interceptors.refreshToken) {
                return this.processRefreshToken();
            }
        }
        catch (error) {
            console.log(error);
        }
        return Promise.resolve(false);
    }
    async processResponseError(response) {
        const textBody = await response.clone().text();
        let json = undefined;
        try {
            json = await response.clone().json();
        }
        catch (_) {
            json = undefined;
        }
        const apiException = new exception_1.ApiException(response.status, response.clone(), response.url, textBody, json, textBody);
        if (this._catches.has(apiException.status)) {
            return (this._catches.get(apiException.status)?.(apiException) ??
                apiException);
        }
        if (this._catches.has(constants_1.FETCH_ERROR)) {
            return (this._catches.get(constants_1.FETCH_ERROR)?.(apiException) ?? apiException);
        }
        return apiException;
    }
    assembleRequestUrl() {
        if (!this._url) {
            throw new Error('Invalid request endpoint');
        }
        const url = new URL(this._url, this.baseUrl);
        if (this._searchParams) {
            if (this._replaceSearchParams) {
                url.search = '';
            }
            Object.entries(this._searchParams).forEach(([key, value]) => url.searchParams.set(key, value));
        }
        return url;
    }
    assembleRequestInit() {
        const requestInit = this.prepareRequestOptions();
        if (this._body) {
            requestInit.body = this.prepareRequestBody(this._body);
        }
        this._interceptors.request.forEach((interceptor) => interceptor(requestInit));
        return requestInit;
    }
    prepareRequestOptions() {
        const requestInit = {
            ...this._baseOptions,
            ...this._options,
            headers: {
                ...this._baseOptions?.headers,
                ...this._options?.headers,
                [constants_1.CONTENT_TYPE_HEADER]: this._contentType ?? constants_1.JSON_MIME_TYPE,
                ...(!!this._authorization && {
                    [constants_1.AUTHORIZATION_HEADER]: this._authorization,
                }),
            },
            method: this._method,
            signal: this._abortController?.signal,
        };
        if (this._headers && Object.keys(this._headers).length > 0) {
            requestInit.headers = {
                ...requestInit.headers,
                ...this._headers,
            };
        }
        return requestInit;
    }
    prepareRequestBody(body) {
        if (body instanceof FormData) {
            this.contentType(constants_1.MULTIPART_FORM_DATA_MIME_TYPE);
            return body;
        }
        if (body !== null && typeof body === 'object') {
            this.contentType(constants_1.JSON_MIME_TYPE);
            return JSON.stringify(body);
        }
        if (body !== null && typeof body === 'string' && !this._contentType) {
            this.contentType(constants_1.TEXT_HTML_MIME_TYPE);
        }
        return body;
    }
}
exports.Api = Api;
const api = Object.assign((baseUrl, options) => new Api(baseUrl, options), {
    defaults,
});
exports.api = api;
