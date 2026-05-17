import type { VecTrade } from "../client";

/**
 * Developer self-service endpoints — key management, usage, and quota.
 *
 * These endpoints require authentication via API key or session token
 * with developer scope.
 */
export class Developer {
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** List all API keys for the authenticated user. */
  async listKeys(): Promise<ApiKeyResponse[]> {
    return this.client.request<ApiKeyResponse[]>("GET", "/vq/developer/keys");
  }

  /** Create a new API key. The raw key is returned only once. */
  async createKey(options: { label: string; scopes?: string[] }): Promise<ApiKeyCreated> {
    return this.client.request<ApiKeyCreated>("POST", "/vq/developer/keys", {
      body: JSON.stringify(options),
    });
  }

  /** Permanently revoke an API key. */
  async revokeKey(keyId: string): Promise<void> {
    await this.client.request<void>("DELETE", `/vq/developer/keys/${encodeURIComponent(keyId)}`);
  }

  /** Get aggregated API usage for the current billing period. */
  async getUsage(): Promise<UsageResponse> {
    return this.client.request<UsageResponse>("GET", "/vq/developer/usage");
  }

  /** Get per-day, per-endpoint usage breakdown. */
  async getDailyUsage(options?: { days?: number }): Promise<DailyUsageResponse[]> {
    const params: Record<string, string> = {};
    if (options?.days) {
      params.days = String(Math.min(options.days, 90));
    }
    return this.client.request<DailyUsageResponse[]>("GET", "/vq/developer/usage/daily", {
      params,
    });
  }

  /** Get the user's active subscription details. */
  async getPlan(): Promise<PlanResponse> {
    return this.client.request<PlanResponse>("GET", "/vq/developer/plan");
  }

  /** Check remaining API and token quota for the current billing period. */
  async getQuota(): Promise<QuotaResponse> {
    return this.client.request<QuotaResponse>("GET", "/vq/developer/quota");
  }
}

// Response types aligned with finance core VQ schemas

export interface ApiKeyResponse {
  id: string;
  keyPrefix: string;
  label: string;
  scopes: string[];
  createdAt: string;
}

export interface ApiKeyCreated extends ApiKeyResponse {
  rawKey: string;
}

export interface UsageResponse {
  period: string;
  totalRequests: number;
  aiRequests: number;
  errorCount: number;
  tokensUsed: number;
  quotaLimit: number;
  quotaRemaining: number;
}

export interface DailyUsageResponse {
  day: string;
  endpoint: string;
  method: string;
  callCount: number;
  errorCount: number;
  tokensUsed: number;
}

export interface PlanResponse {
  id: string;
  planId: string;
  planName: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

export interface QuotaResponse {
  planId: string;
  monthlyQuota: number;
  used: number;
  remaining: number;
  overagePolicy: string;
  resetAt: string;
}
