import { RequestEndpoint } from '@/types';
import { CatchFn } from './callback-fn.interface';
import { Interceptor } from './interceptor.interface';

export interface ApiDefaults {
    baseUrl?: RequestEndpoint;
    interceptors: Interceptor;
    headers: HeadersInit;
    requestOptions: RequestInit;
    catches: Map<number | symbol, CatchFn>;
}
