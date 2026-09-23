import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { lazyWithRetry } from "../lazyWithRetry";

describe("lazyWithRetry", () => {
  let mockStorage: Record<string, string> = {};
  const reloadMock = vi.fn();

  beforeEach(() => {
    mockStorage = {};
    reloadMock.mockClear();

    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    });

    vi.stubGlobal("window", {
      location: {
        reload: reloadMock,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a React lazy exotic component", () => {
    const Component = lazyWithRetry(async () => ({
      default: () => null,
    }));
    expect(Component).toBeDefined();
    expect(typeof Component).toBe("object");
  });

  it("handles non-chunk errors by rethrowing", async () => {
    const Component = lazyWithRetry(async () => {
      throw new Error("Normal business error");
    });

    const init = (Component as any)._payload?._result;
    if (typeof init === "function") {
      await expect(init()).rejects.toThrow("Normal business error");
    }
  });

  it("triggers window.location.reload when a chunk load error occurs", async () => {
    const Component = lazyWithRetry(async () => {
      throw new Error(
        "Failed to fetch dynamically imported module: https://terracoast.ch/assets/LeaderboardPage-D42MZbCR.js"
      );
    });

    const init = (Component as any)._payload?._result;
    if (typeof init === "function") {
      init();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(reloadMock).toHaveBeenCalledTimes(1);
      expect(mockStorage["tc_chunk_reload_done"]).toBe("true");
    }
  });

  it("does not trigger reload if already reloaded in current session to prevent loops", async () => {
    mockStorage["tc_chunk_reload_done"] = "true";

    const Component = lazyWithRetry(async () => {
      throw new Error(
        "Failed to fetch dynamically imported module: https://terracoast.ch/assets/LeaderboardPage-D42MZbCR.js"
      );
    });

    const init = (Component as any)._payload?._result;
    if (typeof init === "function") {
      await expect(init()).rejects.toThrow("Failed to fetch dynamically imported module");
      expect(reloadMock).not.toHaveBeenCalled();
    }
  });
});
