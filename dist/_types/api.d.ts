import { ApiResponseException } from './api.exception';
import { ApiRequest } from './api-request';
import { RequestBody, RequestEndpoint, RequestMethod, RequestResolver, RequestResolverOptions, RequestSearchParams } from './types';
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
    <TResponseData = unknown, TRequestData extends RequestBody = RequestBody>(endpointUrl?: string): Api<TResponseData, TRequestData>;
}
export declare class Api<TResponseBody, TRequestData extends RequestBody> {
    private readonly baseUrl?;
    private _interceptors;
    private _catches;
    private _headers?;
    private _options?;
    private _baseOptions?;
    private _url;
    private _method;
    private _searchParams;
    private _body?;
    private _resolver?;
    private _resolverOptions;
    private _abortController?;
    private _onAbortSignalFn?;
    private _replaceSearchParams;
    private _contentType;
    private _authorization?;
    private _retries;
    private _refreshRetries;
    constructor(baseUrl?: RequestEndpoint | undefined, options?: RequestInit);
    headers(headers?: HeadersInit): this;
    contentType(type: string): this;
    authorization(authorization: string): this;
    options(options: RequestInit): this;
    url(url: RequestEndpoint): this;
    searchParams(params: RequestSearchParams | null, replace?: boolean): this;
    abortController(controller: AbortController): this;
    onAbort(onAbortFn: OnAbortFn): this;
    retries(retries: number): this;
    get(): ApiRequest<TResponseBody>;
    post(body?: TRequestData): ApiRequest<TResponseBody>;
    put(body?: TRequestData): ApiRequest<TResponseBody>;
    patch(body?: TRequestData): ApiRequest<TResponseBody>;
    delete(body?: TRequestData): ApiRequest<TResponseBody>;
    setRequestOptions<TRequestData extends RequestBody>(method: RequestMethod, body?: TRequestData): this;
    resolver(schema: RequestResolver<TResponseBody>, options?: RequestResolverOptions): this;
    error(statusCode: number | symbol, catchFn: CatchFn): this;
    badRequest(catchFn: CatchFn): this;
    unauthorized(catchFn: CatchFn): this;
    forbidden(catchFn: CatchFn): this;
    notFound(catchFn: CatchFn): this;
    timeout(catchFn: CatchFn): this;
    internalError(catchFn: CatchFn): this;
    fetchError(catchFn: CatchFn): this;
    private fetch;
    private processRefreshToken;
    private processResponseError;
    private assembleRequestUrl;
    private assembleRequestInit;
    private prepareRequestOptions;
    private prepareRequestBody;
}
declare const api: ApiFn;
export { api };
