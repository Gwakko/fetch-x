import type {
    OnFulfilledResponse,
    OnRejectedResponse,
    RequestResolver,
    RequestResolverOptions,
} from './types';
import { isFunction } from './utils';
import { ResolverException } from './exception';

export class ApiRequest<
    TResponseBody = unknown,
    T extends Response = Response,
> extends Promise<T> {
    constructor(
        executor: (
            resolve: (value: T | PromiseLike<T>) => void,
            reject: (reason?: unknown) => void,
        ) => void,
        private readonly resolver?: RequestResolver<TResponseBody>,
        private readonly resolverOptions?: RequestResolverOptions,
    ) {
        super(executor);
    }

    public static from<T extends Response>(promise: Promise<T>): ApiRequest<T> {
        return new this(async (resolve, reject) => {
            try {
                const response = await promise;
                resolve(response);
            } catch (error) {
                reject(error);
            }
        });
    }

    public async response<TResult1 = Response, TResult2 = never>(
        onFulfilled?: OnFulfilledResponse<TResult1, Response>,
        onRejected?: OnRejectedResponse<TResult2>,
    ): Promise<TResult1 | TResult2> {
        return this.then(onFulfilled, onRejected);
    }

    public async json<TResult1 = TResponseBody, TResult2 = never>(
        onFulfilled?: OnFulfilledResponse<TResult1, TResponseBody>,
        onRejected?: OnRejectedResponse<TResult2>,
    ): Promise<TResult1 | TResult2> {
        return this.response((response) => response.json()).then(
            onFulfilled,
            onRejected,
        );
    }

    public async text<TResult1 = string, TResult2 = never>(
        onFulfilled?: OnFulfilledResponse<TResult1, string>,
        onRejected?: OnRejectedResponse<TResult2>,
    ): Promise<TResult1 | TResult2> {
        return this.response((response) => response.text()).then(
            onFulfilled,
            onRejected,
        );
    }

    public async blob<TResult1 = Blob, TResult2 = never>(
        onFulfilled?: OnFulfilledResponse<TResult1, Blob>,
        onRejected?: OnRejectedResponse<TResult2>,
    ): Promise<TResult1 | TResult2> {
        return this.response((response) => response.blob()).then(
            onFulfilled,
            onRejected,
        );
    }

    public async arrayBuffer<TResult1 = ArrayBuffer, TResult2 = never>(
        onFulfilled?: OnFulfilledResponse<TResult1, ArrayBuffer>,
        onRejected?: OnRejectedResponse<TResult2>,
    ): Promise<TResult1 | TResult2> {
        return this.response((response) => response.arrayBuffer()).then(
            onFulfilled,
            onRejected,
        );
    }

    public async formData<TResult1 = FormData, TResult2 = never>(
        onFulfilled?: OnFulfilledResponse<TResult1, FormData>,
        onRejected?: OnRejectedResponse<TResult2>,
    ): Promise<TResult1 | TResult2> {
        return this.response((response) => response.formData()).then(
            onFulfilled,
            onRejected,
        );
    }

    public async validated<TResult1 = TResponseBody, TResult2 = never>(
        onFulfilled?: OnFulfilledResponse<TResult1, TResponseBody>,
        onRejected?: OnRejectedResponse<TResult2>,
    ): Promise<TResult1 | TResult2> {
        try {
            const response = await this.response();

            const data = await response.clone().json();

            return Promise.resolve(this.validate(data)).then(
                onFulfilled,
                onRejected,
            );
        } catch (e) {
            return Promise.reject<TResult2>(e);
        }
    }

    private validate(data: unknown): TResponseBody {
        if (!this.resolver) {
            throw new ResolverException();
        }

        if (
            !this.resolverOptions?.safe &&
            'parse' in this.resolver &&
            isFunction(this.resolver.parse)
        ) {
            return this.resolver.parse(data);
        }

        if (
            this.resolverOptions?.safe &&
            'safeParse' in this.resolver &&
            isFunction(this.resolver.safeParse)
        ) {
            return this.resolver.safeParse(data);
        }

        throw new ResolverException();
    }
}
