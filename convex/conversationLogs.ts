import { v } from 'convex/values';
import { query, internalMutation } from './_generated/server';

export const listConversationLogs = query({
  args: {
    worldId: v.id('worlds'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query('conversationLogs')
      .withIndex('byWorldTime', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .take(args.limit ?? 20);
    return logs;
  },
});

export const getConversationLog = query({
  args: {
    worldId: v.id('worlds'),
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    const log = await ctx.db
      .query('conversationLogs')
      .withIndex('byConversation', (q) =>
        q.eq('worldId', args.worldId).eq('conversationId', args.conversationId),
      )
      .unique();
    return log;
  },
});

export const cleanupOldLogs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const oldLogs = await ctx.db
      .query('conversationLogs')
      .filter((q) => q.lt(q.field('endedAt'), cutoff))
      .take(100);
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }
  },
});
