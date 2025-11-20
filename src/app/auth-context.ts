/**
 * Authentication context representing the caller's identity and permissions.
 * This abstraction allows the application layer to make authorization decisions
 * without depending on infrastructure details (e.g., JWT validation).
 */
export type AuthContext = {
  authenticated: boolean;
  scopes: string[];
  subject?: string;
};