import { v } from 'convex/values';
import { inputHandler } from './inputHandler';

export const sceneInputs = {
  switchScene: inputHandler({
    args: {
      sceneId: v.string(),
    },
    handler: (game, _now, args) => {
      game.world.sceneId = args.sceneId;
      return { sceneId: args.sceneId };
    },
  }),
};
