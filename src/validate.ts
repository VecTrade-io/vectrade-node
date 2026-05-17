import { ValidationError } from "./errors";

/**
 * Validate that a symbol string is non-empty and reasonable.
 * Throws ValidationError for obviously invalid inputs before hitting the network.
 */
export function validateSymbol(symbol: string, paramName = "symbol"): void {
  if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
    throw new ValidationError(`${paramName} must be a non-empty string`, {
      status: 0,
      errorCode: "INVALID_PARAM",
    });
  }
}

/**
 * Validate that an array of symbols is non-empty with valid entries.
 */
export function validateSymbols(symbols: string[], paramName = "symbols"): void {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new ValidationError(`${paramName} must be a non-empty array`, {
      status: 0,
      errorCode: "INVALID_PARAM",
    });
  }
  for (const s of symbols) {
    validateSymbol(s, paramName);
  }
}
