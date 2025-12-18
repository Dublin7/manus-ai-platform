import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: Array<{ name: string; options: Record<string, unknown> }> } {
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("Chat Router", () => {
  it("should create a conversation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.createConversation({
      title: "Test Chat",
      model: "gpt-4",
    });

    expect(result).toBeDefined();
    expect(result?.title).toBe("Test Chat");
    expect(result?.model).toBe("gpt-4");
  });

  it("should get conversations for user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation first
    await caller.chat.createConversation({
      title: "Test Chat",
      model: "gpt-4",
    });

    const conversations = await caller.chat.getConversations();
    expect(Array.isArray(conversations)).toBe(true);
  });
});

describe("Image Router", () => {
  it("should get image generation history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.image.getHistory();
    expect(Array.isArray(history)).toBe(true);
  });
});

describe("Multi-Bot Router", () => {
  it("should get multi-bot sessions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const sessions = await caller.multiBot.getSessions();
    expect(Array.isArray(sessions)).toBe(true);
  });
});

describe("Text-to-Speech Router", () => {
  it("should get TTS generation history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.tts.getHistory();
    expect(Array.isArray(history)).toBe(true);
  });
});

describe("Video Router", () => {
  it("should get video generation history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.video.getHistory();
    expect(Array.isArray(history)).toBe(true);
  });
});

describe("Research Router", () => {
  it("should get research sessions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const sessions = await caller.research.getSessions();
    expect(Array.isArray(sessions)).toBe(true);
  });
});

describe("Code Router", () => {
  it("should create a code session", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.code.createSession({
      title: "Test Code Session",
      language: "javascript",
    });

    expect(result).toBeDefined();
    expect(result?.title).toBe("Test Code Session");
    expect(result?.language).toBe("javascript");
  });

  it("should get code sessions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a session first
    await caller.code.createSession({
      title: "Test Code Session",
      language: "javascript",
    });

    const sessions = await caller.code.getSessions();
    expect(Array.isArray(sessions)).toBe(true);
  });
});

describe("Workflow Router", () => {
  it("should create a workflow", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.workflow.create({
      name: "Test Workflow",
      description: "A test workflow",
      steps: [
        { toolId: "chat", config: {} },
        { toolId: "image", config: {} },
      ],
    });

    expect(result).toBeDefined();
    expect(result?.name).toBe("Test Workflow");
    expect(result?.steps?.length).toBe(2);
  });

  it("should get workflows", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a workflow first
    await caller.workflow.create({
      name: "Test Workflow",
      description: "A test workflow",
      steps: [{ toolId: "chat", config: {} }],
    });

    const workflows = await caller.workflow.getWorkflows();
    expect(Array.isArray(workflows)).toBe(true);
  });

  it("should get a specific workflow", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a workflow first
    const created = await caller.workflow.create({
      name: "Test Workflow",
      description: "A test workflow",
      steps: [{ toolId: "chat", config: {} }],
    });

    if (created?.id) {
      const workflow = await caller.workflow.getWorkflow({ id: created.id });
      expect(workflow).toBeDefined();
      expect(workflow?.name).toBe("Test Workflow");
    }
  });
});

describe("Auth Router", () => {
  it("should get current user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();
    expect(user).toBeDefined();
    expect(user?.email).toBe("test@example.com");
  });

  it("should logout user", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBe(1);
  });
});
