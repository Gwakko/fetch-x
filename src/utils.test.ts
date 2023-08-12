import { isFunction, isValidURL } from './utils';

describe('Utils', () => {
    describe('isFunction', () => {
        it('should return true for functions', () => {
            const testFunction = () => {};
            expect(isFunction(testFunction)).toBe(true);
        });

        it('should return false for non-functions', () => {
            expect(isFunction(123)).toBe(false);
            expect(isFunction('string')).toBe(false);
            expect(isFunction({})).toBe(false);
            expect(isFunction([])).toBe(false);
            expect(isFunction(null)).toBe(false);
            expect(isFunction(undefined)).toBe(false);
        });
    });

    describe('isValidURL', () => {
        it('should return true for valid URLs', () => {
            expect(isValidURL('https://www.example.com')).toBe(true);
            expect(isValidURL('https://www.example.com?test=1')).toBe(true);
            expect(isValidURL('http://localhost:3000')).toBe(true);
            expect(isValidURL('ftp://files.example.com')).toBe(true);
        });

        it('should return false for invalid URLs', () => {
            expect(isValidURL('invalidurl')).toBe(false);
            expect(isValidURL('http//example.com')).toBe(false); // Missing colon
            expect(isValidURL('')).toBe(false);
            expect(isValidURL(' ')).toBe(false);
            expect(isValidURL('example.com')).toBe(false); // Missing protocol
        });
    });
});
