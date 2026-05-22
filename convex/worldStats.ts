import { v } from 'convex/values';
import { query } from './_generated/server';

export const getWorldStats = query({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) return null;

    const worldStatus = await ctx.db
      .query('worldStatus')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .unique();

    const activeConversations = world.conversations.filter(
      (c) => c.participants.some((p) => p.status.kind === 'participating'),
    ).length;

    const lastLog = await ctx.db
      .query('conversationLogs')
      .withIndex('byWorldTime', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .take(1);

    return {
      worldId: args.worldId,
      status: worldStatus?.status ?? 'unknown',
      simSpeed: worldStatus?.simSpeed ?? '1x',
      totalAgents: world.agents.length,
      totalPlayers: world.players.length,
      activeConversations,
      totalConversations: world.conversations.length,
      lastMessageTime: lastLog[0]?.endedAt ?? null,
      engineTime: worldStatus?.engineId ? (await ctx.db.get(worldStatus.engineId))?.currentTime ?? null : null,
    };
  },
});

export const getAgentStats = query({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) return [];

    const agentDescriptions = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    const playerDescriptions = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();

    const agentMap = new Map(agentDescriptions.map((d) => [d.agentId, d]));
    const playerMap = new Map(playerDescriptions.map((d) => [d.playerId, d]));

    return world.agents.map((agent) => {
      const desc = agentMap.get(agent.id);
      const playerDesc = playerMap.get(agent.playerId);
      return {
        agentId: agent.id,
        playerId: agent.playerId,
        name: playerDesc?.name ?? '未知',
        identity: desc?.identity ?? '',
        inConversation: world.conversations.some((c) =>
          c.participants.some((p) => p.playerId === agent.playerId),
        ),
        hasActiveOperation: !!agent.inProgressOperation,
      };
    });
  },
});

export const getRecentActivity = query({
  args: {
    worldId: v.id('worlds'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const logs = await ctx.db
      .query('conversationLogs')
      .withIndex('byWorldTime', (q) => q.eq('worldId', args.worldId))
      .order('desc')
      .take(limit);

    return logs.map((log) => ({
      conversationId: log.conversationId,
      participants: log.participants,
      startedAt: log.startedAt,
      endedAt: log.endedAt,
      messageCount: log.messageCount,
      duration: log.endedAt - log.startedAt,
    }));
  },
});
