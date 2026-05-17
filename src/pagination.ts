/** Cursor-based auto-pagination iterators. */

/** Maximum pages to fetch before stopping (safety limit). */
const DEFAULT_MAX_PAGES = 1000;

export interface PageResponse<T> {
  data: T[];
  hasMore: boolean;
  cursor: string | null;
}

/**
 * Auto-paginating async iterator.
 *
 * @example
 * ```ts
 * for await (const result of client.screener.run({ peMax: 20 })) {
 *   console.log(result.symbol);
 * }
 * ```
 */
export class Paginator<T> implements AsyncIterable<T> {
  private fetchPage: (cursor?: string | null) => Promise<PageResponse<T>>;
  private maxPages: number;

  constructor(
    fetchPage: (cursor?: string | null) => Promise<PageResponse<T>>,
    options?: { maxPages?: number }
  ) {
    this.fetchPage = fetchPage;
    this.maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    let cursor: string | null = null;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore && pageCount < this.maxPages) {
      const page = await this.fetchPage(cursor);
      pageCount++;

      for (const item of page.data) {
        yield item;
      }

      hasMore = page.hasMore;
      cursor = page.cursor;
    }
  }

  /** Iterate page by page instead of item by item. */
  async *pages(): AsyncGenerator<T[]> {
    let cursor: string | null = null;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore && pageCount < this.maxPages) {
      const page = await this.fetchPage(cursor);
      pageCount++;
      yield page.data;

      hasMore = page.hasMore;
      cursor = page.cursor;
    }
  }

  /** Take up to `n` items then stop paginating. */
  async take(n: number): Promise<T[]> {
    const results: T[] = [];
    for await (const item of this) {
      results.push(item);
      if (results.length >= n) break;
    }
    return results;
  }

  /** Collect all results into an array. Use with caution on large datasets. */
  async toArray(): Promise<T[]> {
    const results: T[] = [];
    for await (const item of this) {
      results.push(item);
    }
    return results;
  }
}
