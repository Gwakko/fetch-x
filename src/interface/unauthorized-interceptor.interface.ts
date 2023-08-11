import { RequestBody } from '@/types';
import { Api } from '@/api';

export interface UnauthorizedInterceptor<
    TResponseBody,
    TRequestData extends RequestBody,
> {
    (self: Api<TResponseBody, TRequestData>): Promise<void>;
}
