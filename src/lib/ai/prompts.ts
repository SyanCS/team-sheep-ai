import { readFileSync } from 'fs'
import path from 'path'
import promptConfig from '../../../prompts/answerPrompt.json'

// Load once at module initialisation — avoids repeated sync I/O per request.
const template = readFileSync(
  path.join(process.cwd(), 'prompts', 'template.txt'),
  'utf-8'
)

export function buildSystemPrompt(context: string): string {
  const instructions = promptConfig.instructions.map((i) => `- ${i}`).join('\n')
  const tone = promptConfig.constraints.tone ?? 'professional'
  const format = promptConfig.constraints.format ?? 'clear text'

  return template
    .replace(/\{role\}/g, promptConfig.role)
    .replace(/\{task\}/g, promptConfig.task)
    .replace(/\{instructions\}/g, instructions)
    .replace(/\{tone\}/g, tone)
    .replace(/\{format\}/g, format)
    .replace(
      /\{context\}/g,
      context.trim() || '(No relevant excerpts from uploaded documents.)'
    )
}
