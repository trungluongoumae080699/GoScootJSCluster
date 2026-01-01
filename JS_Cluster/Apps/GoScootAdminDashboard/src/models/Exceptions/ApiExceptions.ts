export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);

    this.name = "ApiError";
    this.status = status;

    // Fix prototype chain (important when extending Error)
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}



export class UnauthenticatedException extends ApiError {
  constructor(message: string = "Unauthenticated") {
    super(401, message);

    this.name = "UnauthenticatedException";

    Object.setPrototypeOf(this, UnauthenticatedException.prototype);
  }
}
