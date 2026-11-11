import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkDatabaseHealth,
  notifyDatabaseDown,
  notifyDatabaseRecovered,
  DATABASE_STATUS_EVENT,
} from "../databaseHealth";
import { supabase } from "../supabase";

describe("databaseHealth", () => {
  let eventListeners: Record<string, ((e: any) => void)[]> = {};

  beforeEach(() => {
    vi.restoreAllMocks();
    eventListeners = {};

    vi.stubGlobal("window", {
      addEventListener: (type: string, listener: any) => {
        if (!eventListeners[type]) eventListeners[type] = [];
        eventListeners[type].push(listener);
      },
      removeEventListener: (type: string, listener: any) => {
        if (eventListeners[type]) {
          eventListeners[type] = eventListeners[type].filter((l) => l !== listener);
        }
      },
      dispatchEvent: (event: any) => {
        const listeners = eventListeners[event.type] || [];
        listeners.forEach((l) => l(event));
        return true;
      },
    });

    vi.stubGlobal("CustomEvent", class CustomEvent {
      type: string;
      detail: any;
      constructor(type: string, params?: { detail?: any }) {
        this.type = type;
        this.detail = params?.detail;
      }
    });

    vi.stubGlobal("navigator", {
      onLine: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return isHealthy: true when query succeeds", async () => {
    vi.spyOn(supabase, "from").mockReturnValue({
      select: vi.fn().mockReturnValue({
        abortSignal: vi.fn().mockResolvedValue({
          data: null,
          error: null,
          status: 200,
        }),
      }),
    } as any);

    const result = await checkDatabaseHealth(3000);
    expect(result.isHealthy).toBe(true);
    expect(result.status).toBe(200);
  });

  it("should return isHealthy: false when status is 503 Service Unavailable", async () => {
    vi.spyOn(supabase, "from").mockReturnValue({
      select: vi.fn().mockReturnValue({
        abortSignal: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Service Unavailable", code: "503" },
          status: 503,
        }),
      }),
    } as any);

    const result = await checkDatabaseHealth(3000);
    expect(result.isHealthy).toBe(false);
    expect(result.status).toBe(503);
    expect(result.error).toContain("Service Unavailable");
  });

  it("should return isHealthy: false when network request fails with status 0", async () => {
    vi.spyOn(supabase, "from").mockReturnValue({
      select: vi.fn().mockReturnValue({
        abortSignal: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Failed to fetch", code: "" },
          status: 0,
        }),
      }),
    } as any);

    const result = await checkDatabaseHealth(3000);
    expect(result.isHealthy).toBe(false);
    expect(result.status).toBe(0);
  });

  it("should return isHealthy: false when PostgREST returns critical connection error code", async () => {
    vi.spyOn(supabase, "from").mockReturnValue({
      select: vi.fn().mockReturnValue({
        abortSignal: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database connection failed", code: "PGRST000" },
          status: 400,
        }),
      }),
    } as any);

    const result = await checkDatabaseHealth(3000);
    expect(result.isHealthy).toBe(false);
    expect(result.error).toBe("Database connection failed");
  });

  it("should return isHealthy: false when fetch throws an exception", async () => {
    vi.spyOn(supabase, "from").mockReturnValue({
      select: vi.fn().mockReturnValue({
        abortSignal: vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
      }),
    } as any);

    const result = await checkDatabaseHealth(3000);
    expect(result.isHealthy).toBe(false);
    expect(result.error).toContain("Failed to fetch");
  });

  it("should dispatch and receive global database status events", () => {
    const listener = vi.fn();
    window.addEventListener(DATABASE_STATUS_EVENT, listener);

    notifyDatabaseDown("Test downtime reason");
    expect(listener).toHaveBeenCalled();
    const event1 = listener.mock.calls[0][0] as CustomEvent;
    expect(event1.detail.isDown).toBe(true);
    expect(event1.detail.reason).toBe("Test downtime reason");

    notifyDatabaseRecovered();
    expect(listener).toHaveBeenCalledTimes(2);
    const event2 = listener.mock.calls[1][0] as CustomEvent;
    expect(event2.detail.isDown).toBe(false);

    window.removeEventListener(DATABASE_STATUS_EVENT, listener);
  });
});
