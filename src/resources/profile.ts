import type { VecTrade } from "../client";
import { validateSymbol } from "../validate";

export interface CompanyInfo {
  name?: string;
  sector?: string;
  industry?: string;
  exchange?: string;
  website?: string;
  security_type?: string;
}

export interface LocationInfo {
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  phone?: string;
}

export interface ProfileResponse {
  ticker: string;
  source?: string;
  company?: CompanyInfo;
  location?: LocationInfo;
  overview?: Record<string, unknown>;
}

export class Profile {
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Get company profile (sector, industry, description, location). */
  async get(symbol: string): Promise<ProfileResponse> {
    validateSymbol(symbol);
    return this.client.request<ProfileResponse>("GET", `/vq/profile/${encodeURIComponent(symbol)}`);
  }
}
