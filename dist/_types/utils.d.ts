import { RequestEndpoint } from './types';
export declare const isFunction: (fn: unknown) => fn is CallableFunction;
export declare const isValidURL: (urlString: RequestEndpoint) => boolean;
