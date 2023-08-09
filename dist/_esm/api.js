import { AUTHORIZATION_HEADER, CONTENT_TYPE_HEADER, FETCH_ERROR, HttpStatusCode, JSON_MIME_TYPE, } from './constants';
import { ApiException } from './api.exception';
import { ApiRequest } from './api-request';
import { isValidURL } from './utils';
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
export class Api {
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
    _contentType = JSON_MIME_TYPE;
    _authorization;
    _retries = 0;
    _refreshRetries = 1;
    constructor(baseUrl, options) {
        this.baseUrl = baseUrl;
        if (this.baseUrl && !isValidURL(this.baseUrl)) {
            throw new Error('Invalid base URL');
        }
        if (!this.baseUrl && defaults.baseUrl) {
            if (!isValidURL(defaults.baseUrl)) {
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
        this._headers = headers;
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
        return this.error(HttpStatusCode.BAD_REQUEST, catchFn);
    }
    unauthorized(catchFn) {
        return this.error(HttpStatusCode.UNAUTHORIZED, catchFn);
    }
    forbidden(catchFn) {
        return this.error(HttpStatusCode.FORBIDDEN, catchFn);
    }
    notFound(catchFn) {
        return this.error(HttpStatusCode.NOT_FOUND, catchFn);
    }
    timeout(catchFn) {
        return this.error(HttpStatusCode.REQUEST_TIMEOUT, catchFn);
    }
    internalError(catchFn) {
        return this.error(HttpStatusCode.INTERNAL_SERVER_ERROR, catchFn);
    }
    fetchError(catchFn) {
        return this.error(FETCH_ERROR, catchFn);
    }
    fetch() {
        return new ApiRequest(async (resolve, reject) => {
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
            if (response.status === HttpStatusCode.UNAUTHORIZED) {
                const refreshed = await this.processRefreshToken();
                if (refreshed) {
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
        const authorization = await this._interceptors.refreshToken?.();
        if (authorization) {
            this.authorization(authorization);
            return Promise.resolve(true);
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
        const apiException = new ApiException(response.status, response.clone(), response.url, textBody, json, textBody);
        if (this._catches.has(apiException.status)) {
            return (this._catches.get(apiException.status)?.(apiException) ??
                apiException);
        }
        if (this._catches.has(FETCH_ERROR)) {
            return (this._catches.get(FETCH_ERROR)?.(apiException) ?? apiException);
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
                [CONTENT_TYPE_HEADER]: this._contentType,
                ...(!!this._authorization && {
                    [AUTHORIZATION_HEADER]: this._authorization,
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
            return body;
        }
        if (body !== null && typeof body === 'object') {
            return JSON.stringify(body);
        }
        return body;
    }
}
const api = Object.assign((baseUrl, options) => new Api(baseUrl, options), {
    defaults,
});
export { api };
