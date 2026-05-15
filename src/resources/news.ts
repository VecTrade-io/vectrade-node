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
  private client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get latest financial news. */
  async list(options?: { symbols?: string[]; category?: string; limit?: number }): Promise<NewsArticle[]> {
    const params: Record<string, string> = {
      limit: String(options?.limit ?? 20),
    };
    if (options?.symbols) {
      params.symbols = options.symbols.join(",");
    }
    if (options?.category) {
      params.category = options.category;
    }
    const response = await this.client.request<{ data: NewsArticle[] }>("GET", "/vq/news", { params });
    return response.data;
  }

  /** Get a single news article by ID. */
  async get(articleId: string): Promise<NewsArticle> {
    return this.client.request<NewsArticle>("GET", `/vq/news/${encodeURIComponent(articleId)}`);
  }
}
