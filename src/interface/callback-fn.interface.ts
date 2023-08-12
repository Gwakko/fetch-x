import { ApiResponseException } from '@/exception';

export interface CatchFn {
    (exception: ApiResponseException): ApiResponseException | unknown;
}

export interface OnAbortFn {
    (event: Event): void;
}
