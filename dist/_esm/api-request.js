import { isFunction } from './utils';
export class ApiRequest extends Promise {
    resolver;
    resolverOptions;
    constructor(executor, resolver, resolverOptions) {
        super(executor);
        this.resolver = resolver;
        this.resolverOptions = resolverOptions;
    }
    static from(promise) {
        return new this(async (resolve, reject) => {
            try {
                const response = await promise;
                const result = await response.json();
                resolve(result);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async response(onFulfilled, onRejected) {
        return this.then(onFulfilled, onRejected);
    }
    async json(onFulfilled, onRejected) {
        return this.response((response) => response.json()).then(onFulfilled, onRejected);
    }
    async text(onFulfilled, onRejected) {
        return this.response((response) => response.text()).then(onFulfilled, onRejected);
    }
    async blob(onFulfilled, onRejected) {
        return this.response((response) => response.blob()).then(onFulfilled, onRejected);
    }
    async arrayBuffer(onFulfilled, onRejected) {
        return this.response((response) => response.arrayBuffer()).then(onFulfilled, onRejected);
    }
    async formData(onFulfilled, onRejected) {
        return this.response((response) => response.formData()).then(onFulfilled, onRejected);
    }
    async validated(onFulfilled, onRejected) {
        try {
            const response = await this.response();
            const data = await response.clone().json();
            return Promise.resolve(this.validate(data)).then(onFulfilled, onRejected);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    validate(data) {
        if (!this.resolver) {
            throw new Error('Invalid resolver');
        }
        if (!this.resolverOptions?.safe &&
            'parse' in this.resolver &&
            isFunction(this.resolver.parse)) {
            return this.resolver.parse(data);
        }
        if (this.resolverOptions?.safe &&
            'safeParse' in this.resolver &&
            isFunction(this.resolver.safeParse)) {
            return this.resolver.safeParse(data);
        }
        throw new Error('Invalid resolver');
    }
}
