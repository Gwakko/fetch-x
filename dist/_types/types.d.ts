import { ValidationSchema, ValidationSchemaSafe } from './interface';
export type RequestResolver<TResponseData> = ValidationSchema<TResponseData> | ValidationSchemaSafe<TResponseData>;
export type RequestResolverOptions = {
    safe?: boolean;
};
export type RequestEndpoint = URL | string;
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | string;
export type RequestSearchParams = Record<string, string>;
export type RequestBody = BodyInit | Record<string, unknown>;
export type OnFulfilledResponse<TResult, TValue> = ((value: TValue) => TResult | PromiseLike<TResult>) | undefined | null;
export type OnRejectedResponse<TResult> = ((reason: unknown) => TResult | PromiseLike<TResult>) | undefined | null;
