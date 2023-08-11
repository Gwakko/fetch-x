import { RequestInterceptor } from './request-interceptor.interface';
import { ResponseInterceptor } from './response-interceptor.interface';
import { RefreshTokenInterceptor } from './refresh-token-iterceptor.interface';

export interface Interceptor {
    request: RequestInterceptor[];
    response: ResponseInterceptor[];
    refreshToken: RefreshTokenInterceptor | null;
}
