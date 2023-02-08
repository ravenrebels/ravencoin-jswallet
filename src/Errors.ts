export class ValidationError extends Error {
  constructor(message:string) {
    super(message); // (1)
    this.name = "ValidationError"; // (2)
  }
}
export class InvalidAddressError  extends Error {
  constructor(message:string) {
    super(message); // (1)
    this.name = "InvalidAddressError"; // (2)
  }
}


  export class InsufficientFundsError extends Error {
    constructor(message:string) {
      super(message); // (1)
      this.name = "InsufficientFundsError"; // (2)
    }
  }

  