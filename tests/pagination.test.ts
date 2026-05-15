import { describe, it, expect } from "vitest";
import { Paginator } from "../src/pagination";

interface TestItem {
  id: number;
  name: string;
}

describe("Paginator", () => {
  it("iterates over a single page", async () => {
    const paginator = new Paginator<TestItem>(async (cursor) => ({
      data: [
        { id: 1, name: "first" },
        { id: 2, name: "second" },
      ],
      hasMore: false,
      cursor: null,
    }));

    const items: TestItem[] = [];
    for await (const item of paginator) {
      items.push(item);
    }
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe("first");
  });

  it("iterates across multiple pages", async () => {
    let callCount = 0;
    const paginator = new Paginator<TestItem>(async (cursor) => {
      callCount++;
      if (!cursor) {
        return { data: [{ id: 1, name: "a" }], hasMore: true, cursor: "page2" };
      }
      if (cursor === "page2") {
        return { data: [{ id: 2, name: "b" }], hasMore: true, cursor: "page3" };
      }
      return { data: [{ id: 3, name: "c" }], hasMore: false, cursor: null };
    });

    const items = await paginator.toArray();
    expect(items).toHaveLength(3);
    expect(callCount).toBe(3);
    expect(items[2].name).toBe("c");
  });

  it("handles empty first page", async () => {
    const paginator = new Paginator<TestItem>(async () => ({
      data: [],
      hasMore: false,
      cursor: null,
    }));

    const items = await paginator.toArray();
    expect(items).toHaveLength(0);
  });

  it("pages() yields page arrays", async () => {
    const paginator = new Paginator<TestItem>(async (cursor) => {
      if (!cursor) {
        return {
          data: [{ id: 1, name: "a" }, { id: 2, name: "b" }],
          hasMore: true,
          cursor: "p2",
        };
      }
      return {
        data: [{ id: 3, name: "c" }],
        hasMore: false,
        cursor: null,
      };
    });

    const pages: TestItem[][] = [];
    for await (const page of paginator.pages()) {
      pages.push(page);
    }
    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveLength(2);
    expect(pages[1]).toHaveLength(1);
  });

  it("supports take() to limit results", async () => {
    let callCount = 0;
    const paginator = new Paginator<TestItem>(async (cursor) => {
      callCount++;
      const id = callCount;
      return {
        data: [{ id, name: `item${id}` }],
        hasMore: true,
        cursor: `page${id + 1}`,
      };
    });

    const items = await paginator.take(3);
    expect(items).toHaveLength(3);
    // Should stop fetching once we have enough
    expect(callCount).toBe(3);
  });
});
