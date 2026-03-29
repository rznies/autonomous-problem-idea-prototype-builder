import 'dotenv/config';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Agent, run, setTracingDisabled, tool } from '@openai/agents';
import { aisdk } from '@openai/agents-extensions/ai-sdk';
import { z } from 'zod';

type AppModel = ReturnType<typeof aisdk>;

function getGeminiModel(modelName = 'gemini-2.5-flash'): AppModel {
  const geminiApiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!geminiApiKey) {
    throw new Error(
      'Missing Gemini API key. Set GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) in your environment.',
    );
  }

  const provider = createGoogleGenerativeAI({ apiKey: geminiApiKey });
  return aisdk(provider(modelName));
}

const calculatorTool = tool({
  name: 'calculator',
  description: 'Evaluate a simple arithmetic expression like (12 * 7) + 4.',
  parameters: z.object({
    expression: z.string().min(1),
  }),
  execute: async ({ expression }) => {
    const cleaned = expression.replace(/[^-+*/().\d\s]/g, '');
    if (!cleaned.trim()) {
      return 'Invalid expression.';
    }

    try {
      const result = Function(`"use strict"; return (${cleaned});`)();
      return String(result);
    } catch {
      return 'Could not evaluate expression.';
    }
  },
});

const timelineTool = tool({
  name: 'timeline_lookup',
  description: 'Return a concise timeline for a known historical topic.',
  parameters: z.object({
    topic: z.string().min(2),
  }),
  execute: async ({ topic }) => {
    const normalized = topic.toLowerCase();

    if (normalized.includes('french revolution')) {
      return '1789: Estates-General and Bastille. 1792: Monarchy abolished. 1793: Louis XVI executed. 1799: Napoleon seizes power.';
    }

    if (normalized.includes('world war 2') || normalized.includes('ww2')) {
      return '1939: War begins in Europe. 1941: US enters after Pearl Harbor. 1944: D-Day. 1945: Germany and Japan surrender.';
    }

    return 'No local timeline found; provide a brief high-level answer and note uncertainty.';
  },
});

function buildAgents(model: AppModel) {
  const mathTutorAgent = new Agent({
    name: 'Math Tutor',
    instructions:
      'Help with math questions, show steps clearly, and use calculator tool for arithmetic when useful.',
    model,
    tools: [calculatorTool],
  });

  const historyTutorAgent = new Agent({
    name: 'History Tutor',
    instructions:
      'Help with history questions, provide context, and use timeline_lookup when a known topic matches.',
    model,
    tools: [timelineTool],
  });

  const triageAgent = Agent.create({
    name: 'Triage Agent',
    instructions:
      'Route the user to the best specialist. Use History Tutor for historical questions and Math Tutor for numeric or equation-style questions.',
    model,
    handoffs: [historyTutorAgent, mathTutorAgent],
  });

  return { triageAgent };
}

async function main() {
  if (process.env.OPENAI_AGENTS_DISABLE_TRACING === '1') {
    setTracingDisabled(true);
  }

  const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
  const input = process.argv.slice(2).join(' ').trim();

  if (!input) {
    throw new Error('Please pass a prompt, e.g. npm run dev -- "Who started the French Revolution?"');
  }

  const model = getGeminiModel(modelName);
  const { triageAgent } = buildAgents(model);

  const result = await run(triageAgent, input);

  console.log(`\nAgent: ${result.lastAgent?.name ?? 'Unknown Agent'}`);
  console.log(`Response: ${result.finalOutput}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
