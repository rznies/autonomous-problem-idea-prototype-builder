# OpenAI Agents SDK + Gemini Multi-Agent App

This project follows the OpenAI Agents JS quickstart pattern and runs a multi-agent flow using Gemini models via the AI SDK adapter.

## What this app does

- Uses `@openai/agents` for agent orchestration
- Uses `@openai/agents-extensions/ai-sdk` (`aisdk`) to plug in non-OpenAI models
- Uses `@ai-sdk/google` with a Gemini API key for model inference
- Runs a triage agent that hands off to:
  - a History Tutor agent (with a timeline tool)
  - a Math Tutor agent (with a calculator tool)

## Prerequisites

- Node.js 22+
- A Gemini API key from Google AI Studio

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file and set your key:

```bash
cp .env.example .env
```

3. Edit `.env` and set:

- `GEMINI_API_KEY`
- optional `GEMINI_MODEL` (default is `gemini-2.5-flash`)

## Run in dev mode

```bash
npm run dev -- "Who started the French Revolution and what happened in 1792?"
```

```bash
npm run dev -- "What is (145 * 12) + 78?"
```

## Build and run

```bash
npm run build
npm start -- "Compare the causes of WW2 and include key dates"
```

## Notes on tracing

OpenAI Agents SDK tracing is OpenAI-backed by default. When using Gemini only, keep this disabled unless you intentionally configure OpenAI trace export:

- set `OPENAI_AGENTS_DISABLE_TRACING=1`

## Key files

- `src/index.ts` - multi-agent app entrypoint
- `.env.example` - environment config template
- `tsconfig.json` - TypeScript config
