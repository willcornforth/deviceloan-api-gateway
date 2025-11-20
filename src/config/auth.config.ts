export interface Auth0Config {
	domain: string;
	audience: string;
	issuer: string;
}

export const auth0Config: Auth0Config = {
	domain: process.env.AUTH0_DOMAIN || '',
	audience: process.env.AUTH0_AUDIENCE || '',
	issuer: process.env.AUTH0_ISSUER || `https://${process.env.AUTH0_DOMAIN}/`
};
