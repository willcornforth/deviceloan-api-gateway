import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AuthMiddleware, AuthenticatedRequest } from '../infra/middleware';

const authMiddleware = new AuthMiddleware();

export async function getProducts(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	// Authenticate the request
	const authResult = await authMiddleware.authenticate(request as AuthenticatedRequest, context);
	if (authResult) {
		return authResult; // Return 401 if authentication fails
	}

	// Optional: Check for specific permissions
	const authzResult = await authMiddleware.authorize(
		request as AuthenticatedRequest,
		context,
		['read:products'] // Required permissions
	);
	if (authzResult) {
		return authzResult; // Return 403 if authorization fails
	}

	// Your business logic here
	const authenticatedRequest = request as AuthenticatedRequest;
	context.log(`User ${authenticatedRequest.authUser?.sub} is accessing GET products`);

	return {
		status: 200,
		jsonBody: {
			message: 'Products retrieved successfully',
			data: [] // Your product data
		}
	};
}

app.http('getProducts', {
	methods: ['GET'],
	authLevel: 'anonymous',
	route: 'products',
	handler: getProducts
});
