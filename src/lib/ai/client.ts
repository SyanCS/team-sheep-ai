import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'X-Title': 'Team Sheep AI',
  },
})

// Free tier model — 131K context window, strong reasoning
export const chatModel = openrouter('meta-llama/llama-3.3-70b-instruct:free')
