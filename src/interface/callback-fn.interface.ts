import { ApiResponseException } from '@/exception';

export interface CatchFn {
    (exception: ApiResponseException): ApiResponseException;
}

export interface OnAbortFn {
    (event: Event): void;
}
