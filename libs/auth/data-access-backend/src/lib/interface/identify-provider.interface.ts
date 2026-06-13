export interface ExternalIdentityProfile {
  uid: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export abstract class IdentityProvider {
  abstract verifyToken(token: string): Promise<ExternalIdentityProfile>;
}