import type { OnFulfilledResponse, OnRejectedResponse, RequestResolver, RequestResolverOptions } from './types';
export declare class ApiRequest<TResponseBody = unknown, T extends Response = Response> extends Promise<T> {
    private readonly resolver?;
    private readonly resolverOptions?;
    constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: unknown) => void) => void, resolver?: RequestResolver<TResponseBody> | undefined, resolverOptions?: RequestResolverOptions | undefined);
    static from<T extends Response>(promise: Promise<T>): ApiRequest<T>;
    response<TResult1 = Response, TResult2 = never>(onFulfilled?: OnFulfilledResponse<TResult1, Response>, onRejected?: OnRejectedResponse<TResult2>): Promise<TResult1 | TResult2>;
    json<TResult1 = TResponseBody, TResult2 = never>(onFulfilled?: OnFulfilledResponse<TResult1, TResponseBody>, onRejected?: OnRejectedResponse<TResult2>): Promise<TResult1 | TResult2>;
    text<TResult1 = string, TResult2 = never>(onFulfilled?: OnFulfilledResponse<TResult1, string>, onRejected?: OnRejectedResponse<TResult2>): Promise<TResult1 | TResult2>;
    blob<TResult1 = Blob, TResult2 = never>(onFulfilled?: OnFulfilledResponse<TResult1, Blob>, onRejected?: OnRejectedResponse<TResult2>): Promise<TResult1 | TResult2>;
    arrayBuffer<TResult1 = ArrayBuffer, TResult2 = never>(onFulfilled?: OnFulfilledResponse<TResult1, ArrayBuffer>, onRejected?: OnRejectedResponse<TResult2>): Promise<TResult1 | TResult2>;
    formData<TResult1 = FormData, TResult2 = never>(onFulfilled?: OnFulfilledResponse<TResult1, FormData>, onRejected?: OnRejectedResponse<TResult2>): Promise<TResult1 | TResult2>;
    validated<TResult1 = TResponseBody, TResult2 = never>(onFulfilled?: OnFulfilledResponse<TResult1, TResponseBody>, onRejected?: OnRejectedResponse<TResult2>): Promise<TResult1 | TResult2>;
    private validate;
}
