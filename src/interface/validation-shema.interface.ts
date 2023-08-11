export interface ValidationSchema<TData> {
    parse: (data: unknown) => TData;
}

export interface ValidationSchemaSafe<TData> {
    safeParse: (data: unknown) => TData;
}
