export class BaseAuthException extends Error {
  constructor(
    public readonly errorCode: string,
    public override readonly message: string,
    public readonly extraData?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}