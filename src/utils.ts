import { RequestEndpoint } from './types';

export const isFunction = (fn: unknown): fn is CallableFunction =>
    !!fn && typeof fn === 'function';

export const isValidURL = (urlString: RequestEndpoint): boolean => {
    try {
        new URL(urlString);
        return true;
    } catch (_) {
        return false;
    }
};
