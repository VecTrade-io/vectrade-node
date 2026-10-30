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

type NewsArticlePayload = Omit<
  Partial<NewsArticle>,
  "summary" | "url" | "source" | "category" | "imageUrl"
> & {
  summary?: string | null;
  url?: string | null;
  source?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  uuid?: string;
  headline?: string;
  datetime?: string | null;
  related?: string[] | null;
  type?: string | null;
  image?: string | null;
};

function normalizeArticle(article: NewsArticlePayload): NewsArticle {
  const category = article.category ?? article.type;
  const imageUrl = article.imageUrl ?? article.image;
  return {
    id: article.id ?? article.uuid ?? "",
    title: article.title ?? article.headline ?? "",
    ...(article.summary != null ? { summary: article.summary } : {}),
    url: article.url ?? "",
    source: article.source ?? "",
    publishedAt: article.publishedAt ?? article.datetime ?? "",
    symbols: article.symbols ?? article.related ?? [],
    ...(category != null ? { category } : {}),
    ...(article.sentiment != null ? { sentiment: article.sentiment } : {}),
    ...(imageUrl != null ? { imageUrl } : {}),
  };
}

export class News {
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get latest financial news for a symbol. */
  async list(
    symbolOrOptions?:
      | string
      | {
          symbols?: string[];
          category?: string;
          limit?: number;
        }
  ): Promise<NewsArticle[]> {
    // If string passed directly, use the symbol-specific endpoint
    const symbols =
      typeof symbolOrOptions === "string" ? [symbolOrOptions] : (symbolOrOptions?.symbols ?? []);
    if (symbols.length === 0 || symbols.some((item) => !item.trim())) {
      throw new Error("A symbol is required. Pass a symbol string or options.symbols.");
    }
    const options = typeof symbolOrOptions === "object" ? symbolOrOptions : undefined;
    const limit = options?.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("News limit must be an integer between 1 and 100.");
    }
    const responses = await Promise.all(
      [...new Set(symbols)].map((item) =>
        this.client.request<{ articles: NewsArticlePayload[] }>(
          "GET",
          `/vq/news/${encodeURIComponent(item)}?limit=${encodeURIComponent(String(limit))}`
        )
      )
    );
    const uniqueArticles = new Map<string, NewsArticle>();
    for (const article of responses.flatMap((response) =>
      response.articles.map(normalizeArticle)
    )) {
      const key = article.id || `${article.title}\0${article.publishedAt}\0${article.source}`;
      if (!uniqueArticles.has(key)) uniqueArticles.set(key, article);
    }
    const normalizedArticles = [...uniqueArticles.values()].sort(
      (left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt)
    );
    const articles = options?.category
      ? normalizedArticles.filter((article) => article.category === options.category)
      : normalizedArticles;
    return articles.slice(0, limit);
  }

  /** Get a single news article by ID. */
  async get(articleId: string): Promise<NewsArticle> {
    const article = await this.client.request<NewsArticlePayload>(
      "GET",
      `/vq/news/articles/${encodeURIComponent(articleId)}`
    );
    return normalizeArticle(article);
  }
}
