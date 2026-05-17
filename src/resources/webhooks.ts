import type { VecTrade } from "../client";

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  description?: string | undefined;
  secret: string;
  active: boolean;
  createdAt: string;
}

export interface CreateWebhookParams {
  /** Destination URL for webhook delivery. */
  url: string;
  /** Event types to subscribe to. */
  events: string[];
  /** Optional description for the subscription. */
  description?: string;
}

export class WebhooksResource {
  private readonly client: VecTrade;

  constructor(client: VecTrade) {
    this.client = client;
  }

  /** Create a new webhook subscription. */
  async create(params: CreateWebhookParams): Promise<WebhookSubscription> {
    return this.client.request<WebhookSubscription>("POST", "/vq/webhooks", {
      body: JSON.stringify(params),
    });
  }

  /** List all webhook subscriptions. */
  async list(): Promise<WebhookSubscription[]> {
    const response = await this.client.request<{ data: WebhookSubscription[] }>(
      "GET",
      "/vq/webhooks"
    );
    return response.data;
  }

  /** Delete a webhook subscription by ID. */
  async delete(webhookId: string): Promise<void> {
    await this.client.request<void>("DELETE", `/vq/webhooks/${encodeURIComponent(webhookId)}`);
  }
}
