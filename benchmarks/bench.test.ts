import { bench, describe } from "vitest";
import { VecTrade } from "../src/client";

describe("Client Initialization", () => {
  bench("create client", () => {
    new VecTrade({ apiKey: "vq_bench_key_placeholder12345" });
  });
});

describe("Error Parsing", () => {
  bench("parse API error response", () => {
    const errorBody = JSON.stringify({
      error: {
        type: "rate_limit_exceeded",
        message: "Rate limit exceeded. Retry after 1.5 seconds.",
      },
      request_id: "req_abc123def456",
    });
    JSON.parse(errorBody);
  });
});

describe("URL Construction", () => {
  bench("construct URL with params", () => {
    const base = "https://api.vectrade.io/v1";
    const path = "/vq/quotes/AAPL";
    const params = { fields: "price,volume,change", format: "json" };
    const url = new URL(path, base);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    url.toString();
  });
});
