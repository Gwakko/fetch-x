export interface RefreshTokenInterceptor {
    (): Promise<string | null>;
}
