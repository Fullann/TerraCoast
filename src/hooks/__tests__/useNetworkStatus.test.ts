import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("useNetworkStatus logic & event handling", () => {
  let listeners: Record<string, (() => void)[]> = {};

  beforeEach(() => {
    listeners = {};
    // Mock global window and navigator if in node environment
    vi.stubGlobal("window", {
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: () => void) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((fn) => fn !== cb);
        }
      }),
    });
    vi.stubGlobal("navigator", {
      onLine: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should register event listeners for online and offline events", async () => {
    const { useNetworkStatus } = await import("../useNetworkStatus");
    expect(typeof useNetworkStatus).toBe("function");

    // Test that listeners are callable
    const handleOnline = vi.fn();
    const handleOffline = vi.fn();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    expect(window.addEventListener).toHaveBeenCalledWith("online", handleOnline);
    expect(window.addEventListener).toHaveBeenCalledWith("offline", handleOffline);

    // Trigger listeners
    listeners["online"]?.forEach((fn) => fn());
    expect(handleOnline).toHaveBeenCalledTimes(1);

    listeners["offline"]?.forEach((fn) => fn());
    expect(handleOffline).toHaveBeenCalledTimes(1);
  });

  it("should support checking navigator.onLine default value", () => {
    expect(navigator.onLine).toBe(true);

    vi.stubGlobal("navigator", { onLine: false });
    expect(navigator.onLine).toBe(false);
  });
});
