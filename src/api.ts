import {
    AUTHORIZATION_HEADER,
    CONTENT_TYPE_HEADER,
    FETCH_ERROR,
    HttpStatusCode,
    JSON_MIME_TYPE,
} from './constants';
import { ApiException, ApiResponseException } from './api.exception';
import { ApiRequest } from './api-request';
import {
    RequestBody,
    RequestEndpoint,
    RequestMethod,
    RequestResolver,
    RequestResolverOptions,
    RequestSearchParams,
} from './types';
import { isValidURL } from './utils';

interface RequestInterceptorResult {
    url?: URL;
    request?: RequestInit;
}

interface RequestInterceptor {
    (request?: RequestInit): RequestInterceptorResult | undefined | void;
}

interface ResponseInterceptor {
    (response: Response): void;
}

interface RefreshTokenInterceptor {
    (): Promise<string | null>;
}

interface Interceptor {
    request: RequestInterceptor[];
    response: ResponseInterceptor[];
    refreshToken: RefreshTokenInterceptor | null;
}

interface CatchFn {
    (exception: ApiResponseException): ApiResponseException;
}

interface OnAbortFn {
    (event: Event): void;
}

interface ApiDefaults {
    baseUrl?: RequestEndpoint;
    interceptors: Interceptor;
    headers: HeadersInit;
    requestOptions: RequestInit;
    catches: Map<number | symbol, CatchFn>;
}

export interface ApiFn {
    defaults: ApiDefaults;

    <TResponseData = unknown, TRequestData extends RequestBody = RequestBody>(
        endpointUrl?: string,
    ): Api<TResponseData, TRequestData>;
}

const defaultSchemaOptions: RequestResolverOptions = {
    safe: false,
};

const defaults: ApiDefaults = {
    ...(typeof window !== 'undefined' && { baseUrl: window.location.origin }),
    interceptors: {
        request: [],
        response: [],
        refreshToken: null,
    },
    headers: {},
    requestOptions: {},
    catches: new Map<number | symbol, CatchFn>(),
};

export class Api<TResponseBody, TRequestData extends RequestBody> {
    private _interceptors: Interceptor = {
        request: [],
        response: [],
        refreshToken: null,
    };

    private _catches: Map<number | symbol, CatchFn>;

    private _headers?: HeadersInit;
    private _options?: RequestInit;
    private _baseOptions?: RequestInit;
    private _url: RequestEndpoint = '';
    private _method = 'GET';
    private _searchParams: RequestSearchParams | null = null;
    private _body?: RequestBody | null;
    private _resolver?: RequestResolver<TResponseBody>;
    private _resolverOptions: RequestResolverOptions;
    private _abortController?: AbortController;
    private _onAbortSignalFn?: OnAbortFn;
    private _replaceSearchParams = false;
    private _contentType: string = JSON_MIME_TYPE;
    private _authorization?: string;
    private _retries = 0;
    private _refreshRetries = 1;

    constructor(
        private readonly baseUrl?: RequestEndpoint,
        options?: RequestInit,
    ) {
        if (this.baseUrl && !isValidURL(this.baseUrl)) {
            throw new Error('Invalid base URL');
        }

        if (!this.baseUrl && defaults.baseUrl) {
            if (!isValidURL(defaults.baseUrl)) {
                throw new Error('Invalid default base URL');
            }

            this.baseUrl = defaults.baseUrl;
        }

        this._catches = new Map<number | symbol, CatchFn>(defaults.catches);

        this._baseOptions = {
            ...structuredClone(defaults.requestOptions),
            ...options,
        };

        this._headers = structuredClone(defaults.headers);

        this._resolverOptions = structuredClone(defaultSchemaOptions);

        this._interceptors = structuredClone(defaults.interceptors);
    }

    public headers(headers?: HeadersInit): this {
        this._headers = headers;
        return this;
    }

    public contentType(type: string): this {
        this._contentType = type;
        return this;
    }

    public authorization(authorization: string): this {
        this._authorization = authorization;
        return this;
    }

    public options(options: RequestInit): this {
        this._options = options;
        return this;
    }

    public url(url: RequestEndpoint): this {
        this._url = url;
        return this;
    }

    public searchParams(
        params: RequestSearchParams | null,
        replace = false,
    ): this {
        this._searchParams = params;
        this._replaceSearchParams = replace;
        return this;
    }

    public abortController(controller: AbortController): this {
        this._abortController = controller;
        return this;
    }

    public onAbort(onAbortFn: OnAbortFn): this {
        this._onAbortSignalFn = onAbortFn;
        return this;
    }

    public retries(retries: number): this {
        if (retries < 0) {
            throw new Error(`Invalid retries(${retries}) value`);
        }

        this._retries = retries;
        return this;
    }

    public get(): ApiRequest<TResponseBody> {
        this.setRequestOptions('GET');

        return this.fetch();
    }

    public post(body?: TRequestData): ApiRequest<TResponseBody> {
        this.setRequestOptions('POST', body);

        return this.fetch();
    }

