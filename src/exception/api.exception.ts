export interface ApiResponseException {
    status: number;
    response: Response;
    url: string;
    text?: string;
    json?: unknown;
}

export class ApiException extends Error implements ApiResponseException {
    constructor(
        public readonly status: number,
        public readonly response: Response,
        public readonly url: string,
        public readonly text?: string,
        public readonly json?: unknown,
        message?: string,
    ) {
        super(message);
        this.name = 'ApiException';
    }
}
