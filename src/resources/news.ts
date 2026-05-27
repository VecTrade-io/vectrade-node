import type { VecTrade } from "../client";

export interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  url: string;
  source: string;
  publishedAt: string;
  symbols: string[];
  category?: string;
  sentiment?: number;
  imageUrl?: string;
}

export class News {
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get latest financial news for a symbol. */
  async list(symbolOrOptions?: string | {
    symbols?: string[];
    category?: string;
    limit?: number;
  }): Promise<NewsArticle[]> {
    // If string passed directly, use the symbol-specific endpoint
    const symbol = typeof symbolOrOptions === "string" ? symbolOrOptions : symbolOrOptions?.symbols?.[0];
    if (!symbol) {
      throw new Error("A symbol is required. Pass a symbol string or options.symbols.");
    }
    const response = await this.client.request<{ articles: NewsArticle[] }>("GET", `/vq/news/${encodeURIComponent(symbol)}`);
    const limit = typeof symbolOrOptions === "object" ? (symbolOrOptions?.limit ?? 20) : 20;
    return response.articles.slice(0, limit);
  }

  /** Get a single news article by ID. */
  async get(articleId: string): Promise<NewsArticle> {
    return this.client.request<NewsArticle>("GET", `/vq/news/${encodeURIComponent(articleId)}`);
  }
}
