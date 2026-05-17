import { describe, it, expect } from "vitest";
import { validateSymbol, validateSymbols } from "../src/validate";
import { ValidationError } from "../src/errors";

describe("validateSymbol", () => {
  it("passes for valid symbol", () => {
    expect(() => validateSymbol("AAPL")).not.toThrow();
    expect(() => validateSymbol("BRK.B")).not.toThrow();
    expect(() => validateSymbol("TSM")).not.toThrow();
  });

  it("throws ValidationError for empty string", () => {
    expect(() => validateSymbol("")).toThrow(ValidationError);
    expect(() => validateSymbol("")).toThrow("must be a non-empty string");
  });

  it("throws ValidationError for whitespace-only string", () => {
    expect(() => validateSymbol("   ")).toThrow(ValidationError);
  });

  it("throws for non-string values", () => {
    expect(() => validateSymbol(null as unknown as string)).toThrow(ValidationError);
    expect(() => validateSymbol(undefined as unknown as string)).toThrow(ValidationError);
    expect(() => validateSymbol(123 as unknown as string)).toThrow(ValidationError);
  });

  it("includes param name in error message", () => {
    expect(() => validateSymbol("", "ticker")).toThrow("ticker must be a non-empty string");
  });
});

describe("validateSymbols", () => {
  it("passes for valid array", () => {
    expect(() => validateSymbols(["AAPL", "GOOGL"])).not.toThrow();
  });

  it("throws for empty array", () => {
    expect(() => validateSymbols([])).toThrow(ValidationError);
    expect(() => validateSymbols([])).toThrow("must be a non-empty array");
  });

  it("throws for non-array", () => {
    expect(() => validateSymbols(null as unknown as string[])).toThrow(ValidationError);
  });

  it("throws if any symbol in array is invalid", () => {
    expect(() => validateSymbols(["AAPL", ""])).toThrow(ValidationError);
  });
});
