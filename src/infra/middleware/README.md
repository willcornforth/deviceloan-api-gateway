# Auth0 Middleware

This middleware provides authentication and authorization for Azure Functions using Auth0.

## Setup

### 1. Install Dependencies

Dependencies have already been installed:
- `jwks-rsa` - For validating JWT tokens using Auth0's JWKS endpoint
- `jsonwebtoken` - For JWT token validation
- `@types/jsonwebtoken` - TypeScript types

### 2. Configure Auth0

Update `local.settings.json` with your Auth0 credentials:

```json
{
  "Values": {
    "AUTH0_DOMAIN": "your-tenant.auth0.com",
    "AUTH0_AUDIENCE": "your-api-identifier",
    "AUTH0_ISSUER": "https://your-tenant.auth0.com/"
  }
}
```

For production (Azure), set these as Application Settings in your Function App.

### 3. Auth0 API Configuration

In your Auth0 dashboard:
1. Create an API (or use existing)
2. Note the **Identifier** (this is your `AUTH0_AUDIENCE`)
3. Enable RBAC and Add Permissions in the Token
4. Define permissions (e.g., `read:products`, `write:products`)

## Usage

### Basic Authentication

Protect an endpoint with authentication only:

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AuthMiddleware, AuthenticatedRequest } from '../infra/middleware';

const authMiddleware = new AuthMiddleware();

export async function getProducts(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    // Authenticate the request
    const authResult = await authMiddleware.authenticate(
        request as AuthenticatedRequest, 
        context
    );
    if (authResult) {
        return authResult; // Returns 401 if authentication fails
    }

    // Access authenticated user
    const authenticatedRequest = request as AuthenticatedRequest;
    context.log(`User ID: ${authenticatedRequest.authUser?.sub}`);

    // Your business logic here
    return {
        status: 200,
        jsonBody: { message: 'Success' }
    };
}
```

### Authentication + Authorization

Protect an endpoint with both authentication and permission checks:

```typescript
export async function deleteProduct(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    const authMiddleware = new AuthMiddleware();

    // Authenticate
    const authResult = await authMiddleware.authenticate(
        request as AuthenticatedRequest, 
        context
    );
    if (authResult) return authResult;

    // Authorize - check for specific permissions
    const authzResult = await authMiddleware.authorize(
        request as AuthenticatedRequest,
        context,
        ['delete:products'] // Required permissions
    );
    if (authzResult) {
        return authzResult; // Returns 403 if user lacks permissions
    }

    // Your business logic here
    return {
        status: 200,
        jsonBody: { message: 'Product deleted' }
    };
}
```

### Multiple Permissions

Check for multiple permissions:

```typescript
const authzResult = await authMiddleware.authorize(
    request as AuthenticatedRequest,
    context,
    ['read:products', 'read:inventory'] // User must have BOTH permissions
);
```

## API Reference

### AuthMiddleware

#### `authenticate(request: AuthenticatedRequest, context: InvocationContext): Promise<HttpResponseInit | null>`

Validates the JWT token from the `Authorization` header.

- **Returns**: `null` if authentication succeeds, or `HttpResponseInit` with 401 status if it fails
- **Side effect**: Adds `authUser` property to the request object

#### `authorize(request: AuthenticatedRequest, context: InvocationContext, requiredPermissions: string[]): Promise<HttpResponseInit | null>`

Checks if the authenticated user has the required permissions.

- **Returns**: `null` if authorization succeeds, or `HttpResponseInit` with 403 status if it fails
- **Prerequisites**: Must call `authenticate()` first

### AuthenticatedRequest

Extends `HttpRequest` with:
- `authUser?: DecodedToken` - The decoded JWT token information

### DecodedToken

```typescript
interface DecodedToken {
    sub: string;              // User ID
    permissions?: string[];   // Array of permission strings
    scope?: string;          // OAuth scopes
    [key: string]: any;      // Other JWT claims
}
```

## Testing with Postman/cURL

### Get an Access Token

Use Auth0's test feature or your client application to get a token.

### Make Authenticated Requests

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     https://your-function-app.azurewebsites.net/api/products
```

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "No authentication token provided"
}
```

or

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

## File Structure

```
src/
├── config/
│   └── auth.config.ts          # Auth0 configuration
├── infra/
│   ├── auth/
│   │   └── jwt.validator.ts    # JWT validation logic
│   └── middleware/
│       ├── auth.middleware.ts  # Main middleware
│       └── index.ts            # Exports
└── functions/
    └── products.get.ts         # Example usage
```
