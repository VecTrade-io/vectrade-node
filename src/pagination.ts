/** Cursor-based auto-pagination iterators. */

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

  constructor(fetchPage: (cursor?: string | null) => Promise<PageResponse<T>>) {
    this.fetchPage = fetchPage;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const page = await this.fetchPage(cursor);

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

    while (hasMore) {
      const page = await this.fetchPage(cursor);
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
