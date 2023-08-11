export interface RequestInterceptorResult {
    url?: URL;
    request?: RequestInit;
}

export interface RequestInterceptor {
    (request?: RequestInit): RequestInterceptorResult | undefined | void;
}
