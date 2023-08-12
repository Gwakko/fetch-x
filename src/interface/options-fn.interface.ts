export interface OptionsFn {
    (options?: RequestInit): RequestInit | undefined;
}
