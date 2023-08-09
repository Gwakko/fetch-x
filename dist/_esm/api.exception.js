export class ApiException extends Error {
    status;
    response;
    url;
    text;
    json;
    constructor(status, response, url, text, json, message) {
        super(message);
        this.status = status;
        this.response = response;
        this.url = url;
        this.text = text;
        this.json = json;
        this.name = 'ApiException';
    }
}
