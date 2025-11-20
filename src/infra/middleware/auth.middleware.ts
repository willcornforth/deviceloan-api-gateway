import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { JwtValidator, DecodedToken } from '../auth/jwt.validator';

export interface AuthenticatedRequest extends HttpRequest {
	authUser?: DecodedToken;
}

export class AuthMiddleware {
	private jwtValidator: JwtValidator;

	constructor() {
		this.jwtValidator = new JwtValidator();
	}

	private extractToken(request: HttpRequest): string | null {
		const authHeader = request.headers.get('authorization');
		
		if (!authHeader) {
			return null;
		}

		const parts = authHeader.split(' ');
		
		if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
			return null;
		}

		return parts[1];
	}

	public async authenticate(
		request: AuthenticatedRequest,
		context: InvocationContext
	): Promise<HttpResponseInit | null> {
		try {
			const token = this.extractToken(request);

			if (!token) {
				context.log('No token provided');
				return {
					status: 401,
					jsonBody: {
						error: 'Unauthorized',
						message: 'No authentication token provided'
					}
				};
			}

			const decoded = await this.jwtValidator.validateToken(token);
			request.authUser = decoded;
			
			context.log(`User authenticated: ${decoded.sub}`);
			return null; // null means authentication successful

		} catch (error) {
			context.log('Authentication failed:', error);
			return {
				status: 401,
				jsonBody: {
					error: 'Unauthorized',
					message: 'Invalid or expired token'
				}
			};
		}
	}

	public async authorize(
		request: AuthenticatedRequest,
		context: InvocationContext,
		requiredPermissions: string[]
	): Promise<HttpResponseInit | null> {
		if (!request.authUser) {
			return {
				status: 401,
				jsonBody: {
					error: 'Unauthorized',
					message: 'User not authenticated'
				}
			};
		}

		const userPermissions = request.authUser.permissions || [];
		const hasPermission = requiredPermissions.every(permission =>
			userPermissions.includes(permission)
		);

		if (!hasPermission) {
			context.log(`User ${request.authUser.sub} lacks required permissions: ${requiredPermissions.join(', ')}`);
			return {
				status: 403,
				jsonBody: {
					error: 'Forbidden',
					message: 'Insufficient permissions'
				}
			};
		}

		return null; // null means authorization successful
	}
}
