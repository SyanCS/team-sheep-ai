import { readFileSync } from "fs";
import path from "path";

export interface PromptConfig {
  metadata?: { app?: string; version?: string; category?: string };
  task: string;
  role: string;
  instructions: string[];
  constraints: { language?: string; tone?: string; format?: string };
  context_rules?: {
    use_only_provided_context?: boolean;
    prefer_context_when_relevant?: boolean;
    cite_sources_from_context?: boolean;
    indicate_if_insufficient_context?: boolean;
  };
}

let cachedConfig: PromptConfig | null = null;
let cachedTemplate: string | null = null;

function getPromptsDir(): string {
  return path.join(process.cwd(), "prompts");
}

function loadConfig(): PromptConfig {
  if (cachedConfig) return cachedConfig;
  const filePath = path.join(getPromptsDir(), "answerPrompt.json");
  const raw = readFileSync(filePath, "utf-8");
  cachedConfig = JSON.parse(raw) as PromptConfig;
  return cachedConfig;
}

function loadTemplate(): string {
  if (cachedTemplate) return cachedTemplate;
  const filePath = path.join(getPromptsDir(), "template.txt");
  cachedTemplate = readFileSync(filePath, "utf-8");
  return cachedTemplate;
}

export function buildSystemPrompt(context: string): string {
  const config = loadConfig();
  const template = loadTemplate();

  const instructions = config.instructions
    .map((i) => `- ${i}`)
    .join("\n");
  const tone = config.constraints.tone ?? "professional";
  const format = config.constraints.format ?? "clear text";

  return template
    .replace(/\{role\}/g, config.role)
    .replace(/\{task\}/g, config.task)
    .replace(/\{instructions\}/g, instructions)
    .replace(/\{tone\}/g, tone)
    .replace(/\{format\}/g, format)
    .replace(/\{context\}/g, context.trim() || "(No relevant excerpts from uploaded documents.)");
}
