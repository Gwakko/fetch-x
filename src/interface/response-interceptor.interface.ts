export interface ResponseInterceptor {
    (response: Response): void;
}
