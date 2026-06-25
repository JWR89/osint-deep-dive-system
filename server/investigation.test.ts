import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("investigation router", () => {
  it("sources endpoint returns OSINT sources list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const sources = await caller.investigation.sources();
    
    expect(Array.isArray(sources)).toBe(true);
    expect(sources.length).toBeGreaterThan(0);
    
    // Verify structure
    const source = sources[0];
    expect(source).toHaveProperty("name");
    expect(source).toHaveProperty("category");
    expect(source).toHaveProperty("description");
    
    // Verify all 6 categories are represented
    const categories = [...new Set(sources.map(s => s.category))];
    expect(categories).toContain("identity");
    expect(categories).toContain("social_media");
    expect(categories).toContain("public_records");
    expect(categories).toContain("criminal");
    expect(categories).toContain("dating");
    expect(categories).toContain("professional");
  });

  it("start requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.investigation.start({ name: "John Doe" })
    ).rejects.toThrow();
  });

  it("list requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.investigation.list()
    ).rejects.toThrow();
  });

  it("status requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.investigation.status({ id: 1 })
    ).rejects.toThrow();
  });

  it("report requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.investigation.report({ id: 1 })
    ).rejects.toThrow();
  });

  it("delete requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.investigation.delete({ id: 1 })
    ).rejects.toThrow();
  });

  it("exportPdf requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.investigation.exportPdf({ id: 1 })
    ).rejects.toThrow();
  });
});
