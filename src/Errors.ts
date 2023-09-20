export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
export class InvalidAddressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAddressError";
  }
}

export class InsufficientFundsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientFundsError";
  }
}
