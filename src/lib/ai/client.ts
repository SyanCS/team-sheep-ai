import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'X-Title': 'Team Sheep AI',
  },
})

const model = process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.3-70b-instruct:free'

export const chatModel = openrouter(model)
