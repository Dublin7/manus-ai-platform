import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  chatConversations, chatMessages, InsertChatConversation, InsertChatMessage,
  imageGenerations, InsertImageGeneration,
  multiBotSessions, InsertMultiBotSession,
  textToSpeechGenerations, InsertTextToSpeechGeneration,
  videoGenerations, InsertVideoGeneration,
  researchSessions, InsertResearchSession,
  codeAssistanceSessions, InsertCodeAssistanceSession,
  workflows, InsertWorkflow,
  workflowExecutions, InsertWorkflowExecution,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Chat conversation helpers
export async function createChatConversation(data: InsertChatConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(chatConversations).values(data);
  return result;
}

export async function getChatConversations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(chatConversations)
    .where(eq(chatConversations.userId, userId))
    .orderBy(desc(chatConversations.updatedAt));
}

export async function getChatConversation(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(chatConversations)
    .where(eq(chatConversations.id, conversationId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getChatMessages(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);
}

export async function addChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(chatMessages).values(data);
}

// Image generation helpers
export async function createImageGeneration(data: InsertImageGeneration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(imageGenerations).values(data);
}

export async function getImageGenerations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(imageGenerations)
    .where(eq(imageGenerations.userId, userId))
    .orderBy(desc(imageGenerations.createdAt));
}

export async function updateImageGeneration(id: number, data: Partial<InsertImageGeneration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(imageGenerations).set(data).where(eq(imageGenerations.id, id));
}

// Multi-bot session helpers
export async function createMultiBotSession(data: InsertMultiBotSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(multiBotSessions).values(data);
}

export async function getMultiBotSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(multiBotSessions)
    .where(eq(multiBotSessions.userId, userId))
    .orderBy(desc(multiBotSessions.createdAt));
}

// Text-to-speech helpers
export async function createTextToSpeechGeneration(data: InsertTextToSpeechGeneration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(textToSpeechGenerations).values(data);
}

export async function getTextToSpeechGenerations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(textToSpeechGenerations)
    .where(eq(textToSpeechGenerations.userId, userId))
    .orderBy(desc(textToSpeechGenerations.createdAt));
}

export async function updateTextToSpeechGeneration(id: number, data: Partial<InsertTextToSpeechGeneration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(textToSpeechGenerations).set(data).where(eq(textToSpeechGenerations.id, id));
}

// Video generation helpers
export async function createVideoGeneration(data: InsertVideoGeneration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(videoGenerations).values(data);
}

export async function getVideoGenerations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(videoGenerations)
    .where(eq(videoGenerations.userId, userId))
    .orderBy(desc(videoGenerations.createdAt));
}

export async function updateVideoGeneration(id: number, data: Partial<InsertVideoGeneration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(videoGenerations).set(data).where(eq(videoGenerations.id, id));
}

// Research session helpers
export async function createResearchSession(data: InsertResearchSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(researchSessions).values(data);
}

export async function getResearchSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(researchSessions)
    .where(eq(researchSessions.userId, userId))
    .orderBy(desc(researchSessions.createdAt));
}

export async function updateResearchSession(id: number, data: Partial<InsertResearchSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(researchSessions).set(data).where(eq(researchSessions.id, id));
}

// Code assistance helpers
export async function createCodeAssistanceSession(data: InsertCodeAssistanceSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(codeAssistanceSessions).values(data);
}

export async function getCodeAssistanceSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(codeAssistanceSessions)
    .where(eq(codeAssistanceSessions.userId, userId))
    .orderBy(desc(codeAssistanceSessions.updatedAt));
}

export async function updateCodeAssistanceSession(id: number, data: Partial<InsertCodeAssistanceSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(codeAssistanceSessions).set(data).where(eq(codeAssistanceSessions.id, id));
}

// Workflow helpers
export async function createWorkflow(data: InsertWorkflow) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(workflows).values(data);
}

export async function getWorkflows(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(workflows)
    .where(eq(workflows.userId, userId))
    .orderBy(desc(workflows.updatedAt));
}

export async function getWorkflow(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(workflows)
    .where(eq(workflows.id, id))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateWorkflow(id: number, data: Partial<InsertWorkflow>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(workflows).set(data).where(eq(workflows.id, id));
}

// Workflow execution helpers
export async function createWorkflowExecution(data: InsertWorkflowExecution) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(workflowExecutions).values(data);
}

export async function getWorkflowExecutions(workflowId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(workflowExecutions)
    .where(eq(workflowExecutions.workflowId, workflowId))
    .orderBy(desc(workflowExecutions.createdAt));
}

export async function updateWorkflowExecution(id: number, data: Partial<InsertWorkflowExecution>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(workflowExecutions).set(data).where(eq(workflowExecutions.id, id));
}