    public put(body?: TRequestData): ApiRequest<TResponseBody> {
        this.setRequestOptions('PUT', body);

        return this.fetch();
    }

    public patch(body?: TRequestData): ApiRequest<TResponseBody> {
        this.setRequestOptions('PATCH', body);

        return this.fetch();
    }

    public delete(body?: TRequestData): ApiRequest<TResponseBody> {
        this.setRequestOptions('DELETE', body);

        return this.fetch();
    }

    public setRequestOptions<TRequestData extends RequestBody>(
        method: RequestMethod,
        body?: TRequestData,
    ): this {
        this._method = method;
        this._body = body;
        return this;
    }

    public resolver(
        schema: RequestResolver<TResponseBody>,
        options?: RequestResolverOptions,
    ): this {
        this._resolver = schema;

        if (options) {
            this._resolverOptions = { ...this._resolverOptions, ...options };
        }

        return this;
    }

    public error(statusCode: number | symbol, catchFn: CatchFn): this {
        this._catches.set(statusCode, catchFn);
        return this;
    }

    public badRequest(catchFn: CatchFn): this {
        return this.error(HttpStatusCode.BAD_REQUEST, catchFn);
    }

    public unauthorized(catchFn: CatchFn): this {
        return this.error(HttpStatusCode.UNAUTHORIZED, catchFn);
    }

    public forbidden(catchFn: CatchFn): this {
        return this.error(HttpStatusCode.FORBIDDEN, catchFn);
    }

    public notFound(catchFn: CatchFn): this {
        return this.error(HttpStatusCode.NOT_FOUND, catchFn);
    }

    public timeout(catchFn: CatchFn): this {
        return this.error(HttpStatusCode.REQUEST_TIMEOUT, catchFn);
    }

    public internalError(catchFn: CatchFn): this {
        return this.error(HttpStatusCode.INTERNAL_SERVER_ERROR, catchFn);
    }

    public fetchError(catchFn: CatchFn): this {
        return this.error(FETCH_ERROR, catchFn);
    }

    private fetch(): ApiRequest<TResponseBody> {
        return new ApiRequest<TResponseBody>(
            async (resolve, reject) => {
                if (this._onAbortSignalFn) {
                    this._abortController?.signal?.addEventListener(
                        'abort',
                        this._onAbortSignalFn,
                    );
                }

                const url = this.assembleRequestUrl();
                const request = this.assembleRequestInit();

                const response = await fetch(url, request);

                if (this._onAbortSignalFn) {
                    this._abortController?.signal?.removeEventListener(
                        'abort',
                        this._onAbortSignalFn,
                    );
                }

                this._interceptors.response.forEach((interceptor) =>
                    interceptor(response),
                );

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
            },
            this._resolver,
            this._resolverOptions,
        );
    }

    private async processRefreshToken(): Promise<boolean> {
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

    private async processResponseError(
        response: Response,
    ): Promise<ApiResponseException> {
        const textBody = await response.clone().text();

        let json: unknown = undefined;
        try {
            json = await response.clone().json();
        } catch (_) {
            json = undefined;
        }

        const apiException = new ApiException(
            response.status,
            response.clone(),
            response.url,
            textBody,
            json,
            textBody,
        );

        if (this._catches.has(apiException.status)) {
            return (
                this._catches.get(apiException.status)?.(apiException) ??
                apiException
            );
        }

        if (this._catches.has(FETCH_ERROR)) {
            return (
                this._catches.get(FETCH_ERROR)?.(apiException) ?? apiException
            );
        }

        return apiException;
    }

    private assembleRequestUrl(): URL {
        if (!this._url) {
            throw new Error('Invalid request endpoint');
        }

        const url = new URL(this._url, this.baseUrl);

        if (this._searchParams) {
            if (this._replaceSearchParams) {
                url.search = '';
            }

            Object.entries(this._searchParams).forEach(([key, value]) =>
                url.searchParams.set(key, value),
            );
        }

        return url;
    }

    private assembleRequestInit(): RequestInit {
        const requestInit: RequestInit = this.prepareRequestOptions();

        if (this._body) {
            requestInit.body = this.prepareRequestBody(this._body);
        }

        this._interceptors.request.forEach((interceptor) =>
            interceptor(requestInit),
        );

        return requestInit;
    }

    private prepareRequestOptions(): RequestInit {
        const requestInit: RequestInit = {
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

    private prepareRequestBody(body: unknown): BodyInit | null {
        if (body instanceof FormData) {
            return body;
        }

        if (body !== null && typeof body === 'object') {
            return JSON.stringify(body);
        }

        return body as BodyInit | null;
    }
}

const api: ApiFn = Object.assign(
    <TResponseData, TRequestData extends RequestBody>(
        baseUrl?: string,
        options?: RequestInit,
    ) => new Api<TResponseData, TRequestData>(baseUrl, options),
    {
        defaults,
    },
);

export { api };
