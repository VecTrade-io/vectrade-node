/**
 * Response key transformation utilities.
 *
 * The VecTrade API returns snake_case keys. This module provides helpers
 * to convert them to idiomatic camelCase for TypeScript consumers (§6.3).
 */

/** Convert a snake_case string to camelCase, preserving leading underscores. */
export function snakeToCamel(s: string): string {
  const match = s.match(/^(_*)(.*)/);
  const prefix = match?.[1] ?? "";
  const rest = match?.[2] ?? s;
  return prefix + rest.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** Recursively convert all keys in an object from snake_case to camelCase. */
export function camelCaseKeys<T = unknown>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => camelCaseKeys(item)) as T;
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[snakeToCamel(key)] = camelCaseKeys(value);
    }
    return result as T;
  }
  return obj as T;
}
