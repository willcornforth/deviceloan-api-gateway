import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { OAuth2Validator } from '../infra/oauth2-validator';

// Initialize OAuth2 validator with Auth0 configuration
const oauth2Validator = new OAuth2Validator({
	jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
	issuer: `https://${process.env.AUTH0_DOMAIN}/`,
	audience: process.env.AUTH0_AUDIENCE || '',
});

export async function getProducts(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	// Validate the OAuth2 token
	const authContext = await oauth2Validator.validate(request);

	// Check if user is authenticated
	if (!authContext.authenticated) {
		context.log('Authentication failed - no valid token provided');
		return {
			status: 401,
			jsonBody: {
				error: 'Unauthorized',
				message: 'Invalid or missing authentication token'
			}
		};
	}

	// Check for required scope
	if (!oauth2Validator.hasScope(authContext, 'read:products')) {
		context.log(`User ${authContext.subject} lacks required scope: read:products`);
		return {
			status: 403,
			jsonBody: {
				error: 'Forbidden',
				message: 'Insufficient permissions to access this resource'
			}
		};
	}

	// Business logic - user is authenticated and authorized
	context.log(`User ${authContext.subject} is accessing GET products`);

	return {
		status: 200,
		jsonBody: {
			message: 'Products retrieved successfully',
			user: authContext.subject,
			data: [] // Your product data here
		}
	};
}

app.http('getProducts', {
	methods: ['GET'],
	authLevel: 'anonymous',
	route: 'products',
	handler: getProducts
});
