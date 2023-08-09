<h1 align="center">
	FetchX
</h1>
<h4 align="center">
	A sleek interface wrapped over fetch, offering both an intuitive syntax and robust response body validation for data assurance.
</h4>

<br />

# Features

#### `fetchx` is a small wrapper around [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) designed to simplify the way to perform network requests and handle responses.

- **Intuitive** - lean API, handles errors, headers and (de)serialization
- **Immutable** - every call creates a cloned instance that can then be reused safely
- **Modular** - intercept requests, responses
- **Compatibility** - crafted for any modern browser supporting the "Fetch API" or Node.js version 18 and newer
- **Type safe** - strongly typed, written in TypeScript
- **Validation Scheme Integration** - Seamlessly validate response bodies using the power of Zod, or with the
  implemented Schema<TData> type.

# Table of Contents

- [**Motivation**](#motivation)
- [**Installation**](#installation)
- [**Usage**](#usage)
- [**Todo**](#todo)
- [**License**](#license)

# Motivation

#### Because Interface or Type Alone Doesn't Guarantee Safety

In the vast realm of web development, simply providing a type or interface to a fetch operation is no silver bullet for
ensuring type safety in responses. This creates an illusion of security, while hidden discrepancies might lurk beneath.
That's where FetchX steps in. We recognize the crucial importance of true type safety, and we've architected our library
to guarantee it. With FetchX, you're not just promised safety — it's delivered. Dive in, and experience the certainty of
genuinely type-safe responses.

```typescript
function api<T>(url: string): Promise<T> {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(response.statusText)
            }
            return response.json() as Promise<T>
        })
}
```

FetchX Secures it with Robust Validation.

```typescript
import { z } from 'zod';
import { UserSchema } from '@/user';

export const SignInSchema = z
    .object({
        username: z.string().nonempty(),
        password: z.string().nonempty(),
    })
    .required();

export type SignInRequest = z.infer<typeof SignInSchema>;

export const SignInResponseSchema = z
    .object({
        accessToken: z.string().nonempty('Invalid Access Token'),
        refreshToken: z.string().nonempty('Invalid Refresh Token'),
        user: UserSchema,
    })
    .required();

export type SignInResponse = z.infer<typeof SignInResponseSchema>;
```

```typescript
const API_BASE_URL = 'http://localhost:8080';
const API_LOGIN_URL = '/api/auth/sign-in';
```

```typescript
const signIn = async ({ email, password }): Promise<User | null> => {
    try {
        const response = await fetchx<SignInResponse, SignInRequest>(
            API_BASE_URL,
        )
            .resolver(SignInResponseSchema)
            .options({ cache: 'no-cache' })
            .url(API_LOGIN_URL)
            .post({
                email,
                password,
            })
            .validated();

        return UserMapper.toAuthUser(response.user);
    } catch (error) {
        console.error(error);
        return null;
    }
};

```

#### Because manually checking and throwing every request error code is tedious.

Fetch won’t reject on HTTP error status.

```typescript
fetch('dashboard')
    .then(response => {
        if (!response.ok) {
            if (response.status === 404) throw new Error('ot found')
            else if (response.status === 401) throw new Error('Unauthorized')
            else if (response.status === 418) throw new Error("I'm a teapot !")
            else throw new Error('Other error')
        } else {// ... }
        }
    })
    .then(data => {/* ... */
    })
    .catch(error => {/* ... */
    })
```

FetchX throws when the response is not successful and contains helper methods to handle common HTTP status codes.

```typescript
fetchx('dashboard')
    .searchParams({ page: String(1) })
    .notFound(error => {/* ... */
    })
    .unauthorized(error => {/* ... */
    })
    .error(HttpStatusCode.IM_A_TEAPOT, error => {/* ... */
    })
    .error(425, error => {/* ... */
    })
    .get()
    .response(response => {/* ... */
    })
    .catch(error => {/* uncaught errors */
    })
```

#### Because sending a json object should be easy.

With fetch you have to set the header, the method and the body manually.

```typescript
fetch('http://api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hello: 'world' })
}).then(response => {/* handle */
})
```

With fetchx, you have shorthands at your disposal.

```typescript
fetchx('http://api')
    .url('/posts')
    .post({ hello: 'world' })
    .response(response => {/* handle */
    })

fetchx('http://api')
    .url('/posts')
    .post(new FormData())
    .then(response => {/* handle */
    })
```

#### Because configuration should not rhyme with repetition.

A Wretch object is immutable which means that you can reuse previous instances safely.

```javascript
// Cross origin authenticated requests on an external API
const apiInstance = fetchx('http://api.localhost') // Base url
    // Authorization header
    .authorization(`Bearer ${accessToken}`)
    // Cors fetch options
    .options({ credentials: "include", mode: "cors" })
    // Handle Any Error
    .fetchError((exception) => {/* handle */
    });

// Fetch a resource
const resource = await apiInstance
    // Add a custom header for this request
    .headers({ 'If-Unmodified-Since': 'Wed, 21 Oct 2015 07:28:00 GMT' })
    .url('/posts/1')
    .get()
    .json((jsonData) => {/* handle */
    });

// Post a resource
apiInstance
    .url('/resource')
    .post({ title: 'new title' })
    .json((jsonData) => {/* handle */
    });
```

# Installation

## Package Manager

```sh
npm i @gwakko/fetch-x # or yarn/pnpm add @gwakko/fetch-x
```

# Usage

## Import

```typescript
// ECMAScript modules
import fetchx from '@gwakko/fetch-x';
import { fetchx } from '@gwakko/fetch-x';
```

## Minimal Example

```typescript
import { z } from 'zod';
import { fetchx } from '@gwakko/fetch-x';

// Instantiate and configure fetchx
const api = fetchx('https://jsonplaceholder.typicode.com', { mode: 'cors' });

const TodoSchema = z.object({
    userId: z.number(),
    id: z.number(),
    title: z.string(),
    completed: z.boolean()
});

const TodosSchema = z.array(TodoSchema);

const GeoSchema = z.object({
    lat: z.string(),
    lng: z.string()
});

const AddressSchema = z.object({
    street: z.string(),
    suite: z.string(),
    city: z.string(),
    zipcode: z.string(),
    geo: GeoSchema
});

const CompanySchema = z.object({
    name: z.string(),
    catchPhrase: z.string(),
    bs: z.string()
});

const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    username: z.string(),
    email: z.string(),
    address: AddressSchema,
    phone: z.string(),
    website: z.string(),
    company: CompanySchema
});

const UsersArraySchema = z.array(UserSchema);

try {
    // Fetch todos
    const todos = await api.url('/todos').get().reslover(TodosSchema).validated();
    // const todos = await api.url('/todos').get().json(); // without validation
    const todo = todos.at(0);
    const todoUser = await api.resolver(UserSchema).url(`/users?id=${todo.userId}`).get().validated();

    // Create a new todo
    const newTodo = await api.url('/todos').post({
        userId: todoUser.id,
        title: "New Todo",
        completed: false
    });

    // Patch it
    await api.url(`/todos/${newTodo.id}`).patch({
        completed: true
    });

    // Fetch it
    const todo2 = await api.resolver(TodosSchema).url(`/todos/${newTodo.id}`).get().validated();
} catch (error) {
    // The API could return an empty object - in which case the status text is logged instead.
    const message =
        typeof error.message === "object" && Object.keys(error.message).length > 0
            ? JSON.stringify(error.message)
            : error.response.statusText
    console.error(`${error.status}: ${message}`)
}
```

# API

### FetchX defaults

These methods are available from the main default export and can be used to instantiate wretch and configure it
globally.

```typescript
import { fetchx } from '@gwakko/fetch-x';

fetchx.defaults.baseUrl = 'http://base.api';
fetchx.defaults.interceptors.request.push((request) => {
});
fetchx.defaults.interceptors.response.push((response) => {
})
fetchx.defaults.headers = {
    'Some-header': 'test',
};
fetchx.defaults.requestOptions = {
    cache: 'no-cache',
    credentials: 'include',
};
fetchx.defaults.catches.set(404, (exception) => {
});
```

### Helper Methods

Helper Methods are used to configure the request and program actions.

```typescript
fetchx()
    .url('/posts/1')
    .headers({ 'Cache-Control': 'no-cache' })
    .contentType('text/html')
```

### HTTP Methods

Sets the HTTP method and sends the request.

Calling an HTTP method ends the request chain and returns a response chain.
You can pass optional body arguments to these methods.

```typescript
fetchx().url('/url').get();
fetchx().url('/url').post({ json: 'body' });
```

**NOTE:** The Content-Type header will be automatically set based on the datatype of the body in a fetch request:

    Object/JSON:
        DataType: Object
        Header: application/json

    FormData:
        DataType: FormData
        Header: multipart/form-data

    Text:
        DataType: string
        Header: text/plain

Ensure that your server is correctly configured to handle the respective Content-Type headers for the data you're
sending. Adjust fetch headers manually if a different Content-Type is required for your specific use case.

### Catchers

Catchers are optional, but if none are provided an error will still be thrown for http error codes and it will be up to
you to catch it.

```typescript
import { fetchx } from '@gwakko/fetch-x';

fetchx('...')
    .badRequest((err) => console.log(err.status))
    .unauthorized((err) => console.log(err.status))
    .forbidden((err) => console.log(err.status))
    .notFound((err) => console.log(err.status))
    .timeout((err) => console.log(err.status))
    .internalError((err) => console.log(err.status))
    .error(418, (err) => console.log(err.status))
    .fetchError((err) => console.log(err))
    .get()
    .response();
```

The error passed to catchers is enhanced with additional properties.

```typescript
interface ApiResponseException {
    status: number;
    response: Response;
    url: string;
    text?: string;
    json?: unknown;
}
```

### Response Types

Setting the final response body type ends the chain and returns a regular promise.

All these methods accept an optional callback, and will return a Promise
resolved with either the return value of the provided callback or the expected
type.

```js
// Without a callback
fetchx('...').get().json().then(json => /* json is the parsed json of the response body */)
// Without a callback using await
const json = await fetchx("...").get().json()
// With a callback the value returned is passed to the Promise
fetchx('...').get().json(json => "Hello world!").then(console.log) // => Hello world!
```

_If an error is caught by catchers, the response type handler will not be
called._

### QueryString

Used to construct and append the query string part of the URL from an object.

```typescript
fetchx('http://example.com').searchParams({ page: String(1), hello: 'world' }); // url is now http://example.com?page=1&hello=world
fetchx('http://example.com?some=prop').searchParams({ page: String(1), hello: 'world' }); // url is now http://example.com?some=prop&page=1&hello=world
fetchx('http://example.com?some=prop').searchParams({ page: String(1), hello: 'world' }, true); // url is now http://example.com?page=1&hello=world
```

### Abort

```typescript
const abortController = new AbortController();

fetchx('...')
    .abortController(abortController)
    .onAbort((_) => console.log('Aborted!'))
    .get()
    .text((_) => console.log('should never be called'));

abortController.abort();
```

# TODO

- Add Progress Upload & Download

# License

MIT
