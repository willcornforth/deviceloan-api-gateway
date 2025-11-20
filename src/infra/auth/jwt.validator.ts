import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { auth0Config } from '../../config/auth.config';

export interface DecodedToken {
	sub: string;
	permissions?: string[];
	scope?: string;
	[key: string]: any;
}

export class JwtValidator {
	private client: jwksClient.JwksClient;

	constructor() {
		this.client = jwksClient({
			jwksUri: `https://${auth0Config.domain}/.well-known/jwks.json`,
			cache: true,
			cacheMaxAge: 86400000, // 24 hours
			rateLimit: true
		});
	}

	private getSigningKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void => {
		this.client.getSigningKey(header.kid, (err, key) => {
			if (err) {
				callback(err);
				return;
			}
			const signingKey = key?.getPublicKey();
			callback(null, signingKey);
		});
	};

	public async validateToken(token: string): Promise<DecodedToken> {
		return new Promise((resolve, reject) => {
			jwt.verify(
				token,
				this.getSigningKey,
				{
					audience: auth0Config.audience,
					issuer: auth0Config.issuer,
					algorithms: ['RS256']
				},
				(err, decoded) => {
					if (err) {
						reject(err);
					} else {
						resolve(decoded as DecodedToken);
					}
				}
			);
		});
	}
}
