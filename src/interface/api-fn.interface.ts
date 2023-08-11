import { ApiDefaults } from './api-defaults.interface';
import { RequestBody } from '@/types';
import { Api } from '@/api';

export interface ApiFn {
    defaults: ApiDefaults;

    <TResponseData = unknown, TRequestData extends RequestBody = RequestBody>(
        endpointUrl?: string,
    ): Api<TResponseData, TRequestData>;
}
