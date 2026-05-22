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

// Response types aligned with auth gateway VQ schemas

export interface ApiKeyResponse {
  id: string;
  key_prefix: string;
  label: string;
  scopes: string;
  status: string;
  rate_limit_rpm: number | null;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ApiKeyCreated {
  id: string;
  raw_key: string;
  key_prefix: string;
  label: string;
  scopes: string;
  created_at: string;
}

export interface UsageResponse {
  period: string;
  total_requests: number;
  ai_requests: number;
  error_count: number;
  tokens_used: number;
  token_quota: number;
  token_remaining: number;
  quota_limit: number;
  quota_remaining: number;
  overage_calls: number;
  metering_type: string;
}

export interface DailyUsageResponse {
  day: string;
  endpoint: string;
  method: string;
  call_count: number;
  error_count: number;
  total_latency_ms: number;
  tokens_used: number;
}

export interface PlanResponse {
  plan_id: string;
  plan_name: string;
  status: string;
  monthly_quota: number;
  rate_limit_rpm: number;
  rate_limit_rps: number;
  max_keys: number;
  includes_ai: boolean;
  monthly_tokens: number;
  ai_prompts_per_day: number;
  metering_type: string;
  overage_policy: string;
  overage_cap_multiplier: number;
  monthly_price_usd: number;
  current_period_start: string;
  current_period_end: string;
}

export interface QuotaResponse {
  plan_id: string;
  monthly_quota: number;
  used: number;
  remaining: number;
  usage_pct: number;
  overage_policy: string;
  reset_at: string;
}
