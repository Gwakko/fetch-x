export class ResolverException extends Error {
    constructor(message: string = 'Invalid resolver') {
        super(message);
        this.name = 'ResolverException';
    }
}
