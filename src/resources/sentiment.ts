import type { VecTrade } from "../client";
import { validateSymbol } from "../validate";

export interface SocialSentiment {
  twitter_sentiment?: number;
  reddit_sentiment?: number;
  stocktwits_sentiment?: number;
  mentions_24h?: number;
}

export interface NewsSentimentBreakdown {
  positive?: number;
  neutral?: number;
  negative?: number;
}

export interface SentimentResponse {
  sentiment_score?: number;
  signal?: string;
  sentiment_trend?: string;
  news_sentiment_breakdown?: NewsSentimentBreakdown;
  social_sentiment?: SocialSentiment;
}

export class Sentiment {
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get sentiment analysis (score, signal, social mentions) for a symbol. */
  async get(symbol: string): Promise<SentimentResponse> {
    validateSymbol(symbol);
    return this.client.request<SentimentResponse>(
      "GET",
      `/vq/sentiment/${encodeURIComponent(symbol)}`,
    );
  }
}
