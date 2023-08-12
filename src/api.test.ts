import { api, Api } from './api';
import { ApiException } from './exception';
import { expect } from '@jest/globals';

describe('Api', () => {
    describe('Constructor', () => {
        it('should correctly initialize the Api class', () => {
            const apiInstance = new Api();
            expect(apiInstance).toBeInstanceOf(Api);
        });
    });

    describe('Request methods', () => {
        let mockFetch: jest.Mock;

        beforeEach(() => {
            mockFetch = jest.fn();
            global.fetch = mockFetch;
        });

        it('should correctly set up a GET request', async () => {
            mockFetch.mockResolvedValueOnce(
                new Response(JSON.stringify({ data: 'test' })),
            );

            const apiInstance = new Api();
            await apiInstance.url('https://example.com/api').get();

            expect(mockFetch).toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith(
                new URL('https://example.com/api'),
                expect.objectContaining({
                    method: 'GET',
                }),
            );
        });

        it('should send data in the body for POST request', async () => {
            mockFetch.mockResolvedValueOnce(
                new Response(JSON.stringify({ data: 'test' })),
            );

            const apiInstance = new Api();
            const data = { key: 'value' };
            await apiInstance.url('https://example.com').post(data);

            expect(mockFetch).toHaveBeenCalledWith(
                new URL('https://example.com'),
                expect.objectContaining({
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    method: 'POST',
                    body: JSON.stringify(data),
                }),
            );
        });

        it('should send data in the body for PUT request', async () => {
            mockFetch.mockResolvedValueOnce(
                new Response(JSON.stringify({ data: 'test' })),
            );

            const apiInstance = new Api();
            const data = { key: 'value' };
            await apiInstance.url('https://example.com').put(data);

            expect(mockFetch).toHaveBeenCalledWith(
                new URL('https://example.com'),
                expect.objectContaining({
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    method: 'PUT',
                    body: JSON.stringify(data),
                }),
            );
        });

        it('should send data in the body for PATCH request', async () => {
            mockFetch.mockResolvedValueOnce(
                new Response(JSON.stringify({ data: 'test' })),
            );

            const apiInstance = new Api();
            const data = { key: 'value' };
            await apiInstance.url('https://example.com').patch(data);

            expect(mockFetch).toHaveBeenCalledWith(
                new URL('https://example.com'),
                expect.objectContaining({
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    method: 'PATCH',
                    body: JSON.stringify(data),
                }),
            );
        });

        it('should send data in the body for DELETE request', async () => {
            mockFetch.mockResolvedValueOnce(
                new Response(JSON.stringify({ data: 'test' })),
            );

            const apiInstance = new Api();
            await apiInstance.url('https://example.com/1').delete();

            expect(mockFetch).toHaveBeenCalledWith(
                new URL('https://example.com/1'),
                expect.objectContaining({
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    method: 'DELETE',
                }),
            );
        });
    });

    describe('Interceptors', () => {
        let mockFetch: jest.Mock;

        beforeEach(() => {
            mockFetch = jest.fn();
            global.fetch = mockFetch;
            mockFetch.mockResolvedValueOnce(
                new Response(JSON.stringify({ data: 'test' })),
            );
        });

        describe('Request Interceptors', () => {
            it('should correctly add and invoke request interceptors', async () => {
                const interceptor1 = jest.fn((request) => request);
                const interceptor2 = jest.fn((request) => {
                    request.headers['X-Test-Header'] = 'test-value';
                    return request;
                });

                api.defaults.interceptors.request.push(interceptor1);
                api.defaults.interceptors.request.push(interceptor2);

                const apiInstance = api();

                await apiInstance.url('https://example.com').get();

                expect(interceptor1).toHaveBeenCalled();
                expect(interceptor2).toHaveBeenCalled();
                expect(mockFetch).toHaveBeenCalledWith(
                    new URL('https://example.com'),
                    expect.objectContaining({
                        headers: expect.objectContaining({
                            'X-Test-Header': 'test-value',
                        }),
                    }),
                );
            });
        });
    });

    describe('Error Handling', () => {
        let mockFetch: jest.Mock;

        beforeEach(() => {
            mockFetch = jest.fn();
            global.fetch = mockFetch;
        });

        // describe('Network Errors', () => {
        //     it('should handle network errors correctly', async () => {
        //         mockFetch.mockRejectedValueOnce(new Error('Network Error'));
        //
        //         const apiInstance = new Api();
        //
        //         await expect(
        //             apiInstance.url('https://example.com').get(),
        //         ).rejects.toThrow('Network Error');
        //     });
        // });

        describe('API Response Errors', () => {
            it('should throw an ApiException for a 404 response', async () => {
                const mockErrorResponse = new Response('Not Found', {
                    status: 404,
                });
                mockFetch.mockResolvedValueOnce(mockErrorResponse);

                const apiInstance = new Api();

                const response = apiInstance.url('https://example.com').get();

                await expect(response).rejects.toThrowError(ApiException);
                await expect(response).rejects.toThrow('Not Found');
            });

            it('should throw an ApiException for a 500 response', async () => {
                const mockErrorResponse = new Response(
                    'Internal Server Error',
                    { status: 500 },
                );
                mockFetch.mockResolvedValueOnce(mockErrorResponse);

                const apiInstance = new Api();

                const response = apiInstance.url('https://example.com').get();

                await expect(response).rejects.toThrowError(ApiException);
                await expect(response).rejects.toThrow('Internal Server Error');
            });
        });

        // describe('Interceptor Errors', () => {
        //     it('should handle errors thrown in request interceptors', async () => {
        //         const errorInterceptor = jest.fn(() => {
        //             throw new Error('Interceptor Error');
        //         });
        //
        //         api.defaults.interceptors.request.push(errorInterceptor);
        //
        //         const apiInstance = api();
        //
        //         await expect(
        //             apiInstance.url('https://example.com').get(),
        //         ).rejects.toThrow('Interceptor Error');
        //     });
        //
        //     it('should handle errors thrown in response interceptors', async () => {
        //         const mockResponse = new Response(
        //             JSON.stringify({ data: 'test' }),
        //         );
        //         mockFetch.mockResolvedValueOnce(mockResponse);
        //
        //         const errorInterceptor = jest.fn(() => {
        //             throw new Error('Interceptor Error');
        //         });
        //
        //         api.defaults.interceptors.response.push(errorInterceptor);
        //
        //         const apiInstance = api();
        //
        //         await expect(
        //             apiInstance.url('https://example.com').get(),
        //         ).rejects.toThrow('Interceptor Error');
        //     });
        // });
    });
});
