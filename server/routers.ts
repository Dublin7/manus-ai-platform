import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Chat feature routers
  chat: router({
    createConversation: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
        model: z.string().default("gpt-4"),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createChatConversation({
          userId: ctx.user.id,
          title: input.title,
          model: input.model,
        });
        const conversations = await db.getChatConversations(ctx.user.id);
        return conversations[conversations.length - 1];
      }),

    getConversations: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getChatConversations(ctx.user.id);
      }),

    getConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const conversation = await db.getChatConversation(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const messages = await db.getChatMessages(input.conversationId);
        return { conversation, messages };
      }),

    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        message: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await db.getChatConversation(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Save user message
        await db.addChatMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.message,
        });

        // Get LLM response
        const messages = await db.getChatMessages(input.conversationId);
        const llmMessages = messages.map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }));

        const msgArray: Array<{ role: "user" | "assistant" | "system"; content: string }> = llmMessages;
        const response = await invokeLLM({
          messages: msgArray,
        });

        const assistantContent = response.choices[0]?.message?.content;
        const assistantMsg = typeof assistantContent === 'string' ? assistantContent : "";

        // Save assistant message
        await db.addChatMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: assistantMsg,
        });

        return { message: assistantMsg };
      }),
  }),

  // Image generation feature routers
  image: router({
    generate: protectedProcedure
      .input(z.object({
        prompt: z.string(),
        model: z.enum(["flux", "imagen", "gpt-image-1"]).default("flux"),
      }))
      .mutation(async ({ ctx, input }) => {
        const generations = await db.getImageGenerations(ctx.user.id);
        const generation = generations[generations.length - 1];

        try {
          const result = await generateImage({
            prompt: input.prompt,
          });

          if (generation) {
            await db.updateImageGeneration(generation.id, {
              imageUrl: result.url,
              status: "completed",
            });
          }

          return { success: true, imageUrl: result.url };
        } catch (error) {
          if (generation) {
            await db.updateImageGeneration(generation.id, {
              status: "failed",
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate image",
          });
        }
      }),

    getHistory: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getImageGenerations(ctx.user.id);
      }),
  }),

  // Multi-bot comparison feature routers
  multiBot: router({
    compare: protectedProcedure
      .input(z.object({
        prompt: z.string(),
        models: z.array(z.string()).min(2).max(4),
      }))
      .mutation(async ({ ctx, input }) => {
        const responses: Record<string, string> = {};

        for (const model of input.models) {
          try {
            const msgArray: Array<{ role: "user"; content: string }> = [
              { role: "user" as const, content: input.prompt },
            ];
            const response = await invokeLLM({
              messages: msgArray as Array<{ role: "user" | "assistant" | "system"; content: string }>,
            });
            const content = response.choices[0]?.message?.content;
            responses[model] = typeof content === 'string' ? content : "";
          } catch (error) {
            responses[model] = "Error generating response";
          }
        }

        await db.createMultiBotSession({
          userId: ctx.user.id,
          prompt: input.prompt,
          models: input.models,
          responses,
        });

        const sessions = await db.getMultiBotSessions(ctx.user.id);
        const session = sessions[sessions.length - 1];
        return { session, responses };
      }),

    getSessions: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getMultiBotSessions(ctx.user.id);
      }),
  }),

  // Text-to-speech feature routers
  tts: router({
    generate: protectedProcedure
      .input(z.object({
        text: z.string(),
        voice: z.string().default("alloy"),
      }))
      .mutation(async ({ ctx, input }) => {
        const generations = await db.getTextToSpeechGenerations(ctx.user.id);
        const generation = generations[generations.length - 1];

        // TODO: Integrate ElevenLabs API
        // For now, return a placeholder
        if (generation) {
          await db.updateTextToSpeechGeneration(generation.id, {
            status: "completed",
            audioUrl: "https://example.com/audio.mp3",
          });
        }

        return { success: true, audioUrl: "https://example.com/audio.mp3" };
      }),

    getHistory: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getTextToSpeechGenerations(ctx.user.id);
      }),
  }),

  // Video generation feature routers
  video: router({
    generate: protectedProcedure
      .input(z.object({
        prompt: z.string(),
        model: z.enum(["sora", "veo"]).default("sora"),
      }))
      .mutation(async ({ ctx, input }) => {
        const generations = await db.getVideoGenerations(ctx.user.id);
        const generation = generations[generations.length - 1];

        // TODO: Integrate Sora/Veo API
        // For now, return a placeholder
        if (generation) {
          await db.updateVideoGeneration(generation.id, {
            status: "completed",
            videoUrl: "https://example.com/video.mp4",
          });
        }

        return { success: true, videoUrl: "https://example.com/video.mp4" };
      }),

    getHistory: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getVideoGenerations(ctx.user.id);
      }),
  }),

  // Research feature routers
  research: router({
    search: protectedProcedure
      .input(z.object({
        query: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createResearchSession({
          userId: ctx.user.id,
          query: input.query,
          status: "pending",
        });

        try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system" as const,
              content: "You are a research assistant. Provide comprehensive research findings with sources.",
            },
            {
              role: "user" as const,
              content: `Research the following topic and provide detailed findings: ${input.query}`,
            },
          ] as Array<{ role: "system" | "user"; content: string }>,
        });

          const findingsContent = response.choices[0]?.message?.content;
          const findings = typeof findingsContent === 'string' ? findingsContent : "";

          const sessions = await db.getResearchSessions(ctx.user.id);
          const latestSession = sessions[0];
          if (latestSession) {
            await db.updateResearchSession(latestSession.id, {
              findings,
              status: "completed",
            });
          }

          return { success: true, findings };
        } catch (error) {
          const sessions = await db.getResearchSessions(ctx.user.id);
          const latestSession = sessions[0];
          if (latestSession) {
            await db.updateResearchSession(latestSession.id, {
              status: "failed",
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to perform research",
          });
        }
      }),

    getSessions: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getResearchSessions(ctx.user.id);
      }),
  }),

  // Code assistance feature routers
  code: router({
    createSession: protectedProcedure
      .input(z.object({
        title: z.string(),
        language: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createCodeAssistanceSession({
          userId: ctx.user.id,
          title: input.title,
          language: input.language,
        });
        const sessions = await db.getCodeAssistanceSessions(ctx.user.id);
        return sessions[sessions.length - 1];
      }),

    getSessions: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getCodeAssistanceSessions(ctx.user.id);
      }),

    getAssistance: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        code: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessions = await db.getCodeAssistanceSessions(ctx.user.id);
        const currentSession = sessions.find(s => s.id === input.sessionId);

        if (!currentSession) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        try {
          const msgArray: Array<{ role: "system" | "user"; content: string }> = [
            {
              role: "system" as const,
              content: "You are an expert code assistant. Provide helpful suggestions and improvements for the provided code.",
            },
            {
              role: "user" as const,
              content: `Review this ${currentSession.language} code and provide suggestions:\n\n${input.code}`,
            },
          ];
          const response = await invokeLLM({
            messages: msgArray,
          });

          const suggestionsContent = response.choices[0]?.message?.content;
          const suggestions = typeof suggestionsContent === 'string' ? suggestionsContent : "";

          await db.updateCodeAssistanceSession(input.sessionId, {
            code: input.code,
            suggestions,
          });

          return { suggestions };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get code assistance",
          });
        }
      }),
  }),

  // Workflow feature routers
  workflow: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        steps: z.array(z.object({
          toolId: z.string(),
          config: z.record(z.string(), z.unknown()),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createWorkflow({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          steps: input.steps,
        });
        const workflows = await db.getWorkflows(ctx.user.id);
        return workflows[workflows.length - 1];
      }),

    getWorkflows: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getWorkflows(ctx.user.id);
      }),

    getWorkflow: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const workflow = await db.getWorkflow(input.id);
        if (!workflow || workflow.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return workflow;
      }),

    execute: protectedProcedure
      .input(z.object({
        workflowId: z.number(),
        input: z.record(z.string(), z.unknown()),
      }))
      .mutation(async ({ ctx, input }) => {
        const workflow = await db.getWorkflow(input.workflowId);
        if (!workflow || workflow.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.createWorkflowExecution({
          workflowId: input.workflowId,
          userId: ctx.user.id,
          input: input.input,
          status: "running",
        });

        const executions = await db.getWorkflowExecutions(input.workflowId);
        const execution = executions[executions.length - 1];

        // TODO: Implement workflow execution engine
        if (execution) {
          await db.updateWorkflowExecution(execution.id, {
            status: "completed",
            output: { result: "Workflow executed successfully" },
          });
        }

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
