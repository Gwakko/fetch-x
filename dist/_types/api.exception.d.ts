export interface ApiResponseException {
    status: number;
    response: Response;
    url: string;
    text?: string;
    json?: unknown;
}
export declare class ApiException extends Error implements ApiResponseException {
    readonly status: number;
    readonly response: Response;
    readonly url: string;
    readonly text?: string | undefined;
    readonly json?: unknown;
    constructor(status: number, response: Response, url: string, text?: string | undefined, json?: unknown, message?: string);
}
