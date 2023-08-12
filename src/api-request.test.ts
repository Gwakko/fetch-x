import { ApiRequest } from './api-request';
import { ValidationSchema } from './interface';

describe('ApiRequest', () => {
    describe('Constructor', () => {
        it('should correctly initialize the ApiRequest class', () => {
            const mockResponse = new Response('test response');
            const apiRequest = new ApiRequest((resolve) =>
                resolve(mockResponse),
            );

            expect(apiRequest).toBeInstanceOf(ApiRequest);
            expect(apiRequest).toBeInstanceOf(Promise);
        });
    });

    describe('from() method', () => {
        it('should transform a promise into an ApiRequest instance and parse the response', async () => {
            const mockResponse = new Response(JSON.stringify({ data: 'test' }));
            const promise = Promise.resolve(mockResponse);

            const apiRequest = ApiRequest.from(promise);

            expect(apiRequest).toBeInstanceOf(ApiRequest);

            const result = await apiRequest.json();
            expect(result).toEqual({ data: 'test' });
        });
    });

    describe('response() method', () => {
        it('should process the response correctly', async () => {
            const mockResponse = new Response('test response');
            const apiRequest = new ApiRequest((resolve) =>
                resolve(mockResponse),
            );

            const result = await apiRequest.response();

            expect(result).toBeInstanceOf(Response);
            expect(await result.text()).toBe('test response');
        });
    });

    describe('json() method', () => {
        it('should parse the response as JSON', async () => {
            const mockData = { key: 'value' };
            const mockResponse = new Response(JSON.stringify(mockData));
            const apiRequest = new ApiRequest((resolve) =>
                resolve(mockResponse),
            );

            const result = await apiRequest.json();

            expect(result).toEqual(mockData);
        });
    });

    describe('text() method', () => {
        it('should parse the response as JSON', async () => {
            const mockData = { key: 'value' };
            const mockResponse = new Response(JSON.stringify(mockData));
            const apiRequest = new ApiRequest((resolve) =>
                resolve(mockResponse),
            );

            const result = await apiRequest.text();

            expect(result).toEqual(JSON.stringify(mockData));
        });
    });
    
    describe('validated() method', () => {
        it('should throw an error if no resolver is provided', async () => {
            const mockResponse = new Response('{}');
            const apiRequest = new ApiRequest((resolve) =>
                resolve(mockResponse),
            );

            await expect(apiRequest.validated()).rejects.toThrow(
                'Invalid resolver',
            );
        });

        it('should validate using the provided resolver', async () => {
            const mockData = { key: 'value' };
            const mockResponse = new Response(JSON.stringify(mockData));
            const resolver: ValidationSchema<unknown> = {
                parse: (data: unknown) => {
                    if (
                        !!data &&
                        typeof data === 'object' &&
                        'key' in data &&
                        data.key === 'value'
                    ) {
                        return data;
                    }

                    throw new Error('Validation failed');
                },
            };
            const apiRequest = new ApiRequest(
                (resolve) => resolve(mockResponse),
                resolver,
            );

            const result = await apiRequest.validated();

            expect(result).toEqual(mockData);
        });
    });
});
