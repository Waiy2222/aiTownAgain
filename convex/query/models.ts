import { query } from '../_generated/server';
import { parseModelsEnv } from '../util/models';

export const listAvailableModels = query({
  args: {},
  handler: async () => {
    return parseModelsEnv(process.env.AVAILABLE_MODELS);
  },
});
