import { ApiResponseException } from '@/exception';

export interface CatchFn {
    (
        exception: ApiResponseException,
    ): ApiResponseException | Promise<ApiResponseException> | void;
}

export interface OnAbortFn {
    (event: Event): void;
}
