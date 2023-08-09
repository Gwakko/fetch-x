export const isFunction = (fn) => !!fn && typeof fn === 'function';
export const isValidURL = (urlString) => {
    try {
        new URL(urlString);
        return true;
    }
    catch (_) {
        return false;
    }
};
